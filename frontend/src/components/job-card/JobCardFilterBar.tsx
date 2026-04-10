'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import {
  STAGES, ACTIVE_STAGES, STAGE_LABELS,
  JOB_TYPE_LABELS, PRIORITY_LABELS,
} from '@/lib/job-card-utils';
import type { CarStage, JobType, Priority, PaymentStatus } from '@/types';
import { useState } from 'react';

interface FilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  stage: string;
  onStageChange: (val: string) => void;
  viewMode: 'active' | 'history';
  onViewModeChange: (val: 'active' | 'history') => void;
  // Advanced filters
  jobType: string;
  onJobTypeChange: (val: string) => void;
  priority: string;
  onPriorityChange: (val: string) => void;
  paymentStatus: string;
  onPaymentStatusChange: (val: string) => void;
}

export function JobCardFilterBar({
  search, onSearchChange,
  stage, onStageChange,
  viewMode, onViewModeChange,
  jobType, onJobTypeChange,
  priority, onPriorityChange,
  paymentStatus, onPaymentStatusChange,
}: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const hasAdvancedFilters = jobType || priority || paymentStatus;

  const clear = () => {
    onSearchChange('');
    onStageChange('');
    onJobTypeChange('');
    onPriorityChange('');
    onPaymentStatusChange('');
  };

  return (
    <div className="space-y-3">
      {/* View mode toggle + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit shrink-0">
          <button
            onClick={() => { onViewModeChange('active'); onStageChange(''); }}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-md transition-colors',
              viewMode === 'active' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Active Jobs
          </button>
          <button
            onClick={() => { onViewModeChange('history'); onStageChange('completed'); }}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-md transition-colors',
              viewMode === 'history' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            History
          </button>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search plate, model, customer, job#..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        <Button
          variant={showAdvanced || hasAdvancedFilters ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
          {hasAdvancedFilters && (
            <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {[jobType, priority, paymentStatus].filter(Boolean).length}
            </span>
          )}
        </Button>

        {(hasAdvancedFilters || search || stage) && (
          <Button variant="ghost" size="sm" onClick={clear} className="shrink-0 text-muted-foreground">
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Stage pills */}
      {viewMode === 'active' && (
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => onStageChange('')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full transition-colors border',
              !stage ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:text-foreground'
            )}
          >
            All
          </button>
          {ACTIVE_STAGES.map((s) => (
            <button
              key={s}
              onClick={() => onStageChange(s)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-full transition-colors border',
                stage === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:text-foreground'
              )}
            >
              {STAGE_LABELS[s]}
            </button>
          ))}
        </div>
      )}

      {/* Advanced filter row */}
      {showAdvanced && (
        <div className="flex gap-2 flex-wrap p-3 bg-muted/50 rounded-lg border border-dashed">
          <FilterSelect
            label="Job Type"
            value={jobType}
            onChange={onJobTypeChange}
            options={Object.entries(JOB_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />
          <FilterSelect
            label="Priority"
            value={priority}
            onChange={onPriorityChange}
            options={Object.entries(PRIORITY_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />
          <FilterSelect
            label="Payment"
            value={paymentStatus}
            onChange={onPaymentStatusChange}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'partial', label: 'Partial' },
              { value: 'paid', label: 'Paid' },
            ]}
          />
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'text-xs h-8 rounded-md border bg-background px-2 pr-6',
        value ? 'border-primary text-foreground' : 'text-muted-foreground'
      )}
    >
      <option value="">{label}: All</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
