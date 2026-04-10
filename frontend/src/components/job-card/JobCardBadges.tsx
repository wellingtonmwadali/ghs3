'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  STAGE_LABELS, STAGE_COLORS,
  JOB_TYPE_LABELS, JOB_TYPE_COLORS,
  PRIORITY_LABELS, PRIORITY_COLORS,
  APPROVAL_LABELS, APPROVAL_COLORS,
  SERVICE_TYPE_LABELS,
} from '@/lib/job-card-utils';
import type { CarStage, JobType, Priority, ApprovalStatus, PaymentStatus } from '@/types';

export function StageBadge({ stage, className }: { stage: CarStage; className?: string }) {
  return (
    <Badge variant="outline" className={cn('text-xs font-medium border', STAGE_COLORS[stage], className)}>
      {STAGE_LABELS[stage]}
    </Badge>
  );
}

export function JobTypeBadge({ jobType, className }: { jobType: JobType; className?: string }) {
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', JOB_TYPE_COLORS[jobType], className)}>
      {JOB_TYPE_LABELS[jobType]}
    </Badge>
  );
}

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', PRIORITY_COLORS[priority], className)}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

export function ApprovalBadge({ status, className }: { status: ApprovalStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', APPROVAL_COLORS[status], className)}>
      {APPROVAL_LABELS[status]}
    </Badge>
  );
}

export function PaymentBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  const colors: Record<PaymentStatus, string> = {
    paid: 'bg-green-100 text-green-700 border-green-300',
    partial: 'bg-amber-100 text-amber-700 border-amber-300',
    pending: 'bg-red-100 text-red-700 border-red-300',
  };
  const labels: Record<PaymentStatus, string> = {
    paid: 'Paid',
    partial: 'Partial',
    pending: 'Pending',
  };
  return (
    <Badge variant="outline" className={cn('text-xs font-medium border', colors[status], className)}>
      {labels[status]}
    </Badge>
  );
}

export function ServiceTypeBadge({ serviceType, className }: { serviceType: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn('text-xs', className)}>
      {SERVICE_TYPE_LABELS[serviceType] || serviceType}
    </Badge>
  );
}

export function PausedBadge({ className }: { className?: string }) {
  return (
    <Badge variant="outline" className={cn('text-xs font-medium bg-orange-100 text-orange-700 border-orange-300 animate-pulse', className)}>
      ⏸ Paused
    </Badge>
  );
}

export function ComebackBadge({ className }: { className?: string }) {
  return (
    <Badge variant="outline" className={cn('text-xs font-medium bg-red-100 text-red-700 border-red-300', className)}>
      ⚠ Comeback
    </Badge>
  );
}
