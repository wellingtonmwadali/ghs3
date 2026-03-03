import { MechanicModel, IMechanicDocument } from '../models/Mechanic.model';
import { IMechanic } from '../../domain/entities/Mechanic';

export class MechanicRepository {
  async create(mechanicData: IMechanic): Promise<IMechanicDocument> {
    const mechanic = new MechanicModel(mechanicData);
    return await mechanic.save();
  }

  async findById(id: string): Promise<IMechanicDocument | null> {
    return await MechanicModel.findById(id).populate('activeJobs');
  }

  async findAll(): Promise<IMechanicDocument[]> {
    return await MechanicModel.find().sort({ firstName: 1 });
  }

  async findBySpecialization(specialization: string): Promise<IMechanicDocument[]> {
    return await MechanicModel.find({ 
      $or: [
        { specialization },
        { specialization: 'all' }
      ]
    });
  }

  async findAvailable(): Promise<IMechanicDocument[]> {
    return await MechanicModel.find({ availability: 'available' });
  }

  async update(id: string, updateData: Partial<IMechanic>): Promise<IMechanicDocument | null> {
    return await MechanicModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await MechanicModel.findByIdAndDelete(id);
    return !!result;
  }

  async assignJob(mechanicId: string, carId: string): Promise<void> {
    await MechanicModel.findByIdAndUpdate(mechanicId, {
      $push: { activeJobs: carId },
      availability: 'busy'
    });
  }

  async completeJob(mechanicId: string, carId: string): Promise<void> {
    const mechanic = await MechanicModel.findById(mechanicId);
    if (mechanic) {
      const activeJobsLength = (mechanic as any).activeJobs?.length || 0;
      await MechanicModel.findByIdAndUpdate(mechanicId, {
        $pull: { activeJobs: carId },
        $push: { completedJobs: carId },
        $inc: { 'performance.totalJobsCompleted': 1 },
        availability: activeJobsLength <= 1 ? 'available' : 'busy'
      });
    }
  }

  async updatePerformance(mechanicId: string, performanceData: Partial<IMechanic['performance']>): Promise<void> {
    await MechanicModel.findByIdAndUpdate(mechanicId, {
      $set: { performance: performanceData }
    });
  }

  async getSuggestedMechanic(specialization: string): Promise<IMechanicDocument | null> {
    // Find available mechanics with matching specialization and lowest workload
    const mechanics = await MechanicModel.find({
      $or: [{ specialization }, { specialization: 'all' }],
      availability: 'available'
    }).sort({ 'activeJobs.length': 1, 'performance.efficiencyScore': -1 });
    
    return mechanics[0] || null;
  }

  async getWorkloadDistribution(): Promise<any[]> {
    return await MechanicModel.aggregate([
      {
        $project: {
          firstName: 1,
          lastName: 1,
          specialization: 1,
          workload: { $size: '$activeJobs' }
        }
      },
      { $sort: { workload: -1 } }
    ]);
  }
}
