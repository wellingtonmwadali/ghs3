'use client';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, UserPlus } from 'lucide-react';
import type { Mechanic } from '@/types';
import type { AssignedTechnician } from '@/types';

interface TechnicianSectionProps {
  mechanics: Mechanic[];
  assignedMechanicId: string;
  assignedMechanicName: string;
  assignedTechnicians: AssignedTechnician[];
  onFieldChange: (field: string, value: any) => void;
}

export function TechnicianSection({
  mechanics,
  assignedMechanicId,
  assignedMechanicName,
  assignedTechnicians,
  onFieldChange,
}: TechnicianSectionProps) {
  const availableMechanics = mechanics.filter(
    (m) => !assignedTechnicians.some((t) => t.technicianId === m._id)
  );

  const handlePrimaryMechanicChange = (mechanicId: string) => {
    const mech = mechanics.find((m) => m._id === mechanicId);
    if (mech) {
      onFieldChange('assignedMechanicId', mech._id);
      onFieldChange(
        'assignedMechanicName',
        `${mech.firstName} ${mech.lastName}`
      );
    }
  };

  const addTechnician = (mechanicId: string) => {
    const mech = mechanics.find((m) => m._id === mechanicId);
    if (!mech) return;
    const updated: AssignedTechnician[] = [
      ...assignedTechnicians,
      {
        technicianId: mech._id,
        technicianName: `${mech.firstName} ${mech.lastName}`,
        assignedAt: new Date().toISOString(),
      },
    ];
    onFieldChange('assignedTechnicians', updated);
  };

  const removeTechnician = (techId: string) => {
    const updated = assignedTechnicians.filter(
      (t) => t.technicianId !== techId
    );
    onFieldChange('assignedTechnicians', updated);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
        Technician Assignment
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Primary Mechanic (legacy compat) */}
        <div>
          <Label htmlFor="assignedMechanicId">Lead Mechanic</Label>
          <Select
            value={assignedMechanicId}
            onValueChange={handlePrimaryMechanicChange}
          >
            <SelectTrigger id="assignedMechanicId">
              <SelectValue placeholder="Select lead mechanic" />
            </SelectTrigger>
            <SelectContent>
              {mechanics.map((m) => (
                <SelectItem key={m._id} value={m._id}>
                  {m.firstName} {m.lastName}{' '}
                  <span className="text-muted-foreground">
                    — {m.specialization}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Add Technician */}
        <div>
          <Label>Add Technician</Label>
          <Select onValueChange={addTechnician} value="">
            <SelectTrigger>
              <SelectValue placeholder="Add another technician..." />
            </SelectTrigger>
            <SelectContent>
              {availableMechanics.map((m) => (
                <SelectItem key={m._id} value={m._id}>
                  {m.firstName} {m.lastName} — {m.specialization}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Assigned Technician chips */}
      {assignedTechnicians.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {assignedTechnicians.map((t) => (
            <span
              key={t.technicianId}
              className="inline-flex items-center gap-1.5 rounded-full border bg-primary/5 px-3 py-1 text-sm"
            >
              <UserPlus className="h-3.5 w-3.5 text-primary" />
              {t.technicianName}
              <button
                type="button"
                onClick={() => removeTechnician(t.technicianId)}
                className="ml-1 rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
