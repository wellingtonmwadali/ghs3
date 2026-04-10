// Domain Entity: Car (Job Card)

export type CarStage =
  | 'booked_in'
  | 'waiting_inspection'
  | 'diagnosed'
  | 'awaiting_approval'
  | 'awaiting_parts'
  | 'in_repair'
  | 'painting'
  | 'detailing'
  | 'quality_check'
  | 'ready_pickup'
  | 'completed'
  | 'collected';

export type JobType = 'walk_in' | 'fleet' | 'insurance' | 'warranty';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export interface IAssignedTechnician {
  technicianId: string;
  technicianName: string;
  assignedAt: Date;
}

export interface ILaborLine {
  description: string;
  technicianId?: string;
  technicianName?: string;
  hours: number;
  rate: number;
  total: number;
}

export interface ICustomerSuppliedPart {
  name: string;
  quantity: number;
  notes?: string;
}

export interface IPauseRecord {
  pausedAt: Date;
  resumedAt?: Date;
  reason: string;
  pausedBy: string;
  pausedByName: string;
}

export interface IStatusChange {
  stage: CarStage;
  changedBy: string;
  changedByName: string;
  changedAt: Date;
  notes?: string;
}

export interface ICar {
  _id?: string;
  jobCardNumber?: string;

  // Customer
  customerId: string;
  customerName: string;
  customerGender?: 'male' | 'female' | 'other';

  // Vehicle
  vehicleMake?: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleYear: number;
  vehicleColor: string;
  vehicleMileage?: number;

  // Job classification
  serviceType: 'colour_repair' | 'clean_shine' | 'coat_guard';
  services: string[];
  jobType?: JobType;
  priority?: Priority;

  // Workflow
  stage: CarStage;
  statusProgress: number;

  // Complaint & Diagnosis
  complaint?: string;
  diagnosis?: string;

  // Inspection
  inspectedBy?: string;
  inspectorName?: string;

  // Technician assignment (legacy single + new multi)
  assignedMechanicId?: string;
  assignedMechanicName?: string;
  assignedTechnicians?: IAssignedTechnician[];
  bayNumber?: string;

  // Approval workflow
  approvalStatus?: ApprovalStatus;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: Date;
  approvalNotes?: string;

  // Invoice back-reference
  invoiceId?: string;

  // Costs
  estimatedCost: number;
  actualCost?: number;
  paidAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid';

  // Dates
  checkInDate: Date;
  expectedCompletionDate: Date;
  completionDate?: Date;
  daysInGarage: number;

  // Parts
  damageAssessment?: string;
  partsRequired?: string[];
  partsUsed?: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    unitPrice?: number;
  }>;
  customerSuppliedParts?: ICustomerSuppliedPart[];

  // Labor
  laborCost?: number;
  laborLines?: ILaborLine[];

  // Insurance
  insuranceClaim?: {
    hasInsurance: boolean;
    claimNumber?: string;
    insurer?: string;
    status?: string;
  };

  // Photos
  beforePhotos: string[];
  afterPhotos: string[];

  // Notes
  notes?: string;
  inspectionNotes?: string;
  completionNotes?: string;
  customServiceDescription?: string;
  customServiceAmount?: number;

  // Pause / Resume
  isPaused?: boolean;
  pauseReason?: string;
  pauseHistory?: IPauseRecord[];

  // Status audit trail
  statusHistory?: IStatusChange[];
  comebackWarning?: boolean;

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
  jobType?: string;
  priority?: string;
  isPaused?: boolean;
  bayNumber?: string;
  search?: string;
}
