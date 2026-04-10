/**
 * Shared type definitions used across the frontend application
 * These types mirror the backend schemas to ensure consistency
 */

// ==================== Auth Types ====================

export type UserRole = 'owner' | 'manager' | 'mechanic' | 'receptionist';

export interface AuthUser {
  id: string;
  uuid: string;
  userId: string;
  email: string;
  full_name: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar_url: string;
  role: {
    id: string;
    name: string;
    slug: UserRole;
    permissions: string[];
  };
  branch: string;
  department: string;
  is_active: boolean;
  is_verified: boolean;
  mfa_enabled: boolean;
  last_login: string | null;
  login_count: number;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
}

export interface SessionInfo {
  session_id: string;
  issued_at: string;
  expires_at: string;
  ip_address?: string;
  device?: string;
}

export interface LoginResponse {
  token: TokenPair;
  user: AuthUser;
  session: SessionInfo;
}

// ==================== Common Types ====================

export type PaymentStatus = 'pending' | 'partial' | 'paid';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type ServiceCategory = 'colour_repair' | 'clean_shine' | 'coat_guard';
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

export type MechanicAvailability = 'available' | 'busy' | 'off';
export type Gender = 'male' | 'female' | 'other';
export type InventoryCategory = 'paint' | 'chemical' | 'film' | 'tool' | 'other';

// ==================== Entity Interfaces ====================

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  gender?: Gender;
  notes?: string;
  serviceHistory?: {
    date: Date;
    carId: string;
    serviceDetails: string;
    cost: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface Mechanic {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: 'painter' | 'detailer' | 'installer' | 'technician' | 'all';
  skills: string[];
  availability: MechanicAvailability;
  performance: {
    totalJobsCompleted: number;
    averageTurnaroundTime: number;
    efficiencyScore: number;
    customerRating: number;
  };
  laborHoursLogged: number;
  salary?: number;
  hireDate: string;
  birthday?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Booking {
  _id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleModel: string;
  vehiclePlate?: string;
  requestedServices: string[];
  serviceCategory: ServiceCategory;
  preferredDate: string;
  status: BookingStatus;
  photos?: string[];
  description?: string;
  quotationAmount?: number;
  quotationSent: boolean;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryItem {
  _id: string;
  itemName: string;
  category: InventoryCategory;
  sku?: string;
  brand?: string;
  quantity: number;
  unit: string;
  minStockLevel: number;
  costPerUnit: number;
  supplier?: {
    name: string;
    contact: string;
    email?: string;
  };
  lastRestocked?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerId: 
    | string 
    | {
        _id: string;
        name: string;
        email: string;
        phone: string;
      };
  carId: 
    | string 
    | {
        _id: string;
        vehicleModel: string;
        vehiclePlate: string;
      };
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  discount?: number;
  total: number;
  paidAmount: number;
  balance: number;
  paymentStatus: PaymentStatus;
  payments: {
    amount: number;
    method: string;
    transactionRef?: string;
    paidAt: Date;
  }[];
  dueDate?: string;
  issuedDate: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssignedTechnician {
  technicianId: string;
  technicianName: string;
  assignedAt: string;
}

export interface LaborLine {
  description: string;
  technicianId?: string;
  technicianName?: string;
  hours: number;
  rate: number;
  total: number;
}

export interface CustomerSuppliedPart {
  name: string;
  quantity: number;
  notes?: string;
}

export interface PauseRecord {
  pausedAt: string;
  resumedAt?: string;
  reason: string;
  pausedBy: string;
  pausedByName: string;
}

export interface StatusChange {
  stage: CarStage;
  changedBy: string;
  changedByName: string;
  changedAt: string;
  notes?: string;
}

export interface Car {
  _id: string;
  jobCardNumber?: string;

  // Customer
  customerId: string;
  customerName: string;
  customerGender?: Gender;

  // Vehicle
  vehicleMake?: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleYear: number;
  vehicleColor: string;
  vehicleMileage?: number;

  // Job classification
  serviceType: ServiceCategory;
  services: string[];
  customServiceDescription?: string;
  customServiceAmount?: number;
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

  // Technician assignment
  assignedMechanicId?: string;
  assignedMechanicName?: string;
  assignedTechnicians?: AssignedTechnician[];
  bayNumber?: string;

  // Approval
  approvalStatus?: ApprovalStatus;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  approvalNotes?: string;

  // Costs
  estimatedCost: number;
  actualCost?: number;
  invoiceId?: string;
  paidAmount: number;
  paymentStatus: PaymentStatus;

  // Dates
  checkInDate: string;
  expectedCompletionDate: string;
  completionDate?: string;
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
  customerSuppliedParts?: CustomerSuppliedPart[];

  // Labor
  laborCost?: number;
  laborLines?: LaborLine[];

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
  inspectionNotes?: string;
  completionNotes?: string;
  notes?: string;

  // Pause / Resume
  isPaused?: boolean;
  pauseReason?: string;
  pauseHistory?: PauseRecord[];

  // Status audit trail
  statusHistory?: StatusChange[];
  comebackWarning?: boolean;

  // Audit
  createdBy?: string;
  createdByName?: string;
  lastModifiedBy?: string;
  lastModifiedByName?: string;
  lastModifiedAt?: string;

  warranty?: {
    hasWarranty: boolean;
    expiryDate?: string;
    warrantyType?: string;
  };

  createdAt?: string;
  updatedAt?: string;
}

// ==================== API Response Types ====================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ==================== Filter/Search Types ====================

export interface CarFilters {
  stage?: CarStage;
  serviceType?: ServiceCategory;
  assignedMechanicId?: string;
  paymentStatus?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
  jobType?: JobType;
  priority?: Priority;
  isPaused?: boolean;
  bayNumber?: string;
  search?: string;
}

export interface CustomerFilters {
  search?: string;
  gender?: Gender;
  minVisits?: number;
  maxVisits?: number;
}

// ==================== Dashboard Stats ====================

export interface DashboardStats {
  totalCarsInGarage: number;
  carsCompletedToday: number;
  carsWaitingPickup: number;
  carsInProgress: number;
  activeMechanics: number;
  workloadDistribution: any[];
}

export interface RevenueStats {
  totalRevenue: number;
  paidInvoices: number;
  unpaidInvoices: number;
  partialInvoices: number;
  totalInvoicesThisMonth: number;
  revenueThisMonth: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueTrend: number;
  averageInvoiceValue: number;
  topPayingClients: Array<{
    customerId: string;
    customerName: string;
    totalPaid: number;
    invoiceCount: number;
  }>;
  paymentMethodDistribution: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    invoiceCount: number;
  }>;
}
