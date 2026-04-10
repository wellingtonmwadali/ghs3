import { CarModel, ICarDocument } from '../models/Car.model';
import { ICar, ICarFilters } from '../../domain/entities/Car';

export class CarRepository {
  async create(carData: ICar): Promise<ICarDocument> {
    const car = new CarModel(carData);
    return await car.save();
  }

  async findById(id: string): Promise<ICarDocument | null> {
    return await CarModel.findById(id);
  }

  async findAll(filters?: ICarFilters, limit?: number, skip?: number): Promise<ICarDocument[]> {
    const query: any = {};
    
    if (filters?.stage) query.stage = filters.stage;
    if (filters?.serviceType) query.serviceType = filters.serviceType;
    if (filters?.assignedMechanicId) {
      query.$or = [
        { assignedMechanicId: filters.assignedMechanicId },
        { 'assignedTechnicians.technicianId': filters.assignedMechanicId }
      ];
    }
    if (filters?.paymentStatus) query.paymentStatus = filters.paymentStatus;
    if (filters?.jobType) query.jobType = filters.jobType;
    if (filters?.priority) query.priority = filters.priority;
    if (filters?.isPaused !== undefined) query.isPaused = filters.isPaused;
    if (filters?.bayNumber) query.bayNumber = filters.bayNumber;
    
    if (filters?.startDate || filters?.endDate) {
      query.checkInDate = {};
      if (filters.startDate) query.checkInDate.$gte = filters.startDate;
      if (filters.endDate) query.checkInDate.$lte = filters.endDate;
    }

    if (filters?.search) {
      const re = new RegExp(filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        ...(query.$or || []),
        { vehiclePlate: re },
        { vehicleModel: re },
        { customerName: re },
        { jobCardNumber: re }
      ];
      // If we already had $or from mechanic filter, wrap both in $and
      if (filters?.assignedMechanicId) {
        const mechOr = [
          { assignedMechanicId: filters.assignedMechanicId },
          { 'assignedTechnicians.technicianId': filters.assignedMechanicId }
        ];
        const searchOr = [
          { vehiclePlate: re },
          { vehicleModel: re },
          { customerName: re },
          { jobCardNumber: re }
        ];
        delete query.$or;
        query.$and = [{ $or: mechOr }, { $or: searchOr }];
      }
    }
    
    let queryBuilder = CarModel.find(query).sort({ checkInDate: -1 });
    
    if (skip) queryBuilder = queryBuilder.skip(skip);
    if (limit) queryBuilder = queryBuilder.limit(limit);
    
    return await queryBuilder;
  }

  async update(id: string, updateData: Partial<ICar>): Promise<ICarDocument | null> {
    return await CarModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  async pushToArray(id: string, field: string, value: any): Promise<ICarDocument | null> {
    return await CarModel.findByIdAndUpdate(id, { $push: { [field]: value } }, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await CarModel.findByIdAndDelete(id);
    return !!result;
  }

  async countByStage(stage: string): Promise<number> {
    return await CarModel.countDocuments({ stage });
  }

  async findByPlateNumber(vehiclePlate: string, excludeCompleted: boolean = true): Promise<ICarDocument | null> {
    const escapedPlate = vehiclePlate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const query: any = { vehiclePlate: new RegExp(`^${escapedPlate}$`, 'i') };
    if (excludeCompleted) {
      query.stage = { $nin: ['completed', 'collected'] };
    }
    return await CarModel.findOne(query);
  }

  async countByFilters(filters: ICarFilters | Record<string, any>): Promise<number> {
    const query: any = {};
    if (filters.stage) query.stage = filters.stage;
    if (filters.serviceType) query.serviceType = filters.serviceType;
    if (filters.assignedMechanicId) {
      query.$or = [
        { assignedMechanicId: filters.assignedMechanicId },
        { 'assignedTechnicians.technicianId': filters.assignedMechanicId }
      ];
    }
    if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
    if (filters.jobType) query.jobType = filters.jobType;
    if (filters.priority) query.priority = filters.priority;
    if ((filters as ICarFilters).isPaused !== undefined) query.isPaused = (filters as ICarFilters).isPaused;
    
    return await CarModel.countDocuments(query);
  }

  async findByMechanic(mechanicId: string): Promise<ICarDocument[]> {
    return await CarModel.find({
      $or: [
        { assignedMechanicId: mechanicId },
        { 'assignedTechnicians.technicianId': mechanicId }
      ],
      stage: { $nin: ['completed', 'collected'] }
    });
  }

  async findCompletedToday(): Promise<ICarDocument[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await CarModel.find({
      stage: { $in: ['completed', 'collected'] },
      completionDate: { $gte: today }
    });
  }

  async getGarageBoardData(): Promise<any> {
    const stages = [
      'booked_in',
      'waiting_inspection',
      'diagnosed',
      'awaiting_approval',
      'awaiting_parts',
      'in_repair',
      'painting',
      'detailing',
      'quality_check',
      'ready_pickup'
    ];
    
    const boardData = await Promise.all(
      stages.map(async (stage) => ({
        stage,
        count: await this.countByStage(stage),
        cars: await CarModel.find({ stage }).sort({ priority: -1, checkInDate: 1 }).limit(20)
      }))
    );
    
    return boardData;
  }

  async generateJobCardNumber(): Promise<string> {
    const today = new Date();
    const prefix = `JC-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const count = await CarModel.countDocuments({
      jobCardNumber: new RegExp(`^${prefix}`)
    });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  async findRecentByPlateAndComplaint(vehiclePlate: string, complaint: string, withinDays: number = 30): Promise<ICarDocument | null> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - withinDays);
    const escapedPlate = vehiclePlate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    return await CarModel.findOne({
      vehiclePlate: new RegExp(`^${escapedPlate}$`, 'i'),
      complaint: { $exists: true, $ne: '' },
      stage: { $in: ['completed', 'collected'] },
      completionDate: { $gte: sinceDate }
    }).sort({ completionDate: -1 });
  }
}
