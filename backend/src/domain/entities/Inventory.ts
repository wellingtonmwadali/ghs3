// Domain Entity: Inventory
export interface IInventory {
  _id?: string;
  itemName: string;
  category: 'paint' | 'chemical' | 'film' | 'tool' | 'other';
  
  sku?: string;
  brand?: string;
  
  quantity: number;
  unit: string;
  minStockLevel: number;
  
  costPerUnit: number;
  
  supplier?: {
    name: string;
    contact: string;
    email?: string;
  };
  
  lastRestocked?: Date;
  
  isActive: boolean;
  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IInventoryUsage {
  _id?: string;
  inventoryItemId: string;
  carId: string;
  quantityUsed: number;
  cost: number;
  usedBy: string; // Mechanic ID
  usedAt: Date;
}
