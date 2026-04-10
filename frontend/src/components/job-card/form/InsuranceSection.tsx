'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield } from 'lucide-react';

interface InsuranceData {
  hasInsurance: boolean;
  claimNumber: string;
  insurer: string;
  status: string;
}

interface InsuranceSectionProps {
  insurance: InsuranceData;
  onFieldChange: (field: string, value: any) => void;
}

export function InsuranceSection({
  insurance,
  onFieldChange,
}: InsuranceSectionProps) {
  const update = (key: keyof InsuranceData, value: any) => {
    onFieldChange('insuranceClaim', { ...insurance, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Insurance Claim
        </h3>
        <div className="flex items-center gap-2">
          <Label htmlFor="hasInsurance" className="text-sm text-muted-foreground">
            Insurance Job
          </Label>
          <Switch
            id="hasInsurance"
            checked={insurance.hasInsurance}
            onCheckedChange={(checked) => update('hasInsurance', checked)}
          />
        </div>
      </div>

      {insurance.hasInsurance && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-md border bg-muted/20 p-4">
          <div>
            <Label htmlFor="insurer">Insurer</Label>
            <Input
              id="insurer"
              value={insurance.insurer}
              onChange={(e) => update('insurer', e.target.value)}
              placeholder="e.g. Britam, Jubilee"
            />
          </div>
          <div>
            <Label htmlFor="claimNumber">Claim Number</Label>
            <Input
              id="claimNumber"
              value={insurance.claimNumber}
              onChange={(e) => update('claimNumber', e.target.value)}
              placeholder="CLM-123456"
            />
          </div>
          <div>
            <Label htmlFor="claimStatus">Claim Status</Label>
            <Select
              value={insurance.status}
              onValueChange={(v) => update('status', v)}
            >
              <SelectTrigger id="claimStatus">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
