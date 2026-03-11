import { CustomerRepository } from '../../infrastructure/repositories/Customer.repository';
import { SettingsRepository } from '../../infrastructure/repositories/Settings.repository';
import { emailService } from '../../infrastructure/services/Email.service';
import { ICustomer } from '../../domain/entities/Customer';
import { ICustomerDocument } from '../../infrastructure/models/Customer.model';
import Joi from 'joi';

export class CustomerService {
  private customerRepository: CustomerRepository;
  private settingsRepository: SettingsRepository;

  constructor() {
    this.customerRepository = new CustomerRepository();
    this.settingsRepository = new SettingsRepository();
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
    gender?: string;
    minVisits?: number;
    maxVisits?: number;
    sort?: string;
  } = {}): Promise<{ customers: ICustomerDocument[]; total: number; page: number; pages: number }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    let query: any = {};

    // Search filter
    if (options.search) {
      query.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { email: { $regex: options.search, $options: 'i' } },
        { phone: { $regex: options.search, $options: 'i' } }
      ];
    }

    // Gender filter
    if (options.gender && options.gender !== 'all') {
      query.gender = options.gender;
    }

    // Build aggregation pipeline for visit count filtering
    let aggregationPipeline: any[] = [
      { $match: query },
      {
        $addFields: {
          visitCount: { $size: { $ifNull: ['$serviceHistory', []] } }
        }
      }
    ];

    // Visit count filters
    if (options.minVisits !== undefined || options.maxVisits !== undefined) {
      const visitFilter: any = {};
      if (options.minVisits !== undefined) {
        visitFilter.$gte = options.minVisits;
      }
      if (options.maxVisits !== undefined) {
        visitFilter.$lte = options.maxVisits;
      }
      aggregationPipeline.push({ $match: { visitCount: visitFilter } });
    }

    // Sorting
    let sortOption: any = {};
    if (options.sort) {
      // Handle sort like '-createdAt' or 'createdAt'
      if (options.sort.startsWith('-')) {
        const field = options.sort.substring(1);
        sortOption[field] = -1;
      } else {
        sortOption[options.sort] = 1;
      }
    } else {
      sortOption.createdAt = -1; // Default sort
    }
    aggregationPipeline.push({ $sort: sortOption });

    // Pagination
    aggregationPipeline.push({ $skip: skip });
    aggregationPipeline.push({ $limit: limit });

    // Execute aggregation
    const customers = await this.customerRepository.aggregate(aggregationPipeline);

    // Get total count
    const countPipeline = [...aggregationPipeline.slice(0, -2), { $count: 'total' }];
    const countResult = await this.customerRepository.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

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

  async sendPromoToCustomers(
    customerIds: string[],
    messageId: string
  ): Promise<{ sent: number; failed: number; details: any[] }> {
    try {
      // Fetch settings to get promotional message and delivery method
      const settings = await this.settingsRepository.getSettings();
      if (!settings) {
        throw new Error('Settings not found');
      }

      // Find the promotional message
      const promoMessage = settings.promotionalMessages.find(
        (msg: any) => msg.id === messageId
      );
      if (!promoMessage) {
        throw new Error('Promotional message not found');
      }

      const deliveryMethod = settings.promotionalDeliveryMethod;
      const results: any[] = [];
      let sentCount = 0;
      let failedCount = 0;

      // Process each customer
      for (const customerId of customerIds) {
        try {
          const customer = await this.customerRepository.findById(customerId);
          if (!customer) {
            results.push({
              customerId,
              status: 'failed',
              reason: 'Customer not found'
            });
            failedCount++;
            continue;
          }

          // Log the promotional message (in production, integrate with email/WhatsApp services)
          const result: any = {
            customerId: customer._id,
            customerName: customer.name,
            status: 'sent',
            methods: []
          };

          if (deliveryMethod.email && customer.email) {
            try {
              const emailSent = await emailService.sendPromotionalEmail({
                to: customer.email,
                customerName: customer.name,
                title: promoMessage.title,
                message: promoMessage.message || '',
                imageUrl: promoMessage.imageUrl,
                senderEmail: (settings as any).promotionalDeliveryMethod?.senderEmail
              });
              
              if (emailSent) {
                result.methods.push('email');
                console.log(`[PROMO EMAIL] Successfully sent to: ${customer.email}`);
              } else {
                console.error(`[PROMO EMAIL] Failed to send to: ${customer.email}`);
                result.status = 'failed';
                result.reason = 'Email delivery failed';
              }
            } catch (error) {
              console.error(`[PROMO EMAIL] Error sending to ${customer.email}:`, error);
              result.status = 'failed';
              result.reason = `Email error: ${error instanceof Error ? error.message : 'Unknown error'}`;
            }
          }

          if (deliveryMethod.whatsapp && customer.phone) {
            // TODO: Integrate with WhatsApp Business API
            console.log(`[PROMO WHATSAPP] To: ${customer.phone}`);
            console.log(`Message: ${promoMessage.title} - ${promoMessage.message}`);
            result.methods.push('whatsapp');
          }

          if (result.methods.length === 0) {
            result.status = 'failed';
            result.reason = 'No delivery method available';
            failedCount++;
          } else {
            sentCount++;
          }

          results.push(result);
        } catch (error) {
          results.push({
            customerId,
            status: 'failed',
            reason: error instanceof Error ? error.message : 'Unknown error'
          });
          failedCount++;
        }
      }

      return {
        sent: sentCount,
        failed: failedCount,
        details: results
      };
    } catch (error) {
      throw error;
    }
  }
}

// Validation schemas
export const createCustomerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  address: Joi.string().optional(),
  notes: Joi.string().optional()
});

export const updateCustomerSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  address: Joi.string().optional(),
  notes: Joi.string().optional()
});
