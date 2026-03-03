// Domain Entity: Booking
export interface IBooking {
  _id?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  
  vehicleModel: string;
  vehiclePlate?: string;
  
  requestedServices: string[];
  serviceCategory: 'colour_repair' | 'clean_shine' | 'coat_guard';
  
  preferredDate: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  
  photos?: string[];
  description?: string;
  
  quotationAmount?: number;
  quotationSent: boolean;
  
  createdAt?: Date;
  updatedAt?: Date;
}
