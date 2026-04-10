'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/shared/EmptyState';
import { ClipboardList } from 'lucide-react';
import { JobCardRow } from './JobCardRow';
import type { Car } from '@/types';

interface JobCardTableProps {
  cars: Car[];
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
}

export function JobCardTable({ cars, onView, onDelete, onAddNew }: JobCardTableProps) {
  if (cars.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon={ClipboardList}
            title="No job cards found"
            description="No vehicles match the current filter. Try adjusting your search or create a new job card."
            action={{ label: 'New Job Card', onClick: onAddNew }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">Job / Vehicle</TableHead>
                <TableHead className="min-w-[120px]">Customer</TableHead>
                <TableHead className="min-w-[120px]">Stage</TableHead>
                <TableHead className="min-w-[90px]">Type</TableHead>
                <TableHead className="min-w-[120px]">Technician</TableHead>
                <TableHead className="w-[60px] text-center">Bay</TableHead>
                <TableHead className="min-w-[90px]">Cost</TableHead>
                <TableHead className="min-w-[80px]">Payment</TableHead>
                <TableHead className="w-[80px]">Progress</TableHead>
                <TableHead className="w-[80px]">Days</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.map((car) => (
                <JobCardRow key={car._id} car={car} onView={onView} onDelete={onDelete} />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
