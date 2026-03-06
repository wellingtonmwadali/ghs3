import mongoose, { Schema, Document } from 'mongoose';
import { IMechanic } from '../../domain/entities/Mechanic';

export interface IMechanicDocument extends Omit<IMechanic, '_id'>, Document {}

const MechanicSchema = new Schema<IMechanicDocument>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    
    specialization: { 
      type: String, 
      enum: ['painter', 'detailer', 'installer', 'technician', 'all'],
      required: true 
    },
    skills: [{ type: String }],
    
    activeJobs: [{ type: Schema.Types.ObjectId, ref: 'Car' }],
    completedJobs: [{ type: Schema.Types.ObjectId, ref: 'Car' }],
    
    performance: {
      totalJobsCompleted: { type: Number, default: 0 },
      averageTurnaroundTime: { type: Number, default: 0 },
      efficiencyScore: { type: Number, default: 100, min: 0, max: 100 },
      customerRating: { type: Number, default: 5, min: 0, max: 5 }
    },
    
    laborHoursLogged: { type: Number, default: 0 },
    
    availability: { 
      type: String, 
      enum: ['available', 'busy', 'off'], 
      default: 'available' 
    },
    
    hireDate: { type: Date, default: Date.now },
    birthday: { type: Date },
    salary: { type: Number }
  },
  { timestamps: true }
);

MechanicSchema.index({ specialization: 1, availability: 1 });

export const MechanicModel = mongoose.model<IMechanicDocument>('Mechanic', MechanicSchema);
