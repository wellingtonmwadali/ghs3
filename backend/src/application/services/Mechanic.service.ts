import { MechanicRepository } from '../../infrastructure/repositories/Mechanic.repository';
import { IMechanic } from '../../domain/entities/Mechanic';
import { IMechanicDocument } from '../../infrastructure/models/Mechanic.model';

export class MechanicService {
  private mechanicRepository: MechanicRepository;

  constructor() {
    this.mechanicRepository = new MechanicRepository();
  }

  async createMechanic(data: Partial<IMechanic>): Promise<IMechanicDocument> {
    const mechanic = await this.mechanicRepository.create(data as IMechanic);
    return mechanic;
  }

  async updateMechanic(id: string, data: Partial<IMechanic>): Promise<IMechanicDocument | null> {
    const mechanic = await this.mechanicRepository.update(id, data);
    if (!mechanic) {
      throw new Error('Mechanic not found');
    }
    return mechanic;
  }

  async getMechanicById(id: string): Promise<IMechanicDocument | null> {
    return await this.mechanicRepository.findById(id);
  }

  async getAllMechanics(options: {
    search?: string;
    specialization?: string;
    availability?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ mechanics: IMechanicDocument[]; total: number; page: number; pages: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    let query: any = {};

    if (options.search) {
      query.$or = [
        { firstName: { $regex: options.search, $options: 'i' } },
        { lastName: { $regex: options.search, $options: 'i' } },
        { email: { $regex: options.search, $options: 'i' } }
      ];
    }

    if (options.specialization) {
      query.specialization = options.specialization;
    }

    if (options.availability) {
      query.availability = options.availability;
    }

    const mechanics = await this.mechanicRepository.findWithPagination(query, skip, limit);
    const total = await this.mechanicRepository.count(query);
    const pages = Math.ceil(total / limit);

    return { mechanics, total, page, pages };
  }

  async deleteMechanic(id: string): Promise<void> {
    const deleted = await this.mechanicRepository.delete(id);
    if (!deleted) {
      throw new Error('Mechanic not found');
    }
  }

  async getAvailableMechanics(): Promise<IMechanicDocument[]> {
    return await this.mechanicRepository.findAvailable();
  }

  async getMechanicsBySpecialization(specialization: string): Promise<IMechanicDocument[]> {
    return await this.mechanicRepository.findBySpecialization(specialization);
  }

  async assignJob(mechanicId: string, carId: string): Promise<IMechanicDocument | null> {
    // Validate mechanic and car exist
    const mechanic = await this.mechanicRepository.findById(mechanicId);
    if (!mechanic) throw new Error('Mechanic not found');

    await this.mechanicRepository.assignJob(mechanicId, carId);
    return await this.mechanicRepository.findById(mechanicId);
  }

  async completeJob(mechanicId: string, carId: string): Promise<void> {
    await this.mechanicRepository.completeJob(mechanicId, carId);
  }

  async getBirthdaysThisMonth(): Promise<IMechanicDocument[]> {
    const now = new Date();
    const currentMonth = now.getMonth();
    
    const allMechanics = await this.mechanicRepository.findAll();
    return allMechanics.filter(mechanic => {
      if (!mechanic.birthday) return false;
      const birthdayMonth = new Date(mechanic.birthday).getMonth();
      return birthdayMonth === currentMonth;
    });
  }

  async getTopPerformers(limit: number = 5): Promise<IMechanicDocument[]> {
    return await this.mechanicRepository.getTopPerformers(limit);
  }
}
