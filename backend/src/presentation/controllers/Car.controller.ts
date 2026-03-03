import { Request, Response, NextFunction } from 'express';
import { CarService } from '../../application/services/Car.service';

export class CarController {
  private carService: CarService;

  constructor() {
    this.carService = new CarService();
  }

  createCar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const car = await this.carService.createCar(req.body);

      res.status(201).json({
        success: true,
        message: 'Car added successfully',
        data: car
      });
    } catch (error) {
      next(error);
    }
  };

  getAllCars = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { stage, serviceType, assignedMechanicId, paymentStatus, page, limit } = req.query;

      const filters: any = {};
      if (stage) filters.stage = stage;
      if (serviceType) filters.serviceType = serviceType;
      if (assignedMechanicId) filters.assignedMechanicId = assignedMechanicId;
      if (paymentStatus) filters.paymentStatus = paymentStatus;

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
      const car = await this.carService.updateCar(req.params.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Car updated successfully',
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
        message: 'Car removed successfully'
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
