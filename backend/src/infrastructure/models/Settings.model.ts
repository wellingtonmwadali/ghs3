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
      imageUrl: { type: String },
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
      whatsapp: { type: Boolean, default: false },
      senderEmail: { type: String }
    },
    companyInfo: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
      address: { type: String },
      logo: { type: String }
    },
    emailConfig: {
      enabled: { type: Boolean, default: false },
      service: { type: String, default: 'gmail' },
      host: { type: String },
      port: { type: Number },
      secure: { type: Boolean, default: true },
      user: { type: String },
      password: { type: String }
    },
    notifications: {
      lowInventoryAlert: { type: Boolean, default: true },
      invoiceCreated: { type: Boolean, default: true },
      paymentReceived: { type: Boolean, default: true },
      emailEnabled: { type: Boolean, default: true },
      whatsappEnabled: { type: Boolean, default: false },
      recipients: {
        type: { type: String, enum: ['single', 'multiple'], default: 'single' },
        emails: [{ type: String }],
        userIds: [{ type: String }]
      },
      inventory: {
        enabled: { type: Boolean, default: true },
        checkFrequency: { type: String, enum: ['hourly', 'daily', 'weekly'], default: 'daily' },
        minStockLevelTrigger: { type: Boolean, default: true },
        customThreshold: { type: Number }
      },
      lateServices: {
        enabled: { type: Boolean, default: true },
        daysOverdue: { type: Number, default: 2 },
        checkFrequency: { type: String, enum: ['daily', 'twice_daily'], default: 'daily' },
        notifyCustomer: { type: Boolean, default: false }
      }
    },
    rolePermissions: {
      owner: [{ type: String }],
      manager: [{ type: String }],
      receptionist: [{ type: String }],
      mechanic: [{ type: String }]
    }
  },
  {
    timestamps: true
  }
);

export const SettingsModel = model<ISettingsDocument>('Settings', SettingsSchema);
