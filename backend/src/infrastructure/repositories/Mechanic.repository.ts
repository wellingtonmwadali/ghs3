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
      const jobsAfterRemoval = Math.max(0, activeJobsLength - 1);
      await MechanicModel.findByIdAndUpdate(mechanicId, {
        $pull: { activeJobs: carId },
        $push: { completedJobs: carId },
        $inc: { 'performance.totalJobsCompleted': 1 },
        availability: jobsAfterRemoval === 0 ? 'available' : 'busy'
      });
    }
  }

  async updatePerformance(mechanicId: string, performanceData: Partial<IMechanic['performance']>): Promise<void> {
    await MechanicModel.findByIdAndUpdate(mechanicId, {
      $set: { performance: performanceData }
    });
  }

  async getSuggestedMechanic(specialization: string): Promise<IMechanicDocument | null> {
    // Find mechanics with matching specialization
    const mechanics = await MechanicModel.find({
      $or: [{ specialization }, { specialization: 'all' }]
    }).lean();
    
    if (mechanics.length === 0) return null;
    
    // Score each mechanic based on multiple factors
    const scoredMechanics = mechanics.map((mechanic: any) => {
      let score = 100;
      
      // Factor 1: Availability (highest weight)
      if (mechanic.availability === 'off') score -= 100; // Exclude
      else if (mechanic.availability === 'busy') score -= 30;
      else if (mechanic.availability === 'available') score += 0;
      
      // Factor 2: Current workload (lower is better)
      const activeJobCount = mechanic.activeJobs?.length || 0;
      score -= activeJobCount * 10;
      
      // Factor 3: Performance rating (higher is better)
      const rating = mechanic.performance?.customerRating || 0;
      score += rating * 5;
      
      // Factor 4: Specialization exactness (exact match better than 'all')
      if (mechanic.specialization === specialization) score += 10;
      else if (mechanic.specialization === 'all') score += 5;
      
      // Factor 5: Job completion rate (higher is better)
      const totalJobs = mechanic.performance?.totalJobsCompleted || 0;
      score += Math.min(totalJobs, 20); // Cap at 20 bonus points
      
      return { ...mechanic, score };
    });
    
    // Sort by score descending and return the best match
    scoredMechanics.sort((a, b) => b.score - a.score);
    const bestMechanic = scoredMechanics[0];
    
    // Don't suggest if score is too low (mechanic is off or overloaded)
    if (bestMechanic.score < 0) return null;
    
    return await MechanicModel.findById(bestMechanic._id);
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

  async findWithPagination(query: any, skip: number, limit: number): Promise<IMechanicDocument[]> {
    return await MechanicModel.find(query)
      .sort({ firstName: 1, lastName: 1 })
      .skip(skip)
      .limit(limit);
  }

  async count(query: any): Promise<number> {
    return await MechanicModel.countDocuments(query);
  }

  async getTopPerformers(limit: number): Promise<IMechanicDocument[]> {
    return await MechanicModel.find()
      .sort({ 'performance.customerRating': -1, 'performance.totalJobsCompleted': -1 })
      .limit(limit);
  }
}
