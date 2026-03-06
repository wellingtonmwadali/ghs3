import { CarRepository } from '../../infrastructure/repositories/Car.repository';
import { CustomerRepository } from '../../infrastructure/repositories/Customer.repository';
import { MechanicRepository } from '../../infrastructure/repositories/Mechanic.repository';
import { ICar, ICarFilters } from '../../domain/entities/Car';
import { AppError } from '../../presentation/middlewares/error.middleware';

export class CarService {
  private carRepository: CarRepository;
  private customerRepository: CustomerRepository;
  private mechanicRepository: MechanicRepository;

  constructor() {
    this.carRepository = new CarRepository();
    this.customerRepository = new CustomerRepository();
    this.mechanicRepository = new MechanicRepository();
  }

  async createCar(carData: ICar) {
    // Validate customer exists
    const customer = await this.customerRepository.findById(carData.customerId);
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    // Calculate days in garage
    carData.daysInGarage = 0;

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

    const car = await this.carRepository.create(carData);

    // Assign job to mechanic
    if (car.assignedMechanicId) {
      await this.mechanicRepository.assignJob(car.assignedMechanicId, car._id!.toString());
    }

    // Add to customer service history with proper structure
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

  async updateCar(id: string, updateData: Partial<ICar>) {
    const car = await this.carRepository.findById(id);
    if (!car) {
      throw new AppError('Car not found', 404);
    }

    // If stage is being changed to completed
    if (updateData.stage === 'completed' && car.stage !== 'completed') {
      updateData.completionDate = new Date();
      updateData.statusProgress = 100;

      // Mark job as completed for mechanic
      if (car.assignedMechanicId) {
        await this.mechanicRepository.completeJob(car.assignedMechanicId, id);
      }
    }

    // Calculate days in garage
    if (car.checkInDate) {
      const today = new Date();
      const checkIn = new Date(car.checkInDate);
      updateData.daysInGarage = Math.floor((today.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    }

    return await this.carRepository.update(id, updateData);
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

    // Get counts
    const totalCarsInGarage = await this.carRepository.countByFilters({
      stage: { $ne: 'completed' } as any
    });

    const carsCompletedToday = await this.carRepository.findCompletedToday();

    const carsWaitingPickup = await this.carRepository.countByStage('ready_pickup');

    const stages = ['waiting_inspection', 'in_repair', 'painting', 'detailing', 'quality_check'];
    const carsInProgress = await Promise.all(
      stages.map(stage => this.carRepository.countByStage(stage))
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
