'use client';

import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye, Trash2 } from 'lucide-react';
import { StageBadge, PriorityBadge, PaymentBadge, PausedBadge, ComebackBadge, JobTypeBadge } from './JobCardBadges';
import { formatCurrency, formatDate } from '@/lib/job-card-utils';
import type { Car } from '@/types';

interface JobCardRowProps {
  car: Car;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

export function JobCardRow({ car, onView, onDelete }: JobCardRowProps) {
  return (
    <TableRow className="cursor-pointer group" onClick={() => onView(car._id)}>
      {/* Job Card # + Vehicle */}
      <TableCell>
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted-foreground">{car.jobCardNumber || '—'}</p>
          <p className="font-medium text-sm truncate">{car.vehicleModel}</p>
          <p className="text-xs text-muted-foreground font-mono">{car.vehiclePlate}</p>
        </div>
      </TableCell>

      {/* Customer */}
      <TableCell>
        <p className="text-sm font-medium truncate max-w-[140px]">{car.customerName}</p>
      </TableCell>

      {/* Stage + Flags */}
      <TableCell>
        <div className="flex flex-col gap-1">
          <StageBadge stage={car.stage} />
          <div className="flex gap-1 flex-wrap">
            {car.isPaused && <PausedBadge />}
            {car.comebackWarning && <ComebackBadge />}
          </div>
        </div>
      </TableCell>

      {/* Priority + Job Type */}
      <TableCell>
        <div className="flex flex-col gap-1">
          {car.priority && car.priority !== 'normal' && (
            <PriorityBadge priority={car.priority} />
          )}
          {car.jobType && <JobTypeBadge jobType={car.jobType} />}
        </div>
      </TableCell>

      {/* Technician */}
      <TableCell className="text-sm">
        {car.assignedTechnicians && car.assignedTechnicians.length > 0
          ? car.assignedTechnicians.map(t => t.technicianName).join(', ')
          : car.assignedMechanicName || <span className="text-muted-foreground">Unassigned</span>
        }
      </TableCell>

      {/* Bay */}
      <TableCell className="text-sm text-center">
        {car.bayNumber || '—'}
      </TableCell>

      {/* Cost */}
      <TableCell className="text-sm font-medium">
        {formatCurrency(car.actualCost || car.estimatedCost)}
      </TableCell>

      {/* Payment */}
      <TableCell>
        <PaymentBadge status={car.paymentStatus} />
      </TableCell>

      {/* Progress */}
      <TableCell>
        <div className="w-16">
          <Progress value={car.statusProgress} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground text-center mt-0.5">{car.statusProgress}%</p>
        </div>
      </TableCell>

      {/* Days + Date */}
      <TableCell>
        <p className="text-sm">{car.daysInGarage}d</p>
        <p className="text-[10px] text-muted-foreground">{formatDate(car.checkInDate)}</p>
      </TableCell>

      {/* Actions */}
      <TableCell onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(car._id)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(car._id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
