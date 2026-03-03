import mongoose, { Schema, Document } from 'mongoose';
import { IService } from '../../domain/entities/Service';

export interface IServiceDocument extends Omit<IService, '_id'>, Document {}

const ServiceSchema = new Schema<IServiceDocument>(
  {
    name: { type: String, required: true },
    category: { 
      type: String, 
      enum: ['colour_repair', 'clean_shine', 'coat_guard'],
      required: true 
    },
    
    description: { type: String, required: true },
    
    basePrice: { type: Number, required: true },
    estimatedDuration: { type: Number, required: true },
    
    requiresAssessment: { type: Boolean, default: false },
    
    packages: [{
      name: { type: String, required: true },
      price: { type: Number, required: true },
      features: [{ type: String }]
    }],
    
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

ServiceSchema.index({ category: 1, isActive: 1 });

export const ServiceModel = mongoose.model<IServiceDocument>('Service', ServiceSchema);
