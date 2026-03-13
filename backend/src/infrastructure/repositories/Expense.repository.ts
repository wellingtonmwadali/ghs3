import { ExpenseModel, IExpenseDocument } from '../models/Expense.model';
import { IExpense, IExpenseFilters } from '../../domain/entities/Expense';

export class ExpenseRepository {
  async create(expenseData: IExpense): Promise<IExpenseDocument> {
    const expense = new ExpenseModel(expenseData);
    return await expense.save();
  }

  async findById(id: string): Promise<IExpenseDocument | null> {
    return await ExpenseModel.findById(id);
  }

  async findAll(filters?: IExpenseFilters, limit?: number, skip?: number): Promise<IExpenseDocument[]> {
    const query: any = {};

    if (filters?.category) query.category = filters.category;
    if (filters?.status) query.status = filters.status;
    
    if (filters?.startDate || filters?.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = filters.startDate;
      if (filters.endDate) query.date.$lte = filters.endDate;
    }
    
    if (filters?.minAmount || filters?.maxAmount) {
      query.amount = {};
      if (filters.minAmount) query.amount.$gte = filters.minAmount;
      if (filters.maxAmount) query.amount.$lte = filters.maxAmount;
    }

    let queryBuilder = ExpenseModel.find(query).sort({ date: -1 });
    
    if (skip) queryBuilder = queryBuilder.skip(skip);
    if (limit) queryBuilder = queryBuilder.limit(limit);
    
    return await queryBuilder;
  }

  async update(id: string, updateData: Partial<IExpense>): Promise<IExpenseDocument | null> {
    return await ExpenseModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await ExpenseModel.findByIdAndDelete(id);
    return !!result;
  }

  async countByFilters(filters: IExpenseFilters): Promise<number> {
    const query: any = {};
    
    if (filters.category) query.category = filters.category;
    if (filters.status) query.status = filters.status;
    
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = filters.startDate;
      if (filters.endDate) query.date.$lte = filters.endDate;
    }
    
    return await ExpenseModel.countDocuments(query);
  }

  async getTotalByCategory(startDate?: Date, endDate?: Date): Promise<any[]> {
    const match: any = {};
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = startDate;
      if (endDate) match.date.$lte = endDate;
    }

    return await ExpenseModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);
  }

  async getTotalExpenses(startDate?: Date, endDate?: Date): Promise<number> {
    const match: any = { status: { $in: ['approved', 'paid'] } };
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = startDate;
      if (endDate) match.date.$lte = endDate;
    }

    const result = await ExpenseModel.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return result[0]?.total || 0;
  }

  async findByCarId(carId: string): Promise<IExpenseDocument[]> {
    return await ExpenseModel.find({ relatedCarId: carId }).sort({ date: -1 });
  }

  async generateExpenseNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // Find the latest expense for this month
    const latestExpense = await ExpenseModel.findOne({
      expenseNumber: new RegExp(`^EXP-${year}${month}`)
    }).sort({ expenseNumber: -1 });

    if (latestExpense) {
      const lastSequence = parseInt(latestExpense.expenseNumber.split('-')[2]);
      const newSequence = String(lastSequence + 1).padStart(6, '0');
      return `EXP-${year}${month}-${newSequence}`;
    }

    return `EXP-${year}${month}-000001`;
  }
}
