// Domain Entity: Car
export interface ICar {
  _id?: string;
  customerId: string;
  customerName: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleYear: number;
  vehicleColor: string;
  
  serviceType: 'colour_repair' | 'clean_shine' | 'coat_guard';
  services: string[];
  
  stage: 'waiting_inspection' | 'in_repair' | 'painting' | 'detailing' | 'quality_check' | 'ready_pickup' | 'completed';
  statusProgress: number;
  
  assignedMechanicId?: string;
  assignedMechanicName?: string;
  
  estimatedCost: number;
  actualCost?: number;
  paidAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  
  checkInDate: Date;
  expectedCompletionDate: Date;
  completionDate?: Date;
  daysInGarage: number;
  
  damageAssessment?: string;
  partsRequired?: string[];
  insuranceClaim?: {
    hasInsurance: boolean;
    claimNumber?: string;
    insurer?: string;
    status?: string;
  };
  
  beforePhotos: string[];
  afterPhotos: string[];
  
  notes?: string;
  warranty?: {
    hasWarranty: boolean;
    expiryDate?: Date;
    warrantyType?: string;
  };
  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICarFilters {
  stage?: string;
  serviceType?: string;
  assignedMechanicId?: string;
  paymentStatus?: string;
  startDate?: Date;
  endDate?: Date;
}
