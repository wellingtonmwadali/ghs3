import { ISettings } from '../../domain/entities/Settings';
import { SettingsRepository } from '../../infrastructure/repositories/Settings.repository';

export class SettingsService {
  private settingsRepository: SettingsRepository;

  constructor() {
    this.settingsRepository = new SettingsRepository();
  }

  async getSettings(): Promise<ISettings> {
    let settings = await this.settingsRepository.getSettings();
    
    if (!settings) {
      settings = await this.settingsRepository.initializeDefaultSettings();
    }
    
    return settings.toObject();
  }

  async updateSettings(settingsData: Partial<ISettings>): Promise<ISettings> {
    // Validate and clean the data
    const cleanedData: Partial<ISettings> = {};

    if (settingsData.serviceTypes !== undefined) {
      cleanedData.serviceTypes = settingsData.serviceTypes.filter(st => 
        st.name && st.description && st.basePrice >= 0
      );
    }

    if (settingsData.promotionalMessages !== undefined) {
      cleanedData.promotionalMessages = settingsData.promotionalMessages.filter(pm => 
        pm.title && pm.message && pm.target
      );
    }

    if (settingsData.announcements !== undefined) {
      cleanedData.announcements = settingsData.announcements.filter(ann => 
        ann.title && ann.content && ann.startDate && ann.endDate
      );
    }

    if (settingsData.holidays !== undefined) {
      cleanedData.holidays = settingsData.holidays.filter(hol => 
        hol.name && hol.date
      );
    }

    if (settingsData.clockInEnabled !== undefined) {
      cleanedData.clockInEnabled = settingsData.clockInEnabled;
    }

    const settings = await this.settingsRepository.createOrUpdateSettings(cleanedData);
    return settings.toObject();
  }

  async getActiveAnnouncements(): Promise<any[]> {
    const settings = await this.getSettings();
    const today = new Date();
    
    return settings.announcements.filter(ann => {
      if (!ann.active) return false;
      const start = new Date(ann.startDate);
      const end = new Date(ann.endDate);
      return today >= start && today <= end;
    });
  }

  async getUpcomingHolidays(daysAhead: number = 30): Promise<any[]> {
    const settings = await this.getSettings();
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);
    
    return settings.holidays.filter(hol => {
      const holidayDate = new Date(hol.date);
      return holidayDate >= today && holidayDate <= futureDate;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}
