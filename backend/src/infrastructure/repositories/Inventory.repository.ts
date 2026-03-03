import { InventoryModel, IInventoryDocument } from '../models/Inventory.model';
import { IInventory } from '../../domain/entities/Inventory';

export class InventoryRepository {
  async create(inventoryData: IInventory): Promise<IInventoryDocument> {
    const inventory = new InventoryModel(inventoryData);
    return await inventory.save();
  }

  async findById(id: string): Promise<IInventoryDocument | null> {
    return await InventoryModel.findById(id);
  }

  async findAll(): Promise<IInventoryDocument[]> {
    return await InventoryModel.find({ isActive: true }).sort({ itemName: 1 });
  }

  async findByCategory(category: string): Promise<IInventoryDocument[]> {
    return await InventoryModel.find({ category, isActive: true });
  }

  async update(id: string, updateData: Partial<IInventory>): Promise<IInventoryDocument | null> {
    return await InventoryModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await InventoryModel.findByIdAndUpdate(id, { isActive: false });
    return !!result;
  }

  async updateQuantity(id: string, quantity: number): Promise<void> {
    await InventoryModel.findByIdAndUpdate(id, {
      $inc: { quantity },
      lastRestocked: quantity > 0 ? new Date() : undefined
    });
  }

  async getLowStockItems(): Promise<IInventoryDocument[]> {
    return await InventoryModel.find({
      $expr: { $lte: ['$quantity', '$minStockLevel'] },
      isActive: true
    });
  }

  async search(searchTerm: string): Promise<IInventoryDocument[]> {
    return await InventoryModel.find({
      $or: [
        { itemName: { $regex: searchTerm, $options: 'i' } },
        { sku: { $regex: searchTerm, $options: 'i' } },
        { brand: { $regex: searchTerm, $options: 'i' } }
      ],
      isActive: true
    }).limit(20);
  }
}
