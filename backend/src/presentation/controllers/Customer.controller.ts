import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../../application/services/Customer.service';

export class CustomerController {
  private customerService: CustomerService;

  constructor() {
    this.customerService = new CustomerService();
  }

  createCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await this.customerService.createCustomer(req.body);
      res.status(201).json({
        success: true,
        data: customer
      });
    } catch (error) {
      next(error);
    }
  };

  updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const customer = await this.customerService.updateCustomer(id, req.body);
      res.json({
        success: true,
        data: customer
      });
    } catch (error) {
      next(error);
    }
  };

  getCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const customer = await this.customerService.getCustomerById(id);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }
      res.json({
        success: true,
        data: customer
      });
    } catch (error) {
      next(error);
    }
  };

  getAllCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, page, limit, sortBy, sortOrder, gender, minVisits, maxVisits, sort } = req.query;
      const result = await this.customerService.getAllCustomers({
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        gender: gender as string,
        minVisits: minVisits ? parseInt(minVisits as string) : undefined,
        maxVisits: maxVisits ? parseInt(maxVisits as string) : undefined,
        sort: sort as string
      });
      res.json({
        success: true,
        data: result.customers,
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

  deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.customerService.deleteCustomer(id);
      res.json({
        success: true,
        message: 'Customer deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  getCustomerServiceHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const customer = await this.customerService.getCustomerServiceHistory(id);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }
      res.json({
        success: true,
        data: customer
      });
    } catch (error) {
      next(error);
    }
  };

  getTopCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit } = req.query;
      const customers = await this.customerService.getTopCustomers(
        limit ? parseInt(limit as string) : undefined
      );
      res.json({
        success: true,
        data: customers
      });
    } catch (error) {
      next(error);
    }
  };

  searchCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }
      const customers = await this.customerService.searchCustomers(q as string);
      res.json({
        success: true,
        data: customers
      });
    } catch (error) {
      next(error);
    }
  };

  addServiceToHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { carId, serviceDetails, cost } = req.body;
      const customer = await this.customerService.addServiceToHistory(
        id,
        carId,
        serviceDetails,
        cost
      );
      res.json({
        success: true,
        data: customer
      });
    } catch (error) {
      next(error);
    }
  };

  sendPromoToCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { customerIds, messageId } = req.body;
      
      if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Customer IDs are required'
        });
      }

      if (!messageId) {
        return res.status(400).json({
          success: false,
          message: 'Message ID is required'
        });
      }

      const result = await this.customerService.sendPromoToCustomers(customerIds, messageId);
      
      res.json({
        success: true,
        message: `Promotional message sent to ${result.sent} customer(s)`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}
