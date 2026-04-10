import mongoose, { Schema, Document } from 'mongoose';
import { ICustomer } from '../../domain/entities/Customer';

export interface ICustomerDocument extends Omit<ICustomer, '_id'>, Document {}

const CustomerSchema = new Schema<ICustomerDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    address: { type: String },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    notes: { type: String },
    
    serviceHistory: [{
      date: { type: Date, required: true },
      carId: { type: String, required: true },
      serviceDetails: { type: String, required: true },
      cost: { type: Number, required: true }
    }]
  },
  { timestamps: true }
);

CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ name: 1 });

export const CustomerModel = mongoose.model<ICustomerDocument>('Customer', CustomerSchema);
