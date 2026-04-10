import { InvoiceRepository } from '../../infrastructure/repositories/Invoice.repository';
import { CarRepository } from '../../infrastructure/repositories/Car.repository';
import { CustomerRepository } from '../../infrastructure/repositories/Customer.repository';
import { ReceiptService } from './Receipt.service';
import { IInvoice } from '../../domain/entities/Invoice';
import { AppError } from '../../presentation/middlewares/error.middleware';
import { withTransaction } from '../../utils/transaction';
import { InvoiceModel } from '../../infrastructure/models/Invoice.model';
import { CarModel } from '../../infrastructure/models/Car.model';

export class InvoiceService {
  private invoiceRepository: InvoiceRepository;
  private carRepository: CarRepository;
  private customerRepository: CustomerRepository;
  private receiptService: ReceiptService;

  constructor() {
    this.invoiceRepository = new InvoiceRepository();
    this.carRepository = new CarRepository();
    this.customerRepository = new CustomerRepository();
    this.receiptService = new ReceiptService();
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

    // Execute payment operations within a transaction for atomicity
    const updatedInvoice = await withTransaction(async (session) => {
      // Add payment to invoice
      const invoice = await InvoiceModel.findById(invoiceId).session(session);
      if (!invoice) {
        throw new AppError('Invoice not found', 404);
      }

      // Add payment to history
      const paymentEntry = {
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        paymentDate: paymentData.paymentDate || new Date(),
        paymentReference: paymentData.paymentReference
      };

      invoice.payments = invoice.payments || [];
      invoice.payments.push(paymentEntry as any);
      invoice.paidAmount = (invoice.paidAmount || 0) + paymentData.amount;

      // Calculate new balance and status
      const newPaidAmount = invoice.paidAmount;
      const newBalance = invoice.total - newPaidAmount;

      let paymentStatus: 'pending' | 'partial' | 'paid' = 'partial';
      if (newPaidAmount >= invoice.total) {
        paymentStatus = 'paid';
      } else if (newPaidAmount <= 0) {
        paymentStatus = 'pending';
      }

      // Update invoice
      invoice.balance = newBalance;
      invoice.paymentStatus = paymentStatus;
      await invoice.save({ session });

      // Update car payment info if car exists (within same transaction)
      if (invoiceData.carId) {
        await CarModel.findByIdAndUpdate(
          invoiceData.carId.toString(),
          {
            paidAmount: newPaidAmount,
            paymentStatus
          },
          { session }
        );
      }

      console.log(`[PAYMENT] Transaction completed: Invoice ${invoice.invoiceNumber}, Amount: ${paymentData.amount} KES, Status: ${paymentStatus}`);
      
      return invoice;
    });

    // Generate and send receipt if payment is completed (outside transaction - non-critical)
    const paymentStatus = (updatedInvoice as any).paymentStatus;
    if (paymentStatus === 'paid' && invoiceData.customerEmail) {
      try {
        const car = await this.carRepository.findById(invoiceData.carId);
        const receiptData = {
          receiptNumber: this.receiptService.generateReceiptNumber(),
          customerName: invoiceData.customerName,
          customerEmail: invoiceData.customerEmail,
          customerPhone: invoiceData.customerPhone || '',
          amount: paymentData.amount,
          paymentMethod: paymentData.paymentMethod,
          paymentDate: paymentData.paymentDate || new Date(),
          vehiclePlate: car?.vehiclePlate || '',
          vehicleModel: car?.vehicleModel || '',
          serviceType: car?.serviceType || '',
          invoiceNumber: (updatedInvoice as any).invoiceNumber,
          carId: invoiceData.carId
        };

        // Send receipt email (non-blocking)
        this.receiptService.sendReceiptEmail(receiptData, invoiceData.customerEmail).catch(error => {
          console.error('[RECEIPT] Failed to send receipt email:', error);
        });

        console.log(`[RECEIPT] Receipt ${receiptData.receiptNumber} sent to ${invoiceData.customerEmail} for invoice ${(updatedInvoice as any).invoiceNumber}`);
      } catch (error) {
        console.error('[RECEIPT] Failed to generate receipt:', error);
        // Non-blocking - payment already succeeded
      }
    }

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
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Get all invoices for statistics
    const allInvoices = await this.invoiceRepository.findAll();
    
    // Count invoices by status
    const paidInvoices = allInvoices.filter(inv => (inv as any).paymentStatus === 'paid').length;
    const unpaidInvoices = allInvoices.filter(inv => (inv as any).paymentStatus === 'pending').length;
    const partialInvoices = allInvoices.filter(inv => (inv as any).paymentStatus === 'partial').length;

    // Today's revenue
    const todayInvoices = allInvoices.filter(inv => {
      const issueDate = new Date((inv as any).issuedDate);
      return issueDate >= startOfDay && issueDate <= endOfDay;
    });
    const revenueToday = todayInvoices.reduce((sum, inv) => sum + ((inv as any).paidAmount || 0), 0);

    // This week's revenue
    const thisWeekInvoices = allInvoices.filter(inv => {
      const issueDate = new Date((inv as any).issuedDate);
      return issueDate >= startOfWeek && issueDate <= endOfDay;
    });
    const revenueThisWeek = thisWeekInvoices.reduce((sum, inv) => sum + ((inv as any).paidAmount || 0), 0);
    
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
      revenueToday,
      revenueThisWeek,
      revenueThisMonth,
      revenueTrend: Number(revenueTrend),
      averageInvoiceValue: Math.round(averageInvoiceValue),
      topPayingClients,
      paymentMethodDistribution,
      monthlyRevenue
    };
  }

  async generateFromJobCard(carId: string) {
    const car = await this.carRepository.findById(carId);
    if (!car) {
      throw new AppError('Job card not found', 404);
    }

    const carData = car as any;

    // Check if invoice already exists for this car
    const existing = await this.invoiceRepository.findByCar(carId);
    if (existing && existing.length > 0) {
      throw new AppError('An invoice already exists for this job card', 400);
    }

    if (!carData.customerId) {
      throw new AppError('Job card has no customer assigned', 400);
    }

    // Build invoice items from labor lines + parts used
    const items: { description: string; quantity: number; unitPrice: number; total: number }[] = [];

    // Add labor lines
    if (carData.laborLines && carData.laborLines.length > 0) {
      for (const line of carData.laborLines) {
        items.push({
          description: `Labor: ${line.description}${line.technicianName ? ` (${line.technicianName})` : ''}`,
          quantity: line.hours,
          unitPrice: line.rate,
          total: line.total,
        });
      }
    }

    // Add parts used
    if (carData.partsUsed && carData.partsUsed.length > 0) {
      for (const part of carData.partsUsed) {
        const unitPrice = part.unitPrice || 0;
        items.push({
          description: `Part: ${part.itemName}`,
          quantity: part.quantity,
          unitPrice,
          total: unitPrice * part.quantity,
        });
      }
    }

    // Add custom service if present
    if (carData.customServiceDescription && carData.customServiceAmount) {
      items.push({
        description: carData.customServiceDescription,
        quantity: 1,
        unitPrice: carData.customServiceAmount,
        total: carData.customServiceAmount,
      });
    }

    if (items.length === 0) {
      throw new AppError('Job card has no labor lines or parts to invoice', 400);
    }

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxRate = 16; // Kenya VAT 16%
    const tax = Math.round(subtotal * taxRate / 100);
    const total = subtotal + tax;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // Net 30

    const invoiceData: IInvoice = {
      invoiceNumber: '', // will be generated
      carId,
      customerId: carData.customerId.toString(),
      items,
      subtotal,
      tax,
      taxRate,
      total,
      paidAmount: carData.paidAmount || 0,
      balance: total - (carData.paidAmount || 0),
      paymentStatus: 'pending',
      payments: [],
      issuedDate: new Date(),
      dueDate,
      notes: `Auto-generated from Job Card ${carData.jobCardNumber || carId}`,
    };

    // Set correct payment status
    if (invoiceData.paidAmount >= total) {
      invoiceData.paymentStatus = 'paid';
      invoiceData.balance = 0;
    } else if (invoiceData.paidAmount > 0) {
      invoiceData.paymentStatus = 'partial';
    }

    const invoice = await this.createInvoice(invoiceData);

    // Update car with invoice back-reference
    await this.carRepository.update(carId, { invoiceId: (invoice as any)._id.toString() });

    return invoice;
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
