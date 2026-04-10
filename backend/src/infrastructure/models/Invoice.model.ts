import mongoose, { Schema, Document } from 'mongoose';
import { IInvoice } from '../../domain/entities/Invoice';

export interface IInvoiceDocument extends Omit<IInvoice, '_id'>, Document {}

const InvoiceSchema = new Schema<IInvoiceDocument>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    carId: { type: Schema.Types.ObjectId, ref: 'Car', required: true } as any,
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true } as any,
    
    items: [{
      description: { type: String, required: true },
      quantity: { type: Number, required: true },
      unitPrice: { type: Number, required: true },
      total: { type: Number, required: true }
    }],
    
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    taxRate: { type: Number, required: true, default: 0.16 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    
    paidAmount: { type: Number, default: 0 },
    balance: { type: Number, required: true },
    
    paymentStatus: { 
      type: String, 
      enum: ['pending', 'partial', 'paid'],
      default: 'pending' 
    },
    approvalStatus: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'rejected'],
      default: 'pending_approval'
    },
    approvedBy: { type: String },
    approvedByName: { type: String },
    approvedAt: { type: Date },
    
    payments: [{
      amount: { type: Number, required: true },
      method: { 
        type: String, 
        enum: ['cash', 'card', 'transfer', 'mpesa', 'insurance'],
        required: true 
      },
      reference: { type: String },
      paymentPID: { type: String },
      paidAt: { type: Date, default: Date.now }
    }],
    
    dueDate: { type: Date, required: true },
    issuedDate: { type: Date, default: Date.now },
    
    notes: { type: String }
  },
  { timestamps: true }
);

InvoiceSchema.index({ customerId: 1, issuedDate: -1 });
InvoiceSchema.index({ paymentStatus: 1 });

export const InvoiceModel = mongoose.model<IInvoiceDocument>('Invoice', InvoiceSchema);
