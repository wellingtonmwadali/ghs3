// Domain Entity: Expense
export interface IExpense {
  _id?: string;
  expenseNumber: string;
  category: 'parts' | 'labor' | 'utilities' | 'rent' | 'equipment' | 'marketing' | 'other';
  description: string;
  amount: number;
  date: Date;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'cheque';
  vendor?: string;
  receiptNumber?: string;
  relatedCarId?: string;
  approvedBy?: string;
  approvedByName?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  notes?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IExpenseFilters {
  category?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}
