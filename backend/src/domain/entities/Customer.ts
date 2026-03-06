// Domain Entity: Customer
export interface ICustomer {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  gender?: 'male' | 'female' | 'other';
  notes?: string;
  
  serviceHistory?: {
    date: Date;
    carId: string;
    serviceDetails: string;
    cost: number;
  }[];
  
  createdAt?: Date;
  updatedAt?: Date;
}
