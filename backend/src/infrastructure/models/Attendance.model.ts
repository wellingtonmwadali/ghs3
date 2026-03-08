import mongoose, { Schema, Document } from 'mongoose';
import { Attendance } from '../../domain/entities/Attendance';

export interface AttendanceDocument extends Omit<Attendance, '_id'>, Document {}

const AttendanceSchema = new Schema<AttendanceDocument>(
  {
    mechanicId: {
      type: String,
      required: true,
      ref: 'User',
      index: true
    },
    mechanicName: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    clockInTime: {
      type: Date,
      required: true
    },
    clockOutTime: {
      type: Date
    },
    totalHours: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['clocked-in', 'clocked-out', 'absent', 'on-leave'],
      default: 'clocked-in',
      index: true
    },
    notes: {
      type: String
    },
    location: {
      latitude: Number,
      longitude: Number
    }
  },
  {
    timestamps: true
  }
);

// Index for quick lookups
AttendanceSchema.index({ mechanicId: 1, date: -1 });
AttendanceSchema.index({ date: -1, status: 1 });

// Prevent duplicate clock-ins for same mechanic on same day
AttendanceSchema.index(
  { mechanicId: 1, date: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: 'clocked-in' }
  }
);

// Calculate total hours on clock out
AttendanceSchema.pre('save', function (next) {
  if (this.clockOutTime && this.clockInTime) {
    const diffMs = this.clockOutTime.getTime() - this.clockInTime.getTime();
    this.totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimals
  }
  next();
});

// Set date to start of day for consistent querying
AttendanceSchema.pre('save', function (next) {
  if (this.isNew) {
    const date = new Date(this.clockInTime);
    date.setHours(0, 0, 0, 0);
    this.date = date;
  }
  next();
});

export const AttendanceModel = mongoose.model<AttendanceDocument>('Attendance', AttendanceSchema);
