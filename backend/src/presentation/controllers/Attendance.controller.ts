import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from '../../domain/use-cases/AttendanceService';

const attendanceService = new AttendanceService();

export class AttendanceController {
  async clockIn(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      
      // Validate required geolocation
      if (!req.body.location || !req.body.location.latitude || !req.body.location.longitude) {
        return res.status(400).json({
          success: false,
          message: 'Geolocation is required for clock in. Please enable location services.'
        });
      }
      
      const attendance = await attendanceService.clockIn({
        mechanicId: user._id || user.userId,
        mechanicName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
        location: req.body.location,
        notes: req.body.notes
      });

      res.status(201).json({
        success: true,
        message: 'Clocked in successfully',
        data: attendance
      });
    } catch (error: any) {
      next(error);
    }
  }

  async clockOut(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      
      // Validate required geolocation
      if (!req.body.location || !req.body.location.latitude || !req.body.location.longitude) {
        return res.status(400).json({
          success: false,
          message: 'Geolocation is required for clock out. Please enable location services.'
        });
      }
      
      const attendance = await attendanceService.clockOut(user._id || user.userId, {
        location: req.body.location,
        notes: req.body.notes
      });

      res.status(200).json({
        success: true,
        message: 'Clocked out successfully',
        data: attendance
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getTodayAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const attendance = await attendanceService.getTodayAttendance();

      res.status(200).json({
        success: true,
        data: attendance
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getMechanicAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const { mechanicId } = req.params;
      const { startDate, endDate } = req.query;

      const attendance = await attendanceService.getMechanicAttendance(
        mechanicId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.status(200).json({
        success: true,
        data: attendance
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getAttendanceReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { mechanicId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const report = await attendanceService.getAttendanceReport(
        mechanicId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getAttendanceStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const stats = await attendanceService.getAttendanceStats(
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getCurrentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const status = await attendanceService.getCurrentStatus(user._id || user.userId);

      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error: any) {
      next(error);
    }
  }
}
