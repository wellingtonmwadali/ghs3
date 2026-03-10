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

  async getOutstandingInvoices() {
    return await this.invoiceRepository.getOutstandingInvoices();
  }

  async getRevenueStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [revenueToday, revenueThisWeek, revenueThisMonth] = await Promise.all([
      this.invoiceRepository.getRevenueByPeriod(today, tomorrow),
      this.invoiceRepository.getRevenueByPeriod(startOfWeek, endOfWeek),
      this.invoiceRepository.getRevenueByPeriod(startOfMonth, endOfMonth)
    ]);

    return {
      revenueToday,
      revenueThisWeek,
      revenueThisMonth
    };
  }
}
