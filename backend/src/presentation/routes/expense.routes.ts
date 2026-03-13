import { Router } from 'express';
import { ExpenseController } from '../controllers/Expense.controller';
import { validate } from '../middlewares/validation.middleware';
import { createExpenseSchema, updateExpenseSchema } from '../../application/dto/validation.schemas';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();
const expenseController = new ExpenseController();

// All routes require authentication
router.use(authenticate);

// Stats routes (most specific first)
router.get('/stats/by-category', authorize('owner', 'manager'), expenseController.getExpensesByCategory);
router.get('/stats/total', authorize('owner', 'manager'), expenseController.getTotalExpenses);
router.get('/stats/profit-loss', authorize('owner', 'manager'), expenseController.getProfitLoss);

// Root routes
router.get('/', authorize('owner', 'manager'), expenseController.getAllExpenses);
router.post('/', authorize('owner', 'manager'), validate(createExpenseSchema), expenseController.createExpense);

// Action routes (before dynamic parameter)
router.post('/:id/approve', authorize('owner', 'manager'), expenseController.approveExpense);
router.post('/:id/reject', authorize('owner', 'manager'), expenseController.rejectExpense);
router.post('/:id/pay', authorize('owner', 'manager'), expenseController.markAsPaid);

// Dynamic parameter routes
router.get('/:id', authorize('owner', 'manager'), expenseController.getExpenseById);
router.put('/:id', authorize('owner', 'manager'), validate(updateExpenseSchema), expenseController.updateExpense);
router.delete('/:id', authorize('owner', 'manager'), expenseController.deleteExpense);

export default router;
