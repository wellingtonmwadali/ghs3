'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface VehicleSectionProps {
  vehicleMake: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleYear: string;
  vehicleColor: string;
  vehicleMileage: string;
  onFieldChange: (field: string, value: string) => void;
}

export function VehicleSection({
  vehicleMake,
  vehicleModel,
  vehiclePlate,
  vehicleYear,
  vehicleColor,
  vehicleMileage,
  onFieldChange,
}: VehicleSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
        Vehicle Information
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label htmlFor="vehiclePlate">Plate Number *</Label>
          <Input
            id="vehiclePlate"
            value={vehiclePlate}
            onChange={(e) =>
              onFieldChange('vehiclePlate', e.target.value.toUpperCase())
            }
            placeholder="e.g. KDA 123A"
          />
        </div>
        <div>
          <Label htmlFor="vehicleMake">Make</Label>
          <Input
            id="vehicleMake"
            value={vehicleMake}
            onChange={(e) => onFieldChange('vehicleMake', e.target.value)}
            placeholder="e.g. Toyota"
          />
        </div>
        <div>
          <Label htmlFor="vehicleModel">Model *</Label>
          <Input
            id="vehicleModel"
            value={vehicleModel}
            onChange={(e) => onFieldChange('vehicleModel', e.target.value)}
            placeholder="e.g. Land Cruiser Prado"
          />
        </div>
        <div>
          <Label htmlFor="vehicleYear">Year *</Label>
          <Input
            id="vehicleYear"
            type="number"
            min="1900"
            max="2030"
            value={vehicleYear}
            onChange={(e) => onFieldChange('vehicleYear', e.target.value)}
            placeholder="e.g. 2022"
          />
        </div>
        <div>
          <Label htmlFor="vehicleColor">Color *</Label>
          <Input
            id="vehicleColor"
            value={vehicleColor}
            onChange={(e) => onFieldChange('vehicleColor', e.target.value)}
            placeholder="e.g. Pearl White"
          />
        </div>
        <div>
          <Label htmlFor="vehicleMileage">Mileage (km)</Label>
          <Input
            id="vehicleMileage"
            type="number"
            min="0"
            value={vehicleMileage}
            onChange={(e) => onFieldChange('vehicleMileage', e.target.value)}
            placeholder="e.g. 45000"
          />
        </div>
      </div>
    </div>
  );
}
