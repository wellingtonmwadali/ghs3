// Domain Entity: Invoice
export interface IInvoice {
  _id?: string;
  invoiceNumber: string;
  carId: string;
  customerId: string;
  
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  
  subtotal: number;
  tax: number;
  taxRate: number;
  discount?: number;
  total: number;
  
  paidAmount: number;
  balance: number;
  
  paymentStatus: 'pending' | 'partial' | 'paid';
  
  payments: {
    amount: number;
    method: 'cash' | 'card' | 'transfer' | 'mpesa' | 'insurance';
    reference?: string;
    paymentPID?: string;
    paidAt: Date;
  }[];
  
  dueDate: Date;
  issuedDate: Date;
  
  notes?: string;
  
  createdAt?: Date;
  updatedAt?: Date;
}
