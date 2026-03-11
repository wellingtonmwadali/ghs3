/**
 * Shared type definitions used across the frontend application
 * These types mirror the backend schemas to ensure consistency
 */

// ==================== Common Types ====================

export type PaymentStatus = 'pending' | 'partial' | 'paid';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type ServiceCategory = 'colour_repair' | 'clean_shine' | 'coat_guard';
export type CarStage = 
  | 'waiting_inspection' 
  | 'in_repair' 
  | 'painting' 
  | 'detailing' 
  | 'quality_check' 
  | 'ready_pickup' 
  | 'completed';
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

export interface Car {
  _id: string;
  customerId: string;
  customerName: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleYear: number;
  vehicleColor: string;
  serviceType: ServiceCategory;
  services: string[];
  customServiceDescription?: string;
  stage: CarStage;
  statusProgress: number;
  assignedMechanicId?: string;
  assignedMechanicName?: string;
  estimatedCost: number;
  actualCost?: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  checkInDate: string;
  expectedCompletionDate: string;
  completionDate?: string;
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
  inspectionNotes?: string;
  completionNotes?: string;
  notes?: string;
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
