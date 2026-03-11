import { InvoiceRepository } from '../../infrastructure/repositories/Invoice.repository';
import { CarRepository } from '../../infrastructure/repositories/Car.repository';
import { CustomerRepository } from '../../infrastructure/repositories/Customer.repository';
import { IInvoice } from '../../domain/entities/Invoice';
import { AppError } from '../../presentation/middlewares/error.middleware';

export class InvoiceService {
  private invoiceRepository: InvoiceRepository;
  private carRepository: CarRepository;
  private customerRepository: CustomerRepository;

  constructor() {
    this.invoiceRepository = new InvoiceRepository();
    this.carRepository = new CarRepository();
    this.customerRepository = new CustomerRepository();
  }

  async createInvoice(invoiceData: IInvoice) {
    // Validate car and customer
    const car = await this.carRepository.findById(invoiceData.carId);
    if (!car) {
      throw new AppError('Car not found', 404);
    }

    const customer = await this.customerRepository.findById(invoiceData.customerId);
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    // Generate invoice number
    invoiceData.invoiceNumber = await this.invoiceRepository.generateInvoiceNumber();

    // Calculate balance
    invoiceData.balance = invoiceData.total - invoiceData.paidAmount;

    // Set payment status
    if (invoiceData.paidAmount === 0) {
      invoiceData.paymentStatus = 'pending';
    } else if (invoiceData.paidAmount < invoiceData.total) {
      invoiceData.paymentStatus = 'partial';
    } else {
      invoiceData.paymentStatus = 'paid';
    }

    const invoice = await this.invoiceRepository.create(invoiceData);

    // Update car payment info
    await this.carRepository.update(invoiceData.carId, {
      paidAmount: invoiceData.paidAmount,
      paymentStatus: invoiceData.paymentStatus
    });

    return invoice;
  }

  async addPayment(invoiceId: string, paymentData: any) {
    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    const invoiceData = invoice as any;

    // Calculate new paid amount and balance
    const newPaidAmount = invoiceData.paidAmount + paymentData.amount;
    const newBalance = invoiceData.total - newPaidAmount;

    // Determine payment status
    let paymentStatus: 'pending' | 'partial' | 'paid' = 'partial';
    if (newPaidAmount >= invoiceData.total) {
      paymentStatus = 'paid';
    }

    // Add payment
    const updatedInvoice = await this.invoiceRepository.addPayment(invoiceId, paymentData);

    // Update invoice status and balance
    await this.invoiceRepository.update(invoiceId, {
      balance: newBalance,
      paymentStatus
    });

    // Update car payment info
    await this.carRepository.update(invoiceData.carId.toString(), {
      paidAmount: newPaidAmount,
      paymentStatus
    });

    return updatedInvoice;
  }

  async getAllInvoices(limit?: number, skip?: number) {
    return await this.invoiceRepository.findAll(limit, skip);
  }

  async getInvoiceById(id: string) {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }
    return invoice;
  }

  async getInvoiceByNumber(invoiceNumber: string) {
    const invoice = await this.invoiceRepository.findByInvoiceNumber(invoiceNumber);
    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }
    return invoice;
  }

  async getCustomerInvoices(customerId: string) {
    return await this.invoiceRepository.findByCustomer(customerId);
  }

  async getCarInvoices(carId: string) {
    return await this.invoiceRepository.findByCar(carId);
  }

  async getOutstandingInvoices() {
    return await this.invoiceRepository.getOutstandingInvoices();
  }

  async getRevenueStats() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Get all invoices for statistics
    const allInvoices = await this.invoiceRepository.findAll();
    
    // Count invoices by status
    const paidInvoices = allInvoices.filter(inv => (inv as any).paymentStatus === 'paid').length;
    const unpaidInvoices = allInvoices.filter(inv => (inv as any).paymentStatus === 'pending').length;
    const partialInvoices = allInvoices.filter(inv => (inv as any).paymentStatus === 'partial').length;
    
    // This month's invoices
    const thisMonthInvoices = allInvoices.filter(inv => {
      const issueDate = new Date((inv as any).issuedDate);
      return issueDate >= startOfMonth && issueDate <= endOfMonth;
    });
    
    const totalInvoicesThisMonth = thisMonthInvoices.length;
    const revenueThisMonth = thisMonthInvoices.reduce((sum, inv) => sum + ((inv as any).paidAmount || 0), 0);
    
    // Last month for comparison
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    const lastMonthInvoices = allInvoices.filter(inv => {
      const issueDate = new Date((inv as any).issuedDate);
      return issueDate >= startOfLastMonth && issueDate <= endOfLastMonth;
    });
    const revenueLastMonth = lastMonthInvoices.reduce((sum, inv) => sum + ((inv as any).paidAmount || 0), 0);
    const revenueTrend = revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth * 100).toFixed(1) : 0;
    
    // Total revenue (all time)
    const totalRevenue = allInvoices.reduce((sum, inv) => sum + ((inv as any).paidAmount || 0), 0);
    
    // Average invoice value
    const totalInvoiceValue = allInvoices.reduce((sum, inv) => sum + ((inv as any).total || 0), 0);
    const averageInvoiceValue = allInvoices.length > 0 ? totalInvoiceValue / allInvoices.length : 0;
    
    // Top paying clients
    const customerPayments = new Map<string, { name: string, total: number, count: number }>();
    allInvoices.forEach(inv => {
      const invoiceData = inv as any;
      const customerId = invoiceData.customerId?._id?.toString() || invoiceData.customerId?.toString();
      const customerName = invoiceData.customerId?.name || 'Unknown Customer';
      const paidAmount = invoiceData.paidAmount || 0;
      
      if (customerId && paidAmount > 0) {
        const existing = customerPayments.get(customerId);
        if (existing) {
          existing.total += paidAmount;
          existing.count += 1;
        } else {
          customerPayments.set(customerId, { name: customerName, total: paidAmount, count: 1 });
        }
      }
    });
    
    const topPayingClients = Array.from(customerPayments.entries())
      .map(([customerId, data]) => ({
        customerId,
        customerName: data.name,
        totalPaid: data.total,
        invoiceCount: data.count
      }))
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, 5);
    
    // Payment method distribution
    const paymentMethods = new Map<string, { count: number, amount: number }>();
    allInvoices.forEach(inv => {
      const invoiceData = inv as any;
      if (invoiceData.payments && Array.isArray(invoiceData.payments)) {
        invoiceData.payments.forEach((payment: any) => {
          const method = payment.method || 'unknown';
          const amount = payment.amount || 0;
          const existing = paymentMethods.get(method);
          if (existing) {
            existing.count += 1;
            existing.amount += amount;
          } else {
            paymentMethods.set(method, { count: 1, amount });
          }
        });
      }
    });
    
    const paymentMethodDistribution = Array.from(paymentMethods.entries())
      .map(([method, data]) => ({
        method,
        count: data.count,
        amount: data.amount
      }))
      .sort((a, b) => b.amount - a.amount);
    
    // Monthly revenue trend (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      const monthInvoices = allInvoices.filter(inv => {
        const issueDate = new Date((inv as any).issuedDate);
        return issueDate >= monthStart && issueDate <= monthEnd;
      });
      const revenue = monthInvoices.reduce((sum, inv) => sum + ((inv as any).paidAmount || 0), 0);
      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue,
        invoiceCount: monthInvoices.length
      });
    }

    return {
      totalRevenue,
      paidInvoices,
      unpaidInvoices,
      partialInvoices,
      totalInvoicesThisMonth,
      revenueThisMonth,
      revenueTrend: Number(revenueTrend),
      averageInvoiceValue: Math.round(averageInvoiceValue),
      topPayingClients,
      paymentMethodDistribution,
      monthlyRevenue
    };
  }

  async deleteInvoice(id: string) {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    const deleted = await this.invoiceRepository.delete(id);
    if (!deleted) {
      throw new AppError('Failed to delete invoice', 500);
    }

    return { success: true, message: 'Invoice deleted successfully' };
  }
}
