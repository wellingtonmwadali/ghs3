import mongoose, { Schema, Document } from 'mongoose';
import { ICar } from '../../domain/entities/Car';

export interface ICarDocument extends Omit<ICar, '_id'>, Document {}

const STAGES = [
  'booked_in', 'waiting_inspection', 'diagnosed', 'awaiting_approval',
  'awaiting_parts', 'in_repair', 'painting', 'detailing',
  'quality_check', 'ready_pickup', 'completed', 'collected'
];

const CarSchema = new Schema<ICarDocument>(
  {
    jobCardNumber: { type: String, unique: true, sparse: true },

    // Customer
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    customerGender: { type: String, enum: ['male', 'female', 'other'] },

    // Vehicle
    vehicleMake: { type: String },
    vehicleModel: { type: String, required: true },
    vehiclePlate: { type: String, required: true, unique: true },
    vehicleYear: { type: Number, required: true },
    vehicleColor: { type: String, required: true },
    vehicleMileage: { type: Number },

    // Job classification
    serviceType: {
      type: String,
      enum: ['colour_repair', 'clean_shine', 'coat_guard'],
      required: true
    },
    services: [{ type: String }],
    customServiceDescription: { type: String },
    customServiceAmount: { type: Number },
    jobType: { type: String, enum: ['walk_in', 'fleet', 'insurance', 'warranty'], default: 'walk_in' },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },

    // Workflow
    stage: {
      type: String,
      enum: STAGES,
      default: 'booked_in',
      index: true
    },
    statusProgress: { type: Number, default: 0, min: 0, max: 100 },

    // Complaint & Diagnosis
    complaint: { type: String },
    diagnosis: { type: String },

    // Inspection
    inspectedBy: { type: String },
    inspectorName: { type: String },

    // Technician assignment (legacy single)
    assignedMechanicId: { type: String, index: true },
    assignedMechanicName: { type: String },

    // Multi-technician assignment
    assignedTechnicians: [{
      technicianId: { type: String, required: true },
      technicianName: { type: String, required: true },
      assignedAt: { type: Date, default: Date.now }
    }],
    bayNumber: { type: String },

    // Approval workflow
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'] },
    approvedBy: { type: String },
    approvedByName: { type: String },
    approvedAt: { type: Date },
    approvalNotes: { type: String },

    // Invoice back-reference
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },

    // Costs
    estimatedCost: { type: Number, required: true },
    actualCost: { type: Number },
    paidAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid'],
      default: 'pending'
    },

    // Dates
    checkInDate: { type: Date, default: Date.now },
    expectedCompletionDate: { type: Date, required: true },
    completionDate: { type: Date },
    daysInGarage: { type: Number, default: 0 },

    // Parts
    damageAssessment: { type: String },
    partsRequired: [{ type: String }],
    partsUsed: [{
      itemId: { type: String },
      itemName: { type: String },
      quantity: { type: Number },
      unitPrice: { type: Number }
    }],
    customerSuppliedParts: [{
      name: { type: String, required: true },
      quantity: { type: Number, required: true, default: 1 },
      notes: { type: String }
    }],

    // Labor
    laborCost: { type: Number, default: 0 },
    laborLines: [{
      description: { type: String, required: true },
      technicianId: { type: String },
      technicianName: { type: String },
      hours: { type: Number, required: true },
      rate: { type: Number, required: true },
      total: { type: Number, required: true }
    }],

    // Insurance
    insuranceClaim: {
      hasInsurance: { type: Boolean, default: false },
      claimNumber: { type: String },
      insurer: { type: String },
      status: { type: String }
    },

    // Photos
    beforePhotos: [{ type: String }],
    afterPhotos: [{ type: String }],

    // Notes
    notes: { type: String },
    inspectionNotes: { type: String },
    completionNotes: { type: String },

    // Pause / Resume
    isPaused: { type: Boolean, default: false },
    pauseReason: { type: String },
    pauseHistory: [{
      pausedAt: { type: Date, required: true },
      resumedAt: { type: Date },
      reason: { type: String, required: true },
      pausedBy: { type: String, required: true },
      pausedByName: { type: String, required: true }
    }],

    // Status audit trail
    statusHistory: [{
      stage: { type: String, enum: STAGES, required: true },
      changedBy: { type: String, required: true },
      changedByName: { type: String, required: true },
      changedAt: { type: Date, default: Date.now },
      notes: { type: String }
    }],
    comebackWarning: { type: Boolean, default: false },

    // Audit trail
    createdBy: { type: String },
    createdByName: { type: String },
    lastModifiedBy: { type: String },
    lastModifiedByName: { type: String },
    lastModifiedAt: { type: Date },

    warranty: {
      hasWarranty: { type: Boolean, default: false },
      expiryDate: { type: Date },
      warrantyType: { type: String }
    }
  },
  { timestamps: true }
);

// Indexes for query performance
CarSchema.index({ checkInDate: -1 });
CarSchema.index({ stage: 1, checkInDate: -1 });
CarSchema.index({ assignedMechanicId: 1, stage: 1 });
CarSchema.index({ 'assignedTechnicians.technicianId': 1, stage: 1 });
CarSchema.index({ vehiclePlate: 1, stage: 1 });
CarSchema.index({ customerId: 1, checkInDate: -1 });
CarSchema.index({ paymentStatus: 1 });
CarSchema.index({ jobType: 1 });
CarSchema.index({ priority: 1, stage: 1 });
CarSchema.index({ isPaused: 1 });
CarSchema.index({ bayNumber: 1 });

export const CarModel = mongoose.model<ICarDocument>('Car', CarSchema);
