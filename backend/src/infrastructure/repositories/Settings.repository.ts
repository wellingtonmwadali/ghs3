import { ISettings } from '../../domain/entities/Settings';
import { SettingsModel, ISettingsDocument } from '../models/Settings.model';

export class SettingsRepository {
  async getSettings(): Promise<ISettingsDocument | null> {
    // There should only be one settings document
    return await SettingsModel.findOne();
  }

  async createOrUpdateSettings(settingsData: Partial<ISettings>): Promise<ISettingsDocument> {
    const existing = await this.getSettings();
    
    if (existing) {
      Object.assign(existing, settingsData);
      return await existing.save();
    }
    
    return await SettingsModel.create(settingsData);
  }

  async initializeDefaultSettings(): Promise<ISettingsDocument> {
    const existing = await this.getSettings();
    if (existing) return existing;

    return await SettingsModel.create({
      serviceTypes: [
        { id: '1', name: 'Colour Repair', description: 'Professional paint repair and color matching', basePrice: 50000, paymentTerms: 'deposit', depositPercentage: 50 },
        { id: '2', name: 'Clean & Shine', description: 'Complete detailing and cleaning service', basePrice: 15000, paymentTerms: 'full_upfront' },
        { id: '3', name: 'Coat & Guard', description: 'Protective coating and sealant application', basePrice: 35000, paymentTerms: 'deposit', depositPercentage: 30 }
      ],
      promotionalMessages: [],
      announcements: [],
      holidays: [],
      clockInEnabled: true,
      promotionalDeliveryMethod: {
        email: true,
        whatsapp: false
      }
    });
  }
}
