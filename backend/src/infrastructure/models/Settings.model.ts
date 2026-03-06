import { Schema, model, Document } from 'mongoose';
import { ISettings } from '../../domain/entities/Settings';

export interface ISettingsDocument extends Omit<ISettings, '_id'>, Document {}

const SettingsSchema = new Schema<ISettingsDocument>(
  {
    serviceTypes: [{
      id: { type: String },
      name: { type: String },
      description: { type: String },
      basePrice: { type: Number },
      paymentTerms: { type: String, enum: ['full_upfront', 'deposit', 'upon_completion', 'custom'] },
      depositPercentage: { type: Number }
    }],
    promotionalMessages: [{
      id: { type: String },
      title: { type: String },
      message: { type: String },
      target: { type: String, enum: ['all', 'recurring', 'new', 'high_value'] }
    }],
    announcements: [{
      id: { type: String },
      title: { type: String },
      content: { type: String },
      startDate: { type: Date },
      endDate: { type: Date },
      active: { type: Boolean, default: true }
    }],
    holidays: [{
      id: { type: String },
      name: { type: String },
      date: { type: Date }
    }],
    clockInEnabled: { type: Boolean, default: true },
    promotionalDeliveryMethod: {
      email: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: false }
    }
  },
  {
    timestamps: true
  }
);

export const SettingsModel = model<ISettingsDocument>('Settings', SettingsSchema);
