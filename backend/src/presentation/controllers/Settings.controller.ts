import { Request, Response, NextFunction } from 'express';
import { SettingsService } from '../../application/services/Settings.service';

export class SettingsController {
  private settingsService: SettingsService;

  constructor() {
    this.settingsService = new SettingsService();
  }

  getSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const settings = await this.settingsService.getSettings();
      res.status(200).json({
        success: true,
        message: 'Settings retrieved successfully',
        data: settings
      });
    } catch (error) {
      next(error);
    }
  };

  updateSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const settings = await this.settingsService.updateSettings(req.body);
      res.status(200).json({
        success: true,
        message: 'Settings updated successfully',
        data: settings
      });
    } catch (error) {
      next(error);
    }
  };

  getActiveAnnouncements = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const announcements = await this.settingsService.getActiveAnnouncements();
      res.status(200).json({
        success: true,
        message: 'Active announcements retrieved',
        data: announcements
      });
    } catch (error) {
      next(error);
    }
  };

  getUpcomingHolidays = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const daysAhead = parseInt(req.query.days as string) || 30;
      const holidays = await this.settingsService.getUpcomingHolidays(daysAhead);
      res.status(200).json({
        success: true,
        message: 'Upcoming holidays retrieved',
        data: holidays
      });
    } catch (error) {
      next(error);
    }
  };
}
