import { CustomerModel, ICustomerDocument } from '../models/Customer.model';
import { ICustomer } from '../../domain/entities/Customer';

export class CustomerRepository {
  async create(customerData: ICustomer): Promise<ICustomerDocument> {
    const customer = new CustomerModel(customerData);
    return await customer.save();
  }

  async findById(id: string): Promise<ICustomerDocument | null> {
    return await CustomerModel.findById(id).populate('serviceHistory');
  }

  async findByEmail(email: string): Promise<ICustomerDocument | null> {
    return await CustomerModel.findOne({ email: email.toLowerCase() });
  }

  async findByPhone(phone: string): Promise<ICustomerDocument | null> {
    return await CustomerModel.findOne({ phone });
  }

  async findAll(limit?: number, skip?: number): Promise<ICustomerDocument[]> {
    let query = CustomerModel.find().sort({ createdAt: -1 });
    
    if (skip) query = query.skip(skip);
    if (limit) query = query.limit(limit);
    
    return await query;
  }

  async update(id: string, updateData: Partial<ICustomer>): Promise<ICustomerDocument | null> {
    return await CustomerModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await CustomerModel.findByIdAndDelete(id);
    return !!result;
  }

  async addToServiceHistory(customerId: string, serviceRecord: { date: Date, carId: string, serviceDetails: string, cost: number }): Promise<void> {
    await CustomerModel.findByIdAndUpdate(customerId, {
      $push: { serviceHistory: serviceRecord }
    });
  }

  async search(searchTerm: string): Promise<ICustomerDocument[]> {
    return await CustomerModel.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } }
      ]
    }).limit(20);
  }

  async getTopCustomers(limit: number = 10): Promise<ICustomerDocument[]> {
    // Calculate total spent from service history
    return await CustomerModel.aggregate([
      {
        $addFields: {
          totalSpent: {
            $sum: '$serviceHistory.cost'
          }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: limit }
    ]);
  }

  async findWithPagination(query: any, skip: number, limit: number): Promise<ICustomerDocument[]> {
    return await CustomerModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });
  }

  async count(query: any): Promise<number> {
    return await CustomerModel.countDocuments(query);
  }

  async findByIdWithServiceHistory(customerId: string): Promise<ICustomerDocument | null> {
    return await CustomerModel.findById(customerId).populate('serviceHistory');
  }

  async findTopCustomers(limit: number): Promise<ICustomerDocument[]> {
    return await this.getTopCustomers(limit);
  }

  async searchCustomers(query: string): Promise<ICustomerDocument[]> {
    return await this.search(query);
  }

  async aggregate(pipeline: any[]): Promise<any[]> {
    return await CustomerModel.aggregate(pipeline);
  }
}
