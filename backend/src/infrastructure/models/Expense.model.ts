import { Schema, model, Document } from 'mongoose';
import { IExpense } from '../../domain/entities/Expense';

export interface IExpenseDocument extends Omit<IExpense, '_id'>, Document {}

const ExpenseSchema = new Schema<IExpenseDocument>(
  {
    expenseNumber: { type: String, required: true, unique: true },
    category: {
      type: String,
      required: true,
      enum: ['parts', 'labor', 'utilities', 'rent', 'equipment', 'marketing', 'other']
    },
    description: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['cash', 'card', 'transfer', 'cheque']
    },
    vendor: { type: String },
    receiptNumber: { type: String },
    relatedCarId: { type: Schema.Types.ObjectId, ref: 'Car' },
    approvedBy: { type: String },
    approvedByName: { type: String },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected', 'paid'],
      default: 'pending'
    },
    notes: { type: String },
    createdBy: { type: String },
    createdByName: { type: String }
  },
  { timestamps: true }
);

// Indexes
ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ category: 1, date: -1 });
ExpenseSchema.index({ status: 1 });
ExpenseSchema.index({ relatedCarId: 1 });

export const ExpenseModel = model<IExpenseDocument>('Expense', ExpenseSchema);
