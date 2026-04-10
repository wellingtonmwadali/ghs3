import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { IUser, UserRole } from '../../domain/entities/User';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

// Auto-increment counter schema
const CounterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
const Counter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema);

const UserSchema = new Schema<IUserDocument>(
  {
    userId: { type: String, unique: true, sparse: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    password: { type: String, required: true, select: false },

    role: {
      type: String,
      enum: ['owner', 'manager', 'mechanic', 'receptionist'] as UserRole[],
      required: true,
    },
    permissions: [{ type: String }],

    mechanicId: { type: Schema.Types.ObjectId, ref: 'Mechanic' },
    branch: { type: String },
    department: { type: String },

    avatarUrl: { type: String },

    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    mfaEnabled: { type: Boolean, default: false },

    lastLogin: { type: Date },
    lastLoginIp: { type: String },
    loginCount: { type: Number, default: 0 },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },

    refreshToken: { type: String, select: false },

    passwordChangedAt: { type: Date },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

// Generate human-readable userId before save
UserSchema.pre('save', async function (next) {
  if (!this.isNew || this.userId) return next();
  try {
    const counter = await Counter.findByIdAndUpdate(
      'userId',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.userId = `USR-${String(counter.seq).padStart(5, '0')}`;
    next();
  } catch (err: any) {
    next(err);
  }
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  (this as any).password = await bcrypt.hash((this as any).password, salt);
  this.passwordChangedAt = new Date();
  next();
});

// Compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
UserSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Increment failed login attempts (lock after 5)
UserSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  // If previous lock expired, reset
  if (this.lockUntil && this.lockUntil < new Date()) {
    this.failedLoginAttempts = 1;
    this.lockUntil = undefined;
  } else {
    this.failedLoginAttempts += 1;
    // Lock for 30 minutes after 5 failed attempts
    if (this.failedLoginAttempts >= 5) {
      this.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
    }
  }
  await this.save();
};

// Reset after successful login
UserSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  this.failedLoginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

// Indexes
UserSchema.index({ role: 1, isActive: 1 });

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);
