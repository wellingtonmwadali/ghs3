import { Request, Response, NextFunction } from 'express';
import { ExpenseService } from '../../application/services/Expense.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class ExpenseController {
  private expenseService: ExpenseService;

  constructor() {
    this.expenseService = new ExpenseService();
  }

  createExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const expenseData = {
        ...req.body,
        createdBy: req.user?.userId,
        createdByName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'System'
      };

      const expense = await this.expenseService.createExpense(expenseData);

      res.status(201).json({
        success: true,
        message: 'Expense created successfully',
        data: expense
      });
    } catch (error) {
      next(error);
    }
  };

  getAllExpenses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters: any = {};
      
      if (req.query.category) filters.category = req.query.category;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      if (req.query.relatedCarId) filters.relatedCarId = req.query.relatedCarId;

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const skip = req.query.skip ? parseInt(req.query.skip as string) : 0;

      const expenses = await this.expenseService.getAllExpenses(filters, limit, skip);

      res.status(200).json({
        success: true,
        data: expenses
      });
    } catch (error) {
      next(error);
    }
  };

  getExpenseById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const expense = await this.expenseService.getExpenseById(req.params.id);

      res.status(200).json({
        success: true,
        data: expense
      });
    } catch (error) {
      next(error);
    }
  };

  updateExpense = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const expense = await this.expenseService.updateExpense(req.params.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Expense updated successfully',
        data: expense
      });
    } catch (error) {
      next(error);
    }
  };

  approveExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const approvedBy = req.user?.userId;
      const approvedByName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'System';

      const expense = await this.expenseService.approveExpense(
        req.params.id,
        approvedBy!,
        approvedByName
      );

      res.status(200).json({
        success: true,
        message: 'Expense approved successfully',
        data: expense
      });
    } catch (error) {
      next(error);
    }
  };

  rejectExpense = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reason } = req.body;
      const expense = await this.expenseService.rejectExpense(req.params.id, reason);

      res.status(200).json({
        success: true,
        message: 'Expense rejected',
        data: expense
      });
    } catch (error) {
      next(error);
    }
  };

  markAsPaid = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const expense = await this.expenseService.markAsPaid(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Expense marked as paid',
        data: expense
      });
    } catch (error) {
      next(error);
    }
  };

  deleteExpense = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.expenseService.deleteExpense(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Expense deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  getExpensesByCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const expenses = await this.expenseService.getExpensesByCategory(startDate, endDate);

      res.status(200).json({
        success: true,
        data: expenses
      });
    } catch (error) {
      next(error);
    }
  };

  getTotalExpenses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const total = await this.expenseService.getTotalExpenses(startDate, endDate);

      res.status(200).json({
        success: true,
        data: { total }
      });
    } catch (error) {
      next(error);
    }
  };

  getProfitLoss = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);

      const profitLoss = await this.expenseService.getProfitLoss(startDate, endDate);

      res.status(200).json({
        success: true,
        data: profitLoss
      });
    } catch (error) {
      next(error);
    }
  };
}
