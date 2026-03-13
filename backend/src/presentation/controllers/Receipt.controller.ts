import { Request, Response, NextFunction } from 'express';
import { ReceiptService } from '../../application/services/Receipt.service';

export class ReceiptController {
  private receiptService: ReceiptService;

  constructor() {
    this.receiptService = new ReceiptService();
  }

  generateReceipt = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const receiptData = {
        receiptNumber: this.receiptService.generateReceiptNumber(),
        customerName: req.body.customerName,
        customerEmail: req.body.customerEmail,
        customerPhone: req.body.customerPhone,
        amount: req.body.amount,
        paymentMethod: req.body.paymentMethod,
        paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : new Date(),
        vehiclePlate: req.body.vehiclePlate,
        vehicleModel: req.body.vehicleModel,
        serviceType: req.body.serviceType,
        invoiceNumber: req.body.invoiceNumber,
        carId: req.body.carId
      };

      const receiptHtml = await this.receiptService.generateReceipt(receiptData);

      res.status(200).json({
        success: true,
        message: 'Receipt generated successfully',
        data: { 
          html: receiptHtml,
          receiptNumber: receiptData.receiptNumber
        }
      });
    } catch (error) {
      next(error);
    }
  };

  emailReceipt = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const receiptData = {
        receiptNumber: this.receiptService.generateReceiptNumber(),
        customerName: req.body.customerName,
        customerEmail: req.body.customerEmail,
        customerPhone: req.body.customerPhone,
        amount: req.body.amount,
        paymentMethod: req.body.paymentMethod,
        paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : new Date(),
        vehiclePlate: req.body.vehiclePlate,
        vehicleModel: req.body.vehicleModel,
        serviceType: req.body.serviceType,
        invoiceNumber: req.body.invoiceNumber,
        carId: req.body.carId
      };

      await this.receiptService.sendReceiptEmail(receiptData, req.body.customerEmail);

      res.status(200).json({
        success: true,
        message: 'Receipt sent to customer email successfully',
        data: {
          receiptNumber: receiptData.receiptNumber
        }
      });
    } catch (error) {
      next(error);
    }
  };
}
