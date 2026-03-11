import { InvoiceModel, IInvoiceDocument } from '../models/Invoice.model';
import { IInvoice } from '../../domain/entities/Invoice';

export class InvoiceRepository {
  async create(invoiceData: IInvoice): Promise<IInvoiceDocument> {
    const invoice = new InvoiceModel(invoiceData);
    return await invoice.save();
  }

  async findById(id: string): Promise<IInvoiceDocument | null> {
    return await InvoiceModel.findById(id).populate('customerId carId');
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<IInvoiceDocument | null> {
    return await InvoiceModel.findOne({ invoiceNumber });
  }

  async findByCustomer(customerId: string): Promise<IInvoiceDocument[]> {
    return await InvoiceModel.find({ customerId }).sort({ issuedDate: -1 });
  }

  async findByCar(carId: string): Promise<IInvoiceDocument[]> {
    return await InvoiceModel.find({ carId }).sort({ issuedDate: -1 });
  }

  async findAll(limit?: number, skip?: number): Promise<IInvoiceDocument[]> {
    let query = InvoiceModel.find()
      .populate('customerId', 'name email phone')
      .populate('carId', 'vehicleModel vehiclePlate')
      .sort({ issuedDate: -1 });
    
    if (skip) query = query.skip(skip);
    if (limit) query = query.limit(limit);
    
    return await query;
  }

  async update(id: string, updateData: Partial<IInvoice>): Promise<IInvoiceDocument | null> {
    return await InvoiceModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  async addPayment(invoiceId: string, payment: any): Promise<IInvoiceDocument | null> {
    return await InvoiceModel.findByIdAndUpdate(
      invoiceId,
      {
        $push: { payments: payment },
        $inc: { paidAmount: payment.amount }
      },
      { new: true }
    );
  }

  async getOutstandingInvoices(): Promise<IInvoiceDocument[]> {
    return await InvoiceModel.find({
      paymentStatus: { $in: ['pending', 'partial'] }
    }).sort({ dueDate: 1 });
  }

  async generateInvoiceNumber(): Promise<string> {
    const lastInvoice = await InvoiceModel.findOne().sort({ createdAt: -1 });
    
    if (!lastInvoice) {
      return 'INV-2026-0001';
    }
    
    const invoiceNum = (lastInvoice as any).invoiceNumber || 'INV-2026-0000';
    const lastNumber = parseInt(invoiceNum.split('-')[2]);
    const newNumber = (lastNumber + 1).toString().padStart(4, '0');
    
    return `INV-2026-${newNumber}`;
  }

  async delete(id: string): Promise<boolean> {
    const result = await InvoiceModel.findByIdAndDelete(id);
    return !!result;
  }

  async getRevenueByPeriod(startDate: Date, endDate: Date): Promise<number> {
    const result = await InvoiceModel.aggregate([
      {
        $match: {
          issuedDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$paidAmount' }
        }
      }
    ]);
    
    return result[0]?.totalRevenue || 0;
  }
}
