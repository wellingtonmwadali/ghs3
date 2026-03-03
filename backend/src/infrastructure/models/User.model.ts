import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../../domain/entities/User';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    
    role: { 
      type: String, 
      enum: ['owner', 'manager', 'mechanic', 'receptionist'],
      required: true 
    },
    
    mechanicId: { type: Schema.Types.ObjectId, ref: 'Mechanic' },
    
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    
    permissions: [{ type: String }]
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  (this as any).password = await bcrypt.hash((this as any).password, salt);
  next();
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.index({ email: 1 });

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);
