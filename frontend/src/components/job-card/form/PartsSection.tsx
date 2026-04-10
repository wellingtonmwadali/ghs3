'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import type { CustomerSuppliedPart } from '@/types';

interface PartsSectionProps {
  parts: CustomerSuppliedPart[];
  partsRequired: string[];
  onFieldChange: (field: string, value: any) => void;
}

export function PartsSection({
  parts,
  partsRequired,
  onFieldChange,
}: PartsSectionProps) {
  const [newPart, setNewPart] = useState('');

  // Customer-supplied parts
  const addCustomerPart = () => {
    onFieldChange('customerSuppliedParts', [
      ...parts,
      { name: '', quantity: 1, notes: '' },
    ]);
  };

  const updateCustomerPart = (
    idx: number,
    key: keyof CustomerSuppliedPart,
    value: any
  ) => {
    const updated = parts.map((p, i) =>
      i === idx ? { ...p, [key]: value } : p
    );
    onFieldChange('customerSuppliedParts', updated);
  };

  const removeCustomerPart = (idx: number) => {
    onFieldChange(
      'customerSuppliedParts',
      parts.filter((_, i) => i !== idx)
    );
  };

  // Parts required (string tags)
  const addPartsRequired = () => {
    const trimmed = newPart.trim();
    if (trimmed && !partsRequired.includes(trimmed)) {
      onFieldChange('partsRequired', [...partsRequired, trimmed]);
      setNewPart('');
    }
  };

  const removePartsRequired = (idx: number) => {
    onFieldChange(
      'partsRequired',
      partsRequired.filter((_, i) => i !== idx)
    );
  };

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
        Parts
      </h3>

      {/* Parts Required (simple tags) */}
      <div className="space-y-2">
        <Label>Parts Required</Label>
        <div className="flex gap-2">
          <Input
            value={newPart}
            onChange={(e) => setNewPart(e.target.value)}
            placeholder="e.g. Front bumper, Headlight assembly"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addPartsRequired();
              }
            }}
          />
          <Button type="button" variant="outline" size="icon" onClick={addPartsRequired}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {partsRequired.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {partsRequired.map((part, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full border bg-secondary/50 px-3 py-1 text-sm"
              >
                {part}
                <button
                  type="button"
                  onClick={() => removePartsRequired(i)}
                  className="ml-1 rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Customer-Supplied Parts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Customer-Supplied Parts</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCustomerPart}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Part
          </Button>
        </div>

        {parts.map((part, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 rounded-md border bg-muted/20 p-3"
          >
            <div className="flex-1 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Label className="text-xs">Part Name</Label>
                <Input
                  value={part.name}
                  onChange={(e) =>
                    updateCustomerPart(idx, 'name', e.target.value)
                  }
                  placeholder="Part name"
                />
              </div>
              <div>
                <Label className="text-xs">Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={part.quantity}
                  onChange={(e) =>
                    updateCustomerPart(idx, 'quantity', Number(e.target.value))
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Input
                  value={part.notes || ''}
                  onChange={(e) =>
                    updateCustomerPart(idx, 'notes', e.target.value)
                  }
                  placeholder="Optional"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-5 text-destructive hover:bg-destructive/10"
              onClick={() => removeCustomerPart(idx)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
