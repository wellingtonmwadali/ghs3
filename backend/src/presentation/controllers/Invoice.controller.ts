import { Request, Response, NextFunction } from 'express';
import { InvoiceService } from '../../application/services/Invoice.service';

export class InvoiceController {
  private invoiceService: InvoiceService;

  constructor() {
    this.invoiceService = new InvoiceService();
  }

  getAllInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const skip = req.query.skip ? parseInt(req.query.skip as string) : undefined;
      const carId = req.query.carId as string | undefined;
      
      let invoices;
      if (carId) {
        invoices = await this.invoiceService.getCarInvoices(carId);
      } else {
        invoices = await this.invoiceService.getAllInvoices(limit, skip);
      }

      res.status(200).json({
        success: true,
        data: invoices
      });
    } catch (error) {
      next(error);
    }
  };

  createInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await this.invoiceService.createInvoice(req.body);

      res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  };

  getInvoiceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await this.invoiceService.getInvoiceById(req.params.id);

      res.status(200).json({
        success: true,
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  };

  addPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await this.invoiceService.addPayment(req.params.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Payment added successfully',
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  };

  getOutstandingInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoices = await this.invoiceService.getOutstandingInvoices();

      res.status(200).json({
        success: true,
        data: invoices
      });
    } catch (error) {
      next(error);
    }
  };

  getRevenueStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.invoiceService.getRevenueStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };

  deleteInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.invoiceService.deleteInvoice(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Invoice deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  generateFromJobCard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await this.invoiceService.generateFromJobCard(req.params.carId);

      res.status(201).json({
        success: true,
        message: 'Invoice generated from job card successfully',
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  };
}
