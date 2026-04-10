'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, ChevronDown } from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear } from 'date-fns';

export interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const presets: { label: string; getRange: () => Omit<DateRange, 'label'> }[] = [
  {
    label: 'Today',
    getRange: () => ({ from: new Date(), to: new Date() }),
  },
  {
    label: 'This Week',
    getRange: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfWeek(new Date(), { weekStartsOn: 1 }) }),
  },
  {
    label: 'This Month',
    getRange: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }),
  },
  {
    label: 'Last Month',
    getRange: () => {
      const last = subMonths(new Date(), 1);
      return { from: startOfMonth(last), to: endOfMonth(last) };
    },
  },
  {
    label: 'Last 3 Months',
    getRange: () => ({ from: startOfMonth(subMonths(new Date(), 2)), to: new Date() }),
  },
  {
    label: 'Last 6 Months',
    getRange: () => ({ from: startOfMonth(subMonths(new Date(), 5)), to: new Date() }),
  },
  {
    label: 'This Year',
    getRange: () => ({ from: startOfYear(new Date()), to: new Date() }),
  },
  {
    label: 'Last 30 Days',
    getRange: () => ({ from: subDays(new Date(), 30), to: new Date() }),
  },
  {
    label: 'Last 90 Days',
    getRange: () => ({ from: subDays(new Date(), 90), to: new Date() }),
  },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(format(value.from, 'yyyy-MM-dd'));
  const [customTo, setCustomTo] = useState(format(value.to, 'yyyy-MM-dd'));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const applyCustomRange = () => {
    if (customFrom && customTo) {
      onChange({
        from: new Date(customFrom),
        to: new Date(customTo),
        label: `${format(new Date(customFrom), 'MMM d')} - ${format(new Date(customTo), 'MMM d, yyyy')}`,
      });
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        onClick={() => setOpen(!open)}
        className="gap-2 min-w-[200px] justify-start font-normal"
      >
        <Calendar className="h-4 w-4" />
        <span className="truncate">{value.label}</span>
        <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[340px] rounded-lg border bg-popover p-0 shadow-lg">
          <div className="grid grid-cols-2 gap-1 p-3 border-b">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  const range = preset.getRange();
                  onChange({ ...range, label: preset.label });
                  setOpen(false);
                }}
                className={`rounded-md px-3 py-1.5 text-sm text-left hover:bg-accent transition-colors ${
                  value.label === preset.label ? 'bg-primary text-primary-foreground' : ''
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="p-3 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Custom Range</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">From</Label>
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To</Label>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <Button size="sm" className="w-full" onClick={applyCustomRange}>
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function getDefaultDateRange(): DateRange {
  return {
    from: startOfMonth(new Date()),
    to: new Date(),
    label: 'This Month',
  };
}
