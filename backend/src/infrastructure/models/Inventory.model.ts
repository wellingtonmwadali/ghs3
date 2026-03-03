import mongoose, { Schema, Document } from 'mongoose';
import { IInventory, IInventoryUsage } from '../../domain/entities/Inventory';

export interface IInventoryDocument extends Omit<IInventory, '_id'>, Document {}
export interface IInventoryUsageDocument extends Omit<IInventoryUsage, '_id'>, Document {}

const InventorySchema = new Schema<IInventoryDocument>(
  {
    itemName: { type: String, required: true },
    category: { 
      type: String, 
      enum: ['paint', 'chemical', 'film', 'tool', 'other'],
      required: true 
    },
    
    sku: { type: String },
    brand: { type: String },
    
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, required: true },
    minStockLevel: { type: Number, required: true },
    
    costPerUnit: { type: Number, required: true },
    
    supplier: {
      name: { type: String },
      contact: { type: String },
      email: { type: String }
    },
    
    lastRestocked: { type: Date },
    
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const InventoryUsageSchema = new Schema<IInventoryUsageDocument>(
  {
    inventoryItemId: { type: Schema.Types.ObjectId, ref: 'Inventory', required: true } as any,
    carId: { type: Schema.Types.ObjectId, ref: 'Car', required: true } as any,
    quantityUsed: { type: Number, required: true },
    cost: { type: Number, required: true },
    usedBy: { type: Schema.Types.ObjectId, ref: 'Mechanic', required: true } as any,
    usedAt: { type: Date, default: Date.now }
  }
);

InventorySchema.index({ category: 1, isActive: 1 });
InventoryUsageSchema.index({ carId: 1 });
InventoryUsageSchema.index({ usedBy: 1, usedAt: -1 });

export const InventoryModel = mongoose.model<IInventoryDocument>('Inventory', InventorySchema);
export const InventoryUsageModel = mongoose.model<IInventoryUsageDocument>('InventoryUsage', InventoryUsageSchema);
