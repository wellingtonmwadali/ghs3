import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    waiting_inspection: 'Waiting for Inspection',
    in_repair: 'In Repair',
    painting: 'Painting',
    detailing: 'Detailing',
    quality_check: 'Quality Check',
    ready_pickup: 'Ready for Pickup',
    completed: 'Completed',
  };
  return labels[stage] || stage;
}

export function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    waiting_inspection: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    in_repair: 'bg-blue-100 text-blue-800 border-blue-200',
    painting: 'bg-purple-100 text-purple-800 border-purple-200',
    detailing: 'bg-pink-100 text-pink-800 border-pink-200',
    quality_check: 'bg-orange-100 text-orange-800 border-orange-200',
    ready_pickup: 'bg-green-100 text-green-800 border-green-200',
    completed: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return colors[stage] || 'bg-gray-100 text-gray-800';
}
