import { Request, Response, NextFunction } from 'express';
import { InspectionService } from '../../domain/use-cases/InspectionService';

const inspectionService = new InspectionService();

export class InspectionController {
  async createInspection(req: Request, res: Response, next: NextFunction) {
    try {
      const mechanicId = (req as any).user.userId;
      const inspection = await inspectionService.createInspection(req.body, mechanicId);
      
      res.status(201).json({
        success: true,
        message: 'Inspection created successfully',
        data: inspection
      });
    } catch (error: any) {
      next(error);
    }
  }

  async approveInspection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const approvedBy = (req as any).user.userId;
      
      const result = await inspectionService.approveInspection(id, approvedBy);
      
      res.status(200).json({
        success: true,
        message: 'Inspection approved and invoice generated',
        data: result
      });
    } catch (error: any) {
      next(error);
    }
  }

  async rejectInspection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;
      
      if (!rejectionReason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }
      
      const inspection = await inspectionService.rejectInspection(id, rejectionReason);
      
      res.status(200).json({
        success: true,
        message: 'Inspection rejected',
        data: inspection
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getInspectionById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const inspection = await inspectionService.getInspectionById(id);
      
      if (!inspection) {
        return res.status(404).json({
          success: false,
          message: 'Inspection not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: inspection
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getInspectionsByBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const { bookingId } = req.params;
      const inspections = await inspectionService.getInspectionsByBooking(bookingId);
      
      res.status(200).json({
        success: true,
        data: inspections
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getAllInspections(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: req.query.status as string,
        mechanicId: req.query.mechanicId as string
      };
      
      const inspections = await inspectionService.getAllInspections(filters);
      
      res.status(200).json({
        success: true,
        data: inspections
      });
    } catch (error: any) {
      next(error);
    }
  }

  async updateInspection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const inspection = await inspectionService.updateInspection(id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Inspection updated successfully',
        data: inspection
      });
    } catch (error: any) {
      next(error);
    }
  }
}
