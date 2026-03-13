// Domain Entity: Car
export interface ICar {
  _id?: string;
  customerId: string;
  customerName: string;
  customerGender?: 'male' | 'female' | 'other';
  vehicleModel: string;
  vehiclePlate: string;
  vehicleYear: number;
  vehicleColor: string;
  
  serviceType: 'colour_repair' | 'clean_shine' | 'coat_guard';
  services: string[];
  
  stage: 'waiting_inspection' | 'in_repair' | 'painting' | 'detailing' | 'quality_check' | 'ready_pickup' | 'completed';
  statusProgress: number;
  
  inspectedBy?: string; // User ID who performed the inspection
  inspectorName?: string; // Name of inspector
  
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
  partsUsed?: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    unitPrice?: number;
  }>;
  laborCost?: number;
  insuranceClaim?: {
    hasInsurance: boolean;
    claimNumber?: string;
    insurer?: string;
    status?: string;
  };
  
  beforePhotos: string[];
  afterPhotos: string[];
  
  notes?: string;
  inspectionNotes?: string;
  completionNotes?: string;
  customServiceDescription?: string;
  customServiceAmount?: number;
  
  // Audit trail
  createdBy?: string;
  createdByName?: string;
  lastModifiedBy?: string;
  lastModifiedByName?: string;
  lastModifiedAt?: Date;
  
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
