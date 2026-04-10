'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SERVICE_TYPE_LABELS } from '@/lib/job-card-utils';
import { Check, X, Plus } from 'lucide-react';
import type { ServiceCategory } from '@/types';

interface ServiceType {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
}

interface ServiceSectionProps {
  serviceType: ServiceCategory;
  services: string[];
  customServiceDescription: string;
  customServiceAmount: string;
  availableServiceTypes: ServiceType[];
  onFieldChange: (field: string, value: any) => void;
}

export function ServiceSection({
  serviceType,
  services,
  customServiceDescription,
  customServiceAmount,
  availableServiceTypes,
  onFieldChange,
}: ServiceSectionProps) {
  const [showCustom, setShowCustom] = useState(false);

  // Filter available services matching selected service category
  const categoryServices = availableServiceTypes.filter((st) => {
    // Match by category substring or return all if none match
    const cat = serviceType.replace('_', ' ');
    return st.name.toLowerCase().includes(cat.split('_').join(' ')) || true;
  });

  const toggleService = (name: string) => {
    const updated = services.includes(name)
      ? services.filter((s) => s !== name)
      : [...services, name];
    onFieldChange('services', updated);
  };

  const computedEstimate = () => {
    let total = 0;
    for (const sName of services) {
      const st = availableServiceTypes.find((s) => s.name === sName);
      if (st) total += st.basePrice;
    }
    if (customServiceAmount) total += Number(customServiceAmount) || 0;
    return total;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
        Service Information
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="serviceType">Service Category *</Label>
          <Select
            value={serviceType}
            onValueChange={(v) => {
              onFieldChange('serviceType', v);
              onFieldChange('services', []);
            }}
          >
            <SelectTrigger id="serviceType">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Estimated Cost (KES)</Label>
          <div className="mt-1 rounded-md bg-muted/50 px-4 py-2 text-lg font-semibold tabular-nums">
            {computedEstimate().toLocaleString('en-KE')}
          </div>
        </div>
      </div>

      {/* Service Buttons */}
      <div>
        <Label>Select Services *</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {availableServiceTypes.map((st) => {
            const selected = services.includes(st.name);
            return (
              <button
                key={st.id || st.name}
                type="button"
                onClick={() => toggleService(st.name)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:bg-accent'
                }`}
              >
                {selected && <Check className="h-3.5 w-3.5" />}
                {st.name}
                <span className="text-xs opacity-70">
                  KES {st.basePrice.toLocaleString()}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowCustom(!showCustom)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              showCustom
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-dashed border-border text-muted-foreground hover:bg-accent'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            Other
          </button>
        </div>
      </div>

      {/* Custom Service */}
      {showCustom && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-md border bg-muted/20 p-4">
          <div className="sm:col-span-2">
            <Label htmlFor="customServiceDescription">Custom Service Description</Label>
            <Textarea
              id="customServiceDescription"
              value={customServiceDescription}
              onChange={(e) =>
                onFieldChange('customServiceDescription', e.target.value)
              }
              placeholder="Describe the custom service..."
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="customServiceAmount">Custom Service Amount (KES)</Label>
            <Input
              id="customServiceAmount"
              type="number"
              min="0"
              value={customServiceAmount}
              onChange={(e) =>
                onFieldChange('customServiceAmount', e.target.value)
              }
              placeholder="0"
            />
          </div>
        </div>
      )}
    </div>
  );
}
