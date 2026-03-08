import mongoose, { Schema, Document } from 'mongoose';
import { Inspection } from '../../domain/entities/Inspection';

export interface InspectionDocument extends Omit<Inspection, '_id'>, Document {}

const InspectionSchema = new Schema<InspectionDocument>(
  {
    bookingId: {
      type: String,
      required: true,
      ref: 'Booking'
    },
    vehicleId: {
      type: String,
      required: true,
      ref: 'Vehicle'
    },
    customerId: {
      type: String,
      required: true,
      ref: 'Customer'
    },
    mechanicId: {
      type: String,
      required: true,
      ref: 'User'
    },
    requiredParts: [
      {
        inventoryId: {
          type: String,
          required: true,
          ref: 'Inventory'
        },
        partName: {
          type: String,
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        unitPrice: {
          type: Number,
          required: true,
          min: 0
        },
        inStock: {
          type: Boolean,
          default: true
        },
        supplierInfo: String
      }
    ],
    requiredServices: [
      {
        serviceId: String,
        name: {
          type: String,
          required: true
        },
        description: {
          type: String,
          required: true
        },
        price: {
          type: Number,
          required: true,
          min: 0
        }
      }
    ],
    additionalNotes: {
      type: String,
      default: ''
    },
    estimatedCost: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending'
    },
    approvedBy: {
      type: String,
      ref: 'User'
    },
    approvedAt: Date,
    rejectionReason: String,
    invoiceId: {
      type: String,
      ref: 'Invoice'
    }
  },
  {
    timestamps: true
  }
);

// Index for quick lookups
InspectionSchema.index({ bookingId: 1 });
InspectionSchema.index({ vehicleId: 1 });
InspectionSchema.index({ mechanicId: 1 });
InspectionSchema.index({ status: 1 });
InspectionSchema.index({ createdAt: -1 });

// Calculate estimated cost before saving
InspectionSchema.pre('save', function (next) {
  let total = 0;
  
  // Add parts cost
  this.requiredParts.forEach(part => {
    total += part.quantity * part.unitPrice;
  });
  
  // Add services cost
  this.requiredServices.forEach(service => {
    total += service.price;
  });
  
  this.estimatedCost = total;
  next();
});

export const InspectionModel = mongoose.model<InspectionDocument>('Inspection', InspectionSchema);
