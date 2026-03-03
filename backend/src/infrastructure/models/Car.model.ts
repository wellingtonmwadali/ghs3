import mongoose, { Schema, Document } from 'mongoose';
import { ICar } from '../../domain/entities/Car';

export interface ICarDocument extends Omit<ICar, '_id'>, Document {}

const CarSchema = new Schema<ICarDocument>(
  {
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    vehicleModel: { type: String, required: true },
    vehiclePlate: { type: String, required: true, unique: true },
    vehicleYear: { type: Number, required: true },
    vehicleColor: { type: String, required: true },
    
    serviceType: { 
      type: String, 
      enum: ['colour_repair', 'clean_shine', 'coat_guard'], 
      required: true 
    },
    services: [{ type: String }],
    
    stage: {
      type: String,
      enum: ['waiting_inspection', 'in_repair', 'painting', 'detailing', 'quality_check', 'ready_pickup', 'completed'],
      default: 'waiting_inspection',
      index: true
    },
    statusProgress: { type: Number, default: 0, min: 0, max: 100 },
    
    assignedMechanicId: { type: String, index: true },
    assignedMechanicName: { type: String },
    
    estimatedCost: { type: Number, required: true },
    actualCost: { type: Number },
    paidAmount: { type: Number, default: 0 },
    paymentStatus: { 
      type: String, 
      enum: ['pending', 'partial', 'paid'], 
      default: 'pending' 
    },
    
    checkInDate: { type: Date, default: Date.now },
    expectedCompletionDate: { type: Date, required: true },
    completionDate: { type: Date },
    daysInGarage: { type: Number, default: 0 },
    
    damageAssessment: { type: String },
    partsRequired: [{ type: String }],
    insuranceClaim: {
      hasInsurance: { type: Boolean, default: false },
      claimNumber: { type: String },
      insurer: { type: String },
      status: { type: String }
    },
    
    beforePhotos: [{ type: String }],
    afterPhotos: [{ type: String }],
    
    notes: { type: String },
    warranty: {
      hasWarranty: { type: Boolean, default: false },
      expiryDate: { type: Date },
      warrantyType: { type: String }
    }
  },
  { timestamps: true }
);

// Indexes for better query performance
CarSchema.index({ checkInDate: -1 });
CarSchema.index({ stage: 1, checkInDate: -1 });
CarSchema.index({ assignedMechanicId: 1, stage: 1 });

export const CarModel = mongoose.model<ICarDocument>('Car', CarSchema);
