// Domain Entity: Service
export interface IService {
  _id?: string;
  name: string;
  category: 'colour_repair' | 'clean_shine' | 'coat_guard';
  
  description: string;
  
  basePrice: number;
  estimatedDuration: number; // in hours
  
  requiresAssessment: boolean;
  
  packages?: {
    name: string; // Basic, Premium, Ultimate
    price: number;
    features: string[];
  }[];
  
  isActive: boolean;
  
  createdAt?: Date;
  updatedAt?: Date;
}
