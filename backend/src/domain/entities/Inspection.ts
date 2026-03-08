export interface Inspection {
  _id: string;
  bookingId: string;
  vehicleId: string;
  customerId: string;
  mechanicId: string;
  requiredParts: Array<{
    inventoryId: string;
    partName: string;
    quantity: number;
    unitPrice: number;
    inStock: boolean;
    supplierInfo?: string;
  }>;
  requiredServices: Array<{
    serviceId?: string;
    name: string;
    description: string;
    price: number;
  }>;
  additionalNotes: string;
  estimatedCost: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  invoiceId?: string; // Reference to auto-generated invoice
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInspectionDTO {
  bookingId: string;
  vehicleId: string;
  customerId: string;
  mechanicId: string;
  requiredParts: Array<{
    inventoryId: string;
    partName: string;
    quantity: number;
    unitPrice: number;
  }>;
  requiredServices: Array<{
    serviceId?: string;
    name: string;
    description: string;
    price: number;
  }>;
  additionalNotes?: string;
}

export interface UpdateInspectionDTO {
  requiredParts?: Array<{
    inventoryId: string;
    partName: string;
    quantity: number;
    unitPrice: number;
  }>;
  requiredServices?: Array<{
    serviceId?: string;
    name: string;
    description: string;
    price: number;
  }>;
  additionalNotes?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'completed';
  rejectionReason?: string;
}
