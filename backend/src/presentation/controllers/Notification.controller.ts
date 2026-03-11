import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../../application/services/Notification.service';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Manually trigger low inventory check
   * POST /notifications/check-inventory
   */
  checkInventory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.notificationService.triggerLowInventoryCheck();

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          itemsFound: result.itemsFound
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Manually trigger late service check
   * POST /notifications/check-late-services
   */
  checkLateServices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.notificationService.triggerLateServiceCheck();

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          carsFound: result.carsFound
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Run all notification checks
   * POST /notifications/check-all
   */
  checkAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inventoryResult = await this.notificationService.triggerLowInventoryCheck();
      const lateServiceResult = await this.notificationService.triggerLateServiceCheck();

      res.status(200).json({
        success: true,
        message: 'All notification checks completed',
        data: {
          inventory: {
            itemsFound: inventoryResult.itemsFound,
            message: inventoryResult.message
          },
          lateServices: {
            carsFound: lateServiceResult.carsFound,
            message: lateServiceResult.message
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };
}
