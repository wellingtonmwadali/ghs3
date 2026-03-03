import { CustomerRepository } from '../../infrastructure/repositories/Customer.repository';
import { ICustomer } from '../../domain/entities/Customer';
import { ICustomerDocument } from '../../infrastructure/models/Customer.model';
import Joi from 'joi';

export class CustomerService {
  private customerRepository: CustomerRepository;

  constructor() {
    this.customerRepository = new CustomerRepository();
  }

  async createCustomer(data: Partial<ICustomer>): Promise<ICustomerDocument> {
    const customer = await this.customerRepository.create(data as ICustomer);
    return customer;
  }

  async updateCustomer(id: string, data: Partial<ICustomer>): Promise<ICustomerDocument | null> {
    const customer = await this.customerRepository.update(id, data);
    if (!customer) {
      throw new Error('Customer not found');
    }
    return customer;
  }

  async getCustomerById(id: string): Promise<ICustomerDocument | null> {
    return await this.customerRepository.findById(id);
  }

  async getAllCustomers(options: {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ customers: ICustomerDocument[]; total: number; page: number; pages: number }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    let query: any = {};

    if (options.search) {
      query.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { email: { $regex: options.search, $options: 'i' } },
        { phone: { $regex: options.search, $options: 'i' } }
      ];
    }

    const customers = await this.customerRepository.findWithPagination(query, skip, limit);
    const total = await this.customerRepository.count(query);
    const pages = Math.ceil(total / limit);

    return { customers, total, page, pages };
  }

  async deleteCustomer(id: string): Promise<void> {
    const deleted = await this.customerRepository.delete(id);
    if (!deleted) {
      throw new Error('Customer not found');
    }
  }

  async getCustomerServiceHistory(customerId: string): Promise<ICustomerDocument | null> {
    const customer = await this.customerRepository.findByIdWithServiceHistory(customerId);
    return customer;
  }

  async getTopCustomers(limit: number = 10): Promise<ICustomerDocument[]> {
    return await this.customerRepository.findTopCustomers(limit);
  }

  async searchCustomers(query: string): Promise<ICustomerDocument[]> {
    return await this.customerRepository.searchCustomers(query);
  }

  async addServiceToHistory(
    customerId: string,
    carId: string,
    serviceDetails: string,
    cost: number
  ): Promise<ICustomerDocument | null> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const serviceHistory = customer.serviceHistory || [];
    serviceHistory.push({
      date: new Date(),
      carId,
      serviceDetails,
      cost
    });

    return await this.customerRepository.update(customerId, { serviceHistory });
  }
}

// Validation schemas
export const createCustomerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  address: Joi.string().optional(),
  notes: Joi.string().optional()
});

export const updateCustomerSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  address: Joi.string().optional(),
  notes: Joi.string().optional()
});
