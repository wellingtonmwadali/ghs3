import { Request, Response, NextFunction } from 'express';
import { CarService } from '../../application/services/Car.service';

export class CarController {
  private carService: CarService;

  constructor() {
    this.carService = new CarService();
  }

  createCar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      const carData = {
        ...req.body,
        createdBy: user._id || user.userId,
        createdByName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'System'
      };
      
      const car = await this.carService.createCar(carData);

      res.status(201).json({
        success: true,
        message: 'Job card created successfully',
        data: car
      });
    } catch (error) {
      next(error);
    }
  };

  getAllCars = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { stage, serviceType, assignedMechanicId, paymentStatus, jobType, priority, isPaused, bayNumber, search, page, limit } = req.query;

      const filters: any = {};
      if (stage) filters.stage = stage;
      if (serviceType) filters.serviceType = serviceType;
      if (assignedMechanicId) filters.assignedMechanicId = assignedMechanicId;
      if (paymentStatus) filters.paymentStatus = paymentStatus;
      if (jobType) filters.jobType = jobType;
      if (priority) filters.priority = priority;
      if (isPaused !== undefined) filters.isPaused = isPaused === 'true';
      if (bayNumber) filters.bayNumber = bayNumber;
      if (search) filters.search = search;

      const result = await this.carService.getAllCars(
        filters,
        page ? parseInt(page as string) : 1,
        limit ? parseInt(limit as string) : 50
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getCarById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const car = await this.carService.getCarById(req.params.id);

      res.status(200).json({
        success: true,
        data: car
      });
    } catch (error) {
      next(error);
    }
  };

  updateCar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      const updateData = {
        ...req.body,
        lastModifiedBy: user._id || user.userId,
        lastModifiedByName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'System'
      };
      
      const car = await this.carService.updateCar(req.params.id, updateData);

      res.status(200).json({
        success: true,
        message: 'Job card updated successfully',
        data: car
      });
    } catch (error) {
      next(error);
    }
  };

  // Pause a job card
  pauseCar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { reason } = req.body;
      const userId = user._id || user.userId;
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'System';

      const car = await this.carService.pauseCar(req.params.id, reason, userId, userName);

      res.status(200).json({
        success: true,
        message: 'Job card paused',
        data: car
      });
    } catch (error) {
      next(error);
    }
  };

  // Resume a paused job card
  resumeCar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const userId = user._id || user.userId;
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'System';

      const car = await this.carService.resumeCar(req.params.id, userId, userName);

      res.status(200).json({
        success: true,
        message: 'Job card resumed',
        data: car
      });
    } catch (error) {
      next(error);
    }
  };

  // Approve a job card
  approveCar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { notes } = req.body;
      const userId = user._id || user.userId;
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'System';

      const car = await this.carService.approveCar(req.params.id, notes || '', userId, userName);

      res.status(200).json({
        success: true,
        message: 'Job card approved',
        data: car
      });
    } catch (error) {
      next(error);
    }
  };

  // Reject a job card
  rejectCar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { notes } = req.body;
      const userId = user._id || user.userId;
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'System';

      const car = await this.carService.rejectCar(req.params.id, notes || '', userId, userName);

      res.status(200).json({
        success: true,
        message: 'Job card rejected',
        data: car
      });
    } catch (error) {
      next(error);
    }
  };

  deleteCar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.carService.deleteCar(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Job card removed successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  getGarageBoardData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardData = await this.carService.getGarageBoardData();

      res.status(200).json({
        success: true,
        data: boardData
      });
    } catch (error) {
      next(error);
    }
  };

  getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.carService.getDashboardStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };
}
