import { InventoryRepository } from '../../infrastructure/repositories/Inventory.repository';
import { IInventory } from '../../domain/entities/Inventory';
import { IInventoryDocument } from '../../infrastructure/models/Inventory.model';

export class InventoryService {
  private inventoryRepository: InventoryRepository;

  constructor() {
    this.inventoryRepository = new InventoryRepository();
  }

  async createItem(data: Partial<IInventory>): Promise<IInventoryDocument> {
    const item = await this.inventoryRepository.create(data as IInventory);
    return item;
  }

  async updateItem(id: string, data: Partial<IInventory>): Promise<IInventoryDocument | null> {
    const item = await this.inventoryRepository.update(id, data);
    if (!item) {
      throw new Error('Item not found');
    }
    return item;
  }

  async getItemById(id: string): Promise<IInventoryDocument | null> {
    return await this.inventoryRepository.findById(id);
  }

  async getAllItems(options: {
    search?: string;
    category?: string;
    lowStock?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<{ items: IInventoryDocument[]; total: number; page: number; pages: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    let query: any = { isActive: true };

    if (options.search) {
      query.itemName = { $regex: options.search, $options: 'i' };
    }

    if (options.category) {
      query.category = options.category;
    }

    if (options.lowStock) {
      query.$expr = { $lte: ['$quantityInStock', '$reorderLevel'] };
    }

    const items = await this.inventoryRepository.findWithPagination(query, skip, limit);
    const total = await this.inventoryRepository.count(query);
    const pages = Math.ceil(total / limit);

    return { items, total, page, pages };
  }

  async deleteItem(id: string): Promise<void> {
    const deleted = await this.inventoryRepository.delete(id);
    if (!deleted) {
      throw new Error('Item not found');
    }
  }

  async getLowStockItems(): Promise<IInventoryDocument[]> {
    return await this.inventoryRepository.getLowStockItems();
  }

  async updateStock(id: string, quantity: number): Promise<IInventoryDocument | null> {
    const item = await this.inventoryRepository.findById(id);
    if (!item) {
      throw new Error('Item not found');
    }

    const newQuantity = item.quantity + quantity;
    return await this.inventoryRepository.update(id, { quantity: newQuantity });
  }

  async deductStock(itemId: string, quantity: number, reason: string = 'Service completion'): Promise<IInventoryDocument | null> {
    const item = await this.inventoryRepository.findById(itemId);
    if (!item) {
      throw new Error('Inventory item not found');
    }

    if (item.quantity < quantity) {
      throw new Error(
        `Insufficient stock for ${item.itemName}. Available: ${item.quantity}, Required: ${quantity}`
      );
    }

    const newQuantity = item.quantity - quantity;
    const updatedItem = await this.inventoryRepository.update(itemId, { 
      quantity: newQuantity,
      lastUsed: new Date()
    });

    // Log the deduction (can be extended to create a stock movement record)
    console.log(`[INVENTORY] Deducted ${quantity} ${item.unit} of ${item.itemName}. Reason: ${reason}`);
    
    return updatedItem;
  }

  async deductMultipleItems(items: Array<{ itemId: string; quantity: number }>, reason: string = 'Service completion'): Promise<void> {
    // Validate all items first
    for (const { itemId, quantity } of items) {
      const item = await this.inventoryRepository.findById(itemId);
      if (!item) {
        throw new Error(`Inventory item with ID ${itemId} not found`);
      }
      if (item.quantity < quantity) {
        throw new Error(
          `Insufficient stock for ${item.itemName}. Available: ${item.quantity}, Required: ${quantity}`
        );
      }
    }

    // Deduct all items
    for (const { itemId, quantity } of items) {
      await this.deductStock(itemId, quantity, reason);
    }
  }

  async getItemsByCategory(category: string): Promise<IInventoryDocument[]> {
    return await this.inventoryRepository.findByCategory(category);
  }
}
