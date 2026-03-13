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
    if (filters?.assignedMechanicId) query.assignedMechanicId = filters.assignedMechanicId;
    if (filters?.paymentStatus) query.paymentStatus = filters.paymentStatus;
    
    if (filters?.startDate || filters?.endDate) {
      query.checkInDate = {};
      if (filters.startDate) query.checkInDate.$gte = filters.startDate;
      if (filters.endDate) query.checkInDate.$lte = filters.endDate;
    }
    
    let queryBuilder = CarModel.find(query).sort({ checkInDate: -1 });
    
    if (skip) queryBuilder = queryBuilder.skip(skip);
    if (limit) queryBuilder = queryBuilder.limit(limit);
    
    return await queryBuilder;
  }

  async update(id: string, updateData: Partial<ICar>): Promise<ICarDocument | null> {
    return await CarModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await CarModel.findByIdAndDelete(id);
    return !!result;
  }

  async countByStage(stage: string): Promise<number> {
    return await CarModel.countDocuments({ stage });
  }

  async findByPlateNumber(vehiclePlate: string, excludeCompleted: boolean = true): Promise<ICarDocument | null> {
    const query: any = { vehiclePlate: new RegExp(`^${vehiclePlate}$`, 'i') };
    if (excludeCompleted) {
      query.stage = { $ne: 'completed' };
    }
    return await CarModel.findOne(query);
  }

  async countByFilters(filters: ICarFilters): Promise<number> {
    const query: any = {};
    if (filters.stage) query.stage = filters.stage;
    if (filters.serviceType) query.serviceType = filters.serviceType;
    if (filters.assignedMechanicId) query.assignedMechanicId = filters.assignedMechanicId;
    
    return await CarModel.countDocuments(query);
  }

  async findByMechanic(mechanicId: string): Promise<ICarDocument[]> {
    return await CarModel.find({ 
      assignedMechanicId: mechanicId,
      stage: { $ne: 'completed' }
    });
  }

  async findCompletedToday(): Promise<ICarDocument[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await CarModel.find({
      stage: 'completed',
      completionDate: { $gte: today }
    });
  }

  async getGarageBoardData(): Promise<any> {
    const stages = [
      'waiting_inspection',
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
        cars: await CarModel.find({ stage }).limit(10)
      }))
    );
    
    return boardData;
  }
}
