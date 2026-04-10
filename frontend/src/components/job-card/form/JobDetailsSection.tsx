'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { JOB_TYPE_LABELS, PRIORITY_LABELS } from '@/lib/job-card-utils';

interface JobDetailsSectionProps {
  jobType: string;
  priority: string;
  bayNumber: string;
  complaint: string;
  damageAssessment: string;
  notes: string;
  estimatedCost: string;
  expectedCompletionDate: string;
  onFieldChange: (field: string, value: string) => void;
}

export function JobDetailsSection({
  jobType,
  priority,
  bayNumber,
  complaint,
  damageAssessment,
  notes,
  estimatedCost,
  expectedCompletionDate,
  onFieldChange,
}: JobDetailsSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
        Job Details
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label htmlFor="jobType">Job Type</Label>
          <Select
            value={jobType}
            onValueChange={(v) => onFieldChange('jobType', v)}
          >
            <SelectTrigger id="jobType">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(JOB_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={priority}
            onValueChange={(v) => onFieldChange('priority', v)}
          >
            <SelectTrigger id="priority">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="bayNumber">Bay Number</Label>
          <Input
            id="bayNumber"
            value={bayNumber}
            onChange={(e) => onFieldChange('bayNumber', e.target.value)}
            placeholder="e.g. Bay 1"
          />
        </div>

        <div>
          <Label htmlFor="estimatedCost">Estimated Cost (KES) *</Label>
          <Input
            id="estimatedCost"
            type="number"
            min="0"
            value={estimatedCost}
            onChange={(e) => onFieldChange('estimatedCost', e.target.value)}
            placeholder="0"
          />
        </div>

        <div>
          <Label htmlFor="expectedCompletionDate">Expected Completion *</Label>
          <Input
            id="expectedCompletionDate"
            type="date"
            value={expectedCompletionDate}
            onChange={(e) =>
              onFieldChange('expectedCompletionDate', e.target.value)
            }
          />
        </div>
      </div>

      <div>
        <Label htmlFor="complaint">Customer Complaint</Label>
        <Textarea
          id="complaint"
          value={complaint}
          onChange={(e) => onFieldChange('complaint', e.target.value)}
          placeholder="Describe the customer's complaint or request..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="damageAssessment">Damage Assessment</Label>
        <Textarea
          id="damageAssessment"
          value={damageAssessment}
          onChange={(e) => onFieldChange('damageAssessment', e.target.value)}
          placeholder="Document any visible damage..."
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="notes">Internal Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => onFieldChange('notes', e.target.value)}
          placeholder="Any additional notes..."
          rows={2}
        />
      </div>
    </div>
  );
}
