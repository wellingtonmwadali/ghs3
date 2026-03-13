import Joi from 'joi';

export const createCarSchema = Joi.object({
  customerId: Joi.string().required(),
  customerName: Joi.string().required(),
  vehicleModel: Joi.string().required(),
  vehiclePlate: Joi.string().required(),
  vehicleYear: Joi.number().integer().min(1900).max(2030).required(),
  vehicleColor: Joi.string().required(),
  
  serviceType: Joi.string().valid('colour_repair', 'clean_shine', 'coat_guard').required(),
  services: Joi.array().items(Joi.string()).required(),
  
  stage: Joi.string().valid('waiting_inspection', 'in_repair', 'painting', 'detailing', 'quality_check', 'ready_pickup', 'completed').optional(),
  
  assignedMechanicId: Joi.string().optional(),
  assignedMechanicName: Joi.string().optional(),
  
  estimatedCost: Joi.number().min(0).required(),
  expectedCompletionDate: Joi.date().required(),
  
  damageAssessment: Joi.string().optional(),
  partsRequired: Joi.array().items(Joi.string()).optional(),
  insuranceClaim: Joi.object({
    hasInsurance: Joi.boolean(),
    claimNumber: Joi.string().optional(),
    insurer: Joi.string().optional(),
    status: Joi.string().optional()
  }).optional(),
  
  beforePhotos: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().optional()
});

export const updateCarSchema = Joi.object({
  stage: Joi.string().valid('waiting_inspection', 'in_repair', 'painting', 'detailing', 'quality_check', 'ready_pickup', 'completed').optional(),
  statusProgress: Joi.number().min(0).max(100).optional(),
  
  assignedMechanicId: Joi.string().optional(),
  assignedMechanicName: Joi.string().optional(),
  
  actualCost: Joi.number().min(0).optional(),
  paidAmount: Joi.number().min(0).optional(),
  paymentStatus: Joi.string().valid('pending', 'partial', 'paid').optional(),
  
  afterPhotos: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().optional(),
  
  warranty: Joi.object({
    hasWarranty: Joi.boolean(),
    expiryDate: Joi.date().optional(),
    warrantyType: Joi.string().optional()
  }).optional()
}).min(1);

export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(8).required()
});

export const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character'
    }),
  role: Joi.string().valid('owner', 'manager', 'mechanic', 'receptionist').required(),
  mechanicId: Joi.string().optional()
});

export const clockInSchema = Joi.object({
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  }).required(),
  notes: Joi.string().max(500).optional()
});

export const clockOutSchema = Joi.object({
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  }).required(),
  notes: Joi.string().max(500).optional()
});

export const createCustomerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  address: Joi.string().optional().allow('', null),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  notes: Joi.string().optional().allow('', null),
  serviceHistory: Joi.array().items(Joi.object({
    date: Joi.date().required(),
    carId: Joi.string().required(),
    serviceDetails: Joi.string().required(),
    cost: Joi.number().required()
  })).optional()
});

export const createInvoiceSchema = Joi.object({
  carId: Joi.string().required(),
  customerId: Joi.string().required(),
  
  items: Joi.array().items(Joi.object({
    description: Joi.string().required(),
    quantity: Joi.number().required(),
    unitPrice: Joi.number().required(),
    total: Joi.number().required()
  })).required(),
  
  subtotal: Joi.number().required(),
  tax: Joi.number().required(),
  taxRate: Joi.number().optional(),
  discount: Joi.number().optional(),
  total: Joi.number().required(),
  
  paidAmount: Joi.number().optional(),
  dueDate: Joi.date().required(),
  notes: Joi.string().optional()
});

export const addPaymentSchema = Joi.object({
  amount: Joi.number().min(0).required(),
  method: Joi.string().valid('cash', 'card', 'transfer', 'mpesa', 'insurance').required(),
  reference: Joi.string().optional(),
  paymentPID: Joi.string().optional()
});

export const createBookingSchema = Joi.object({
  customerName: Joi.string().required(),
  customerEmail: Joi.string().email().required(),
  customerPhone: Joi.string().required(),
  
  vehicleModel: Joi.string().required(),
  vehiclePlate: Joi.string().optional(),
  
  requestedServices: Joi.array().items(Joi.string()).required(),
  serviceCategory: Joi.string().valid('colour_repair', 'clean_shine', 'coat_guard').required(),
  
  preferredDate: Joi.date().required(),
  photos: Joi.array().items(Joi.string()).optional(),
  description: Joi.string().optional()
});

// Expense validation schemas
export const createExpenseSchema = Joi.object({
  category: Joi.string().valid('parts', 'labor', 'utilities', 'rent', 'equipment', 'marketing', 'other').required(),
  description: Joi.string().required(),
  amount: Joi.number().min(0).required(),
  date: Joi.date().required(),
  paymentMethod: Joi.string().valid('cash', 'card', 'transfer', 'cheque').required(),
  vendor: Joi.string().optional(),
  receiptNumber: Joi.string().optional(),
  relatedCarId: Joi.string().optional(),
  notes: Joi.string().optional()
});

export const updateExpenseSchema = Joi.object({
  category: Joi.string().valid('parts', 'labor', 'utilities', 'rent', 'equipment', 'marketing', 'other').optional(),
  description: Joi.string().optional(),
  amount: Joi.number().min(0).optional(),
  date: Joi.date().optional(),
  paymentMethod: Joi.string().valid('cash', 'card', 'transfer', 'cheque').optional(),
  vendor: Joi.string().optional(),
  receiptNumber: Joi.string().optional(),
  notes: Joi.string().optional()
}).min(1);

// Receipt validation schema
export const generateReceiptSchema = Joi.object({
  customerName: Joi.string().required(),
  customerEmail: Joi.string().email().required(),
  customerPhone: Joi.string().required(),
  amount: Joi.number().min(0).required(),
  paymentMethod: Joi.string().valid('cash', 'card', 'mpesa', 'bank_transfer', 'insurance').required(),
  paymentDate: Joi.date().optional(),
  vehiclePlate: Joi.string().required(),
  vehicleModel: Joi.string().required(),
  serviceType: Joi.string().valid('colour_repair', 'clean_shine', 'coat_guard').required(),
  invoiceNumber: Joi.string().required(),
  carId: Joi.string().optional()
});
