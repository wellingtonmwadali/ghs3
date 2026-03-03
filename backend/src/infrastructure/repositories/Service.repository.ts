import { ServiceModel, IServiceDocument } from '../models/Service.model';
import { IService } from '../../domain/entities/Service';

export class ServiceRepository {
  async create(serviceData: IService): Promise<IServiceDocument> {
    const service = new ServiceModel(serviceData);
    return await service.save();
  }

  async findById(id: string): Promise<IServiceDocument | null> {
    return await ServiceModel.findById(id);
  }

  async findAll(): Promise<IServiceDocument[]> {
    return await ServiceModel.find({ isActive: true }).sort({ name: 1 });
  }

  async findByCategory(category: string): Promise<IServiceDocument[]> {
    return await ServiceModel.find({ category, isActive: true });
  }

  async update(id: string, updateData: Partial<IService>): Promise<IServiceDocument | null> {
    return await ServiceModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await ServiceModel.findByIdAndUpdate(id, { isActive: false });
    return !!result;
  }
}
