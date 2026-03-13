import { ExpenseRepository } from '../../infrastructure/repositories/Expense.repository';
import { IExpense, IExpenseFilters } from '../../domain/entities/Expense';
import { IExpenseDocument } from '../../infrastructure/models/Expense.model';
import { EnhancedError, ErrorFactory } from '../../utils/errorHandler';

export class ExpenseService {
  private expenseRepository: ExpenseRepository;

  constructor() {
    this.expenseRepository = new ExpenseRepository();
  }

  async createExpense(expenseData: Partial<IExpense>): Promise<IExpenseDocument> {
    // Generate expense number
    const expenseNumber = await this.expenseRepository.generateExpenseNumber();
    
    const expense = await this.expenseRepository.create({
      ...expenseData,
      expenseNumber,
      status: 'pending'
    } as IExpense);

    console.log(`[EXPENSE] Created: ${expenseNumber} - ${expenseData.amount} KES`);
    return expense;
  }

  async getExpenseById(id: string): Promise<IExpenseDocument> {
    const expense = await this.expenseRepository.findById(id);
    if (!expense) {
      throw ErrorFactory.notFound('Expense', id);
    }
    return expense;
  }

  async getAllExpenses(
    filters?: IExpenseFilters,
    page: number = 1,
    limit: number = 50
  ): Promise<{ expenses: IExpenseDocument[]; total: number; page: number; pages: number }> {
    const skip = (page - 1) * limit;
    const expenses = await this.expenseRepository.findAll(filters, limit, skip);
    const total = await this.expenseRepository.countByFilters(filters || {});

    return {
      expenses,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  async updateExpense(id: string, updateData: Partial<IExpense>): Promise<IExpenseDocument> {
    const expense = await this.expenseRepository.findById(id);
    if (!expense) {
      throw ErrorFactory.notFound('Expense', id);
    }

    // Prevent changing expense number
    if (updateData.expenseNumber) {
      delete updateData.expenseNumber;
    }

    const updated = await this.expenseRepository.update(id, updateData);
    if (!updated) {
      throw ErrorFactory.notFound('Expense', id);
    }

    console.log(`[EXPENSE] Updated: ${updated.expenseNumber}`);
    return updated;
  }

  async approveExpense(id: string, approvedBy: string, approvedByName: string): Promise<IExpenseDocument> {
    const expense = await this.expenseRepository.findById(id);
    if (!expense) {
      throw ErrorFactory.notFound('Expense', id);
    }

    if (expense.status !== 'pending') {
      throw ErrorFactory.validationError(`Cannot approve expense with status: ${expense.status}`);
    }

    const updated = await this.expenseRepository.update(id, {
      status: 'approved',
      approvedBy,
      approvedByName
    });

    console.log(`[EXPENSE] Approved: ${expense.expenseNumber} by ${approvedByName}`);
    return updated!;
  }

  async rejectExpense(id: string, reason?: string): Promise<IExpenseDocument> {
    const expense = await this.expenseRepository.findById(id);
    if (!expense) {
      throw ErrorFactory.notFound('Expense', id);
    }

    if (expense.status !== 'pending') {
      throw ErrorFactory.validationError(`Cannot reject expense with status: ${expense.status}`);
    }

    const updated = await this.expenseRepository.update(id, {
      status: 'rejected',
      notes: reason ? `${expense.notes || ''}\nRejection reason: ${reason}` : expense.notes
    });

    console.log(`[EXPENSE] Rejected: ${expense.expenseNumber}`);
    return updated!;
  }

  async markAsPaid(id: string): Promise<IExpenseDocument> {
    const expense = await this.expenseRepository.findById(id);
    if (!expense) {
      throw ErrorFactory.notFound('Expense', id);
    }

    if (expense.status !== 'approved') {
      throw ErrorFactory.validationError(`Can only mark approved expenses as paid. Current status: ${expense.status}`);
    }

    const updated = await this.expenseRepository.update(id, {
      status: 'paid'
    });

    console.log(`[EXPENSE] Marked as paid: ${expense.expenseNumber}`);
    return updated!;
  }

  async deleteExpense(id: string): Promise<void> {
    const expense = await this.expenseRepository.findById(id);
    if (!expense) {
      throw ErrorFactory.notFound('Expense', id);
    }

    // Can only delete pending or rejected expenses
    if (expense.status === 'approved' || expense.status === 'paid') {
      throw ErrorFactory.validationError('Cannot delete approved or paid expenses');
    }

    await this.expenseRepository.delete(id);
    console.log(`[EXPENSE] Deleted: ${expense.expenseNumber}`);
  }

  async getExpensesByCategory(startDate?: Date, endDate?: Date): Promise<any[]> {
    return await this.expenseRepository.getTotalByCategory(startDate, endDate);
  }

  async getTotalExpenses(startDate?: Date, endDate?: Date): Promise<number> {
    return await this.expenseRepository.getTotalExpenses(startDate, endDate);
  }

  async getExpensesByCar(carId: string): Promise<IExpenseDocument[]> {
    return await this.expenseRepository.findByCarId(carId);
  }

  async getProfitLoss(startDate: Date, endDate: Date): Promise<{
    revenue: number;
    expenses: number;
    profit: number;
    profitMargin: number;
  }> {
    // This would integrate with invoice repository to get revenue
    const expenses = await this.getTotalExpenses(startDate, endDate);
    
    // TODO: Get actual revenue from invoice repository
    // For now, return just expense data
    return {
      revenue: 0, // To be implemented with invoice integration
      expenses,
      profit: 0 - expenses,
      profitMargin: 0
    };
  }
}
