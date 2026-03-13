// Enhanced error handling with detailed error codes and user-friendly messages

export enum ErrorCode {
  // Authentication errors (1xxx)
  INVALID_CREDENTIALS = 1001,
  TOKEN_EXPIRED = 1002,
  UNAUTHORIZED = 1003,
  FORBIDDEN = 1004,
  
  // Validation errors (2xxx)
  VALIDATION_ERROR = 2001,
  MISSING_REQUIRED_FIELD = 2002,
  INVALID_FORMAT = 2003,
  DUPLICATE_ENTRY = 2004,
  
  // Business logic errors (3xxx)
  DUPLICATE_VEHICLE_PLATE = 3001,
  INSUFFICIENT_STOCK = 3002,
  INVALID_PAYMENT_AMOUNT = 3003,
  CAR_NOT_READY = 3004,
  MECHANIC_UNAVAILABLE = 3005,
  INVOICE_ALREADY_PAID = 3006,
  
  // Resource errors (4xxx)
  NOT_FOUND = 4001,
  ALREADY_EXISTS = 4002,
  CONFLICT = 4003,
  
  // System errors (5xxx)
  DATABASE_ERROR = 5001,
  EXTERNAL_SERVICE_ERROR = 5002,
  FILE_UPLOAD_ERROR = 5003,
  EMAIL_SEND_ERROR = 5004,
}

export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
    timestamp: Date;
    path?: string;
  };
}

export class EnhancedError extends Error {
  code: ErrorCode;
  httpStatus: number;
  details?: any;
  isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCode,
    httpStatus: number = 400,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
    this.isOperational = isOperational;
    
    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ErrorHandler {
  static formatError(error: any, path?: string): ErrorResponse {
    if (error instanceof EnhancedError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          timestamp: new Date(),
          path
        }
      };
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return {
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Validation failed',
          details: Object.values(error.errors).map((e: any) => ({
            field: e.path,
            message: e.message
          })),
          timestamp: new Date(),
          path
        }
      };
    }

    // Handle Mongoose duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return {
        success: false,
        error: {
          code: ErrorCode.DUPLICATE_ENTRY,
          message: `A record with this ${field} already exists`,
          details: { field },
          timestamp: new Date(),
          path
        }
      };
    }

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
      return {
        success: false,
        error: {
          code: ErrorCode.INVALID_CREDENTIALS,
          message: 'Invalid authentication token',
          timestamp: new Date(),
          path
        }
      };
    }

    if (error.name === 'TokenExpiredError') {
      return {
        success: false,
        error: {
          code: ErrorCode.TOKEN_EXPIRED,
          message: 'Authentication token has expired',
          timestamp: new Date(),
          path
        }
      };
    }

    // Generic error
    return {
      success: false,
      error: {
        code: ErrorCode.DATABASE_ERROR,
        message: error.message || 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date(),
        path
      }
    };
  }

  static logError(error: any, context?: string): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${context}]` : '';
    
    if (error instanceof EnhancedError) {
      console.error(`[${timestamp}]${contextStr} EnhancedError (${error.code}):`, error.message);
      if (error.details) {
        console.error('Details:', JSON.stringify(error.details, null, 2));
      }
    } else {
      console.error(`[${timestamp}]${contextStr} Error:`, error.message);
      if (process.env.NODE_ENV === 'development') {
        console.error(error.stack);
      }
    }
  }
}

// Pre-configured error factories
export class ErrorFactory {
  static duplicateVehiclePlate(plate: string, stage: string): EnhancedError {
    return new EnhancedError(
      `Vehicle with plate number ${plate} is already in service at stage: ${stage}`,
      ErrorCode.DUPLICATE_VEHICLE_PLATE,
      409,
      { plate, stage }
    );
  }

  static insufficientStock(itemName: string, available: number, required: number): EnhancedError {
    return new EnhancedError(
      `Insufficient stock for ${itemName}. Available: ${available}, Required: ${required}`,
      ErrorCode.INSUFFICIENT_STOCK,
      400,
      { itemName, available, required }
    );
  }

  static invalidPaymentAmount(amount: number, balance: number): EnhancedError {
    return new EnhancedError(
      `Invalid payment amount. Amount: ${amount}, Balance: ${balance}`,
      ErrorCode.INVALID_PAYMENT_AMOUNT,
      400,
      { amount, balance }
    );
  }

  static mechanicUnavailable(mechanicName: string, availability: string): EnhancedError {
    return new EnhancedError(
      `Mechanic ${mechanicName} is currently ${availability} and cannot be assigned`,
      ErrorCode.MECHANIC_UNAVAILABLE,
      400,
      { mechanicName, availability }
    );
  }

  static notFound(resource: string, id?: string): EnhancedError {
    const message = id 
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;
    return new EnhancedError(message, ErrorCode.NOT_FOUND, 404, { resource, id });
  }

  static unauthorized(message: string = 'Unauthorized access'): EnhancedError {
    return new EnhancedError(message, ErrorCode.UNAUTHORIZED, 401);
  }

  static forbidden(message: string = 'Access forbidden'): EnhancedError {
    return new EnhancedError(message, ErrorCode.FORBIDDEN, 403);
  }

  static validationError(message: string, fields?: any): EnhancedError {
    return new EnhancedError(
      message,
      ErrorCode.VALIDATION_ERROR,
      400,
      fields
    );
  }
}
