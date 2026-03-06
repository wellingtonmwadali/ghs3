import { Request, Response, NextFunction } from 'express';
import { MechanicService } from '../../application/services/Mechanic.service';

export class MechanicController {
  private mechanicService: MechanicService;

  constructor() {
    this.mechanicService = new MechanicService();
  }

  createMechanic = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mechanic = await this.mechanicService.createMechanic(req.body);
      res.status(201).json({
        success: true,
        data: mechanic
      });
    } catch (error) {
      next(error);
    }
  };

  updateMechanic = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const mechanic = await this.mechanicService.updateMechanic(id, req.body);
      res.json({
        success: true,
        data: mechanic
      });
    } catch (error) {
      next(error);
    }
  };

  getMechanic = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const mechanic = await this.mechanicService.getMechanicById(id);
      if (!mechanic) {
        return res.status(404).json({
          success: false,
          message: 'Mechanic not found'
        });
      }
      res.json({
        success: true,
        data: mechanic
      });
    } catch (error) {
      next(error);
    }
  };

  getAllMechanics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, specialization, availability, page, limit } = req.query;
      const result = await this.mechanicService.getAllMechanics({
        search: search as string,
        specialization: specialization as string,
        availability: availability as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });
      res.json({
        success: true,
        data: result.mechanics,
        pagination: {
          total: result.total,
          page: result.page,
          pages: result.pages
        }
      });
    } catch (error) {
      next(error);
    }
  };

  deleteMechanic = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.mechanicService.deleteMechanic(id);
      res.json({
        success: true,
        message: 'Mechanic deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  getAvailableMechanics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mechanics = await this.mechanicService.getAvailableMechanics();
      res.json({
        success: true,
        data: mechanics
      });
    } catch (error) {
      next(error);
    }
  };

  getBirthdaysThisMonth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mechanics = await this.mechanicService.getBirthdaysThisMonth();
      res.json({
        success: true,
        data: mechanics
      });
    } catch (error) {
      next(error);
    }
  };

  getTopPerformers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit } = req.query;
      const mechanics = await this.mechanicService.getTopPerformers(
        limit ? parseInt(limit as string) : undefined
      );
      res.json({
        success: true,
        data: mechanics
      });
    } catch (error) {
      next(error);
    }
  };

  assignJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { carId } = req.body;
      const mechanic = await this.mechanicService.assignJob(id, carId);
      res.json({
        success: true,
        data: mechanic
      });
    } catch (error) {
      next(error);
    }
  };

  completeJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { carId } = req.body;
      await this.mechanicService.completeJob(id, carId);
      res.json({
        success: true,
        message: 'Job completed successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}
