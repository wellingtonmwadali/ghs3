import React from 'react';
import { cn } from '@/lib/utils';

type StatusVariant = 
  | 'pending' 
  | 'confirmed' 
  | 'completed' 
  | 'cancelled' 
  | 'paid' 
  | 'partial' 
  | 'unpaid'
  | 'active'
  | 'inactive'
  | 'available'
  | 'busy'
  | 'off'
  | 'low'
  | 'medium'
  | 'high'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

const statusColors: Record<StatusVariant, string> = {
  // Booking/Order statuses
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  
  // Payment statuses
  paid: 'bg-green-100 text-green-800 border-green-200',
  partial: 'bg-orange-100 text-orange-800 border-orange-200',
  unpaid: 'bg-red-100 text-red-800 border-red-200',
  
  // Activity statuses
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  
  // Availability statuses
  available: 'bg-green-100 text-green-800 border-green-200',
  busy: 'bg-orange-100 text-orange-800 border-orange-200',
  off: 'bg-gray-100 text-gray-800 border-gray-200',
  
  // Priority levels
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-red-100 text-red-800 border-red-200',
  
  // Generic statuses
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
};

/**
 * StatusBadge component for displaying colored status indicators
 * 
 * @example
 * ```tsx
 * <StatusBadge status="pending" variant="pending" />
 * <StatusBadge status="Paid" variant="paid" />
 * ```
 */
export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  // Auto-detect variant from status if not provided
  const detectedVariant = variant || (status.toLowerCase() as StatusVariant);
  const colorClass = statusColors[detectedVariant] || statusColors.info;
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize',
        colorClass,
        className
      )}
    >
      {status}
    </span>
  );
}

/**
 * Payment status badge with icon
 */
export function PaymentStatusBadge({ status }: { status: string }) {
  const variants: Record<string, StatusVariant> = {
    paid: 'paid',
    partial: 'partial',
    pending: 'unpaid',
  };
  
  return <StatusBadge status={status} variant={variants[status.toLowerCase()] || 'pending'} />;
}

/**
 * Booking status badge
 */
export function BookingStatusBadge({ status }: { status: string }) {
  const variants: Record<string, StatusVariant> = {
    pending: 'pending',
    confirmed: 'confirmed',
    completed: 'completed',
    cancelled: 'cancelled',
  };
  
  return <StatusBadge status={status} variant={variants[status.toLowerCase()] || 'pending'} />;
}

/**
 * Availability status badge for mechanics
 */
export function AvailabilityBadge({ availability }: { availability: string }) {
  const variants: Record<string, StatusVariant> = {
    available: 'available',
    busy: 'busy',
    off: 'off',
  };
  
  return <StatusBadge status={availability} variant={variants[availability.toLowerCase()] || 'inactive'} />;
}
