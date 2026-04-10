import { CarRepository } from '../../infrastructure/repositories/Car.repository';
import { CustomerRepository } from '../../infrastructure/repositories/Customer.repository';
import { MechanicRepository } from '../../infrastructure/repositories/Mechanic.repository';
import { InvoiceRepository } from '../../infrastructure/repositories/Invoice.repository';
import { InventoryService } from './Inventory.service';
import { ICar, ICarFilters, CarStage } from '../../domain/entities/Car';
import { AppError } from '../../presentation/middlewares/error.middleware';
import { EnhancedError, ErrorFactory, ErrorHandler } from '../../utils/errorHandler';

// Stage progression order for progress calc
const STAGE_ORDER: CarStage[] = [
  'booked_in', 'waiting_inspection', 'diagnosed', 'awaiting_approval',
  'awaiting_parts', 'in_repair', 'painting', 'detailing',
  'quality_check', 'ready_pickup', 'completed', 'collected'
];

function stageProgress(stage: CarStage): number {
  const idx = STAGE_ORDER.indexOf(stage);
  if (idx === -1) return 0;
  return Math.round((idx / (STAGE_ORDER.length - 1)) * 100);
}

export class CarService {
  private carRepository: CarRepository;
  private customerRepository: CustomerRepository;
  private mechanicRepository: MechanicRepository;
  private invoiceRepository: InvoiceRepository;
  private inventoryService: InventoryService;

  constructor() {
    this.carRepository = new CarRepository();
    this.customerRepository = new CustomerRepository();
    this.mechanicRepository = new MechanicRepository();
    this.invoiceRepository = new InvoiceRepository();
    this.inventoryService = new InventoryService();
  }

  async createCar(carData: ICar) {
    // Validate customer exists
    const customer = await this.customerRepository.findById(carData.customerId);
    if (!customer) {
      throw ErrorFactory.notFound('Customer', carData.customerId);
    }

    // Check for duplicate vehicle plate in active services
    const existingCar = await this.carRepository.findByPlateNumber(carData.vehiclePlate, true);
    if (existingCar) {
      throw ErrorFactory.duplicateVehiclePlate(carData.vehiclePlate, existingCar.stage);
    }

    // Generate job card number
    carData.jobCardNumber = await this.carRepository.generateJobCardNumber();

    // Set defaults
    carData.daysInGarage = 0;
    if (!carData.stage) carData.stage = 'booked_in';
    if (!carData.jobType) carData.jobType = 'walk_in';
    if (!carData.priority) carData.priority = 'normal';
    carData.statusProgress = stageProgress(carData.stage);

    // Comeback warning — same plate + similar complaint within 30 days
    if (carData.complaint) {
      const recent = await this.carRepository.findRecentByPlateAndComplaint(
        carData.vehiclePlate,
        carData.complaint
      );
      if (recent) {
        carData.comebackWarning = true;
      }
    }

    // Auto-suggest mechanic if not assigned
    if (!carData.assignedMechanicId) {
      let specialization = 'all';
      if (carData.serviceType === 'colour_repair') specialization = 'painter';
      else if (carData.serviceType === 'clean_shine') specialization = 'detailer';
      else if (carData.serviceType === 'coat_guard') specialization = 'installer';

      const suggestedMechanic = await this.mechanicRepository.getSuggestedMechanic(specialization);
      if (suggestedMechanic) {
        carData.assignedMechanicId = suggestedMechanic._id?.toString();
        carData.assignedMechanicName = `${suggestedMechanic.firstName} ${suggestedMechanic.lastName}`;
      }
    }

    // Seed initial status history
    carData.statusHistory = [{
      stage: carData.stage,
      changedBy: carData.createdBy || 'system',
      changedByName: carData.createdByName || 'System',
      changedAt: new Date(),
      notes: 'Job card created'
    }];

    const car = await this.carRepository.create(carData);

    // Assign job to mechanic
    if (car.assignedMechanicId) {
      await this.mechanicRepository.assignJob(car.assignedMechanicId, car._id!.toString());
    }

    // Add to customer service history
    await this.customerRepository.addToServiceHistory(
      carData.customerId, 
      {
        date: new Date(),
        carId: car._id!.toString(),
        serviceDetails: `${carData.serviceType.replace('_', ' ')} - ${carData.vehicleModel}`,
        cost: carData.estimatedCost
      }
    );

    return car;
  }

  async getCarById(id: string) {
    const car = await this.carRepository.findById(id);
    if (!car) {
      throw new AppError('Car not found', 404);
    }
    return car;
  }

  async getAllCars(filters?: ICarFilters, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const cars = await this.carRepository.findAll(filters, limit, skip);
    const total = await this.carRepository.countByFilters(filters || {});

    return {
      cars,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateCar(id: string, updateData: Partial<ICar> & { lastModifiedBy?: string; lastModifiedByName?: string }) {
    const car = await this.carRepository.findById(id);
    if (!car) {
      throw new AppError('Car not found', 404);
    }

    const userId = updateData.lastModifiedBy || 'system';
    const userName = updateData.lastModifiedByName || 'System';

    // ── Pause / Resume handling ──
    if (updateData.isPaused === true && !car.isPaused) {
      const pauseRecord = {
        pausedAt: new Date(),
        reason: updateData.pauseReason || 'No reason given',
        pausedBy: userId,
        pausedByName: userName
      };
      await this.carRepository.pushToArray(id, 'pauseHistory', pauseRecord);
    } else if (updateData.isPaused === false && car.isPaused) {
      // Close the last open pause record
      const history = car.pauseHistory || [];
      const lastPause = history[history.length - 1];
      if (lastPause && !lastPause.resumedAt) {
        lastPause.resumedAt = new Date();
        updateData.pauseHistory = history as any;
      }
      updateData.pauseReason = undefined;
    }

    // ── Approval workflow ──
    if (updateData.approvalStatus && updateData.approvalStatus !== car.approvalStatus) {
      if (updateData.approvalStatus === 'approved' || updateData.approvalStatus === 'rejected') {
        updateData.approvedBy = userId;
        updateData.approvedByName = userName;
        updateData.approvedAt = new Date();
      }
      // Auto-advance stage on approval
      if (updateData.approvalStatus === 'approved' && car.stage === 'awaiting_approval') {
        updateData.stage = 'awaiting_parts' as CarStage;
      }
    }

    // ── Stage transition logic ──
    if (updateData.stage && updateData.stage !== car.stage) {
      const newStage = updateData.stage as CarStage;
      updateData.statusProgress = stageProgress(newStage);

      // Record in status history
      const historyEntry = {
        stage: newStage,
        changedBy: userId,
        changedByName: userName,
        changedAt: new Date(),
        notes: (updateData as any).stageNotes || undefined
      };
      await this.carRepository.pushToArray(id, 'statusHistory', historyEntry);

      // If car is being inspected (moving from waiting_inspection) and inspector not recorded
      if (
        newStage !== 'waiting_inspection' &&
        car.stage === 'waiting_inspection' &&
        !car.inspectedBy
      ) {
        updateData.inspectedBy = userId;
        updateData.inspectorName = userName;
      }

      // Completion handling
      if ((newStage === 'completed' || newStage === 'collected') && car.stage !== 'completed' && car.stage !== 'collected') {
        updateData.completionDate = new Date();
        updateData.statusProgress = newStage === 'collected' ? 100 : 95;

        // Auto-calculate actualCost from labor lines if not set
        if (!car.actualCost && car.laborLines && car.laborLines.length > 0) {
          const laborTotal = car.laborLines.reduce((sum, l) => sum + l.total, 0);
          const partsTotal = (car.partsUsed || []).reduce((sum, p) => sum + (p.unitPrice || 0) * p.quantity, 0);
          updateData.actualCost = laborTotal + partsTotal;
        }

        // Deduct inventory for parts used
        if (car.partsUsed && car.partsUsed.length > 0) {
          try {
            const partsToDeduct = car.partsUsed.map(part => ({
              itemId: part.itemId,
              quantity: part.quantity
            }));
            
            await this.inventoryService.deductMultipleItems(
              partsToDeduct,
              `Service completion for car ${car.vehiclePlate}`
            );
            
            console.log(`[INVENTORY] Auto-deducted ${partsToDeduct.length} items for car ${id}`);
          } catch (error) {
            console.error('[INVENTORY] Failed to deduct parts:', error);
          }
        }

        // Mark job as completed for mechanic
        if (car.assignedMechanicId) {
          await this.mechanicRepository.completeJob(car.assignedMechanicId, id);
        }
      }
    }

    // Update audit trail
    if (updateData.lastModifiedBy) {
      updateData.lastModifiedAt = new Date();
    }

    // Calculate days in garage
    if (car.checkInDate) {
      const today = new Date();
      const checkIn = new Date(car.checkInDate);
      updateData.daysInGarage = Math.floor((today.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    }

    // If payment information is being updated, sync with invoice
    if (updateData.paidAmount !== undefined || updateData.paymentStatus !== undefined) {
      const invoices = await this.invoiceRepository.findByCar(id);
      if (invoices && invoices.length > 0) {
        const invoice = invoices[0];
        const invoiceData = invoice as any;
        
        const newPaidAmount = updateData.paidAmount !== undefined ? updateData.paidAmount : invoiceData.paidAmount;
        const newBalance = invoiceData.total - newPaidAmount;
        
        let paymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
        if (newPaidAmount >= invoiceData.total) {
          paymentStatus = 'paid';
        } else if (newPaidAmount > 0) {
          paymentStatus = 'partial';
        }
        
        await this.invoiceRepository.update(invoiceData._id.toString(), {
          paidAmount: newPaidAmount,
          balance: newBalance,
          paymentStatus: updateData.paymentStatus || paymentStatus
        });
      }
    }

    // Clean up internal-only fields before save
    delete (updateData as any).stageNotes;

    return await this.carRepository.update(id, updateData);
  }

  // ── Pause / Resume helpers ──
  async pauseCar(id: string, reason: string, userId: string, userName: string) {
    return this.updateCar(id, {
      isPaused: true,
      pauseReason: reason,
      lastModifiedBy: userId,
      lastModifiedByName: userName
    });
  }

  async resumeCar(id: string, userId: string, userName: string) {
    return this.updateCar(id, {
      isPaused: false,
      lastModifiedBy: userId,
      lastModifiedByName: userName
    });
  }

  // ── Approval helpers ──
  async approveCar(id: string, notes: string, userId: string, userName: string) {
    return this.updateCar(id, {
      approvalStatus: 'approved',
      approvalNotes: notes,
      lastModifiedBy: userId,
      lastModifiedByName: userName
    });
  }

  async rejectCar(id: string, notes: string, userId: string, userName: string) {
    return this.updateCar(id, {
      approvalStatus: 'rejected',
      approvalNotes: notes,
      lastModifiedBy: userId,
      lastModifiedByName: userName
    });
  }

  async deleteCar(id: string) {
    const car = await this.carRepository.findById(id);
    if (!car) {
      throw new AppError('Car not found', 404);
    }

    return await this.carRepository.delete(id);
  }

  async getGarageBoardData() {
    return await this.carRepository.getGarageBoardData();
  }

  async getCarsByMechanic(mechanicId: string) {
    return await this.carRepository.findByMechanic(mechanicId);
  }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get counts — exclude completed + collected
    const totalCarsInGarage = await this.carRepository.countByFilters({
      stage: { $nin: ['completed', 'collected'] } as any
    });

    const carsCompletedToday = await this.carRepository.findCompletedToday();

    const carsWaitingPickup = await this.carRepository.countByStage('ready_pickup');

    const activeStages: CarStage[] = [
      'booked_in', 'waiting_inspection', 'diagnosed', 'awaiting_approval',
      'awaiting_parts', 'in_repair', 'painting', 'detailing', 'quality_check'
    ];
    const carsInProgress = await Promise.all(
      activeStages.map(stage => this.carRepository.countByStage(stage))
    );
    const totalInProgress = carsInProgress.reduce((a, b) => a + b, 0);

    // Get all mechanics
    const allMechanics = await this.mechanicRepository.findAll();
    const activeMechanics = allMechanics.filter(m => m.availability !== 'off').length;

    // Get workload distribution
    const workloadDistribution = await this.mechanicRepository.getWorkloadDistribution();

    return {
      totalCarsInGarage,
      carsCompletedToday: carsCompletedToday.length,
      carsWaitingPickup,
      carsInProgress: totalInProgress,
      activeMechanics,
      workloadDistribution
    };
  }
}
