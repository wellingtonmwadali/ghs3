import mongoose, { Schema, Document } from 'mongoose';
import { IBooking } from '../../domain/entities/Booking';

export interface IBookingDocument extends Omit<IBooking, '_id'>, Document {}

const BookingSchema = new Schema<IBookingDocument>(
  {
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true, lowercase: true },
    customerPhone: { type: String, required: true },
    
    vehicleModel: { type: String, required: true },
    vehiclePlate: { type: String },
    
    requestedServices: [{ type: String, required: true }],
    serviceCategory: { 
      type: String, 
      enum: ['colour_repair', 'clean_shine', 'coat_guard'],
      required: true 
    },
    
    preferredDate: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending' 
    },
    
    photos: [{ type: String }],
    description: { type: String },
    
    quotationAmount: { type: Number },
    quotationSent: { type: Boolean, default: false }
  },
  { timestamps: true }
);

BookingSchema.index({ status: 1, preferredDate: 1 });
BookingSchema.index({ customerEmail: 1 });

export const BookingModel = mongoose.model<IBookingDocument>('Booking', BookingSchema);
