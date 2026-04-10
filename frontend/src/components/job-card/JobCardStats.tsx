'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList, Clock, AlertTriangle, CheckCircle2, PauseCircle, Wrench } from 'lucide-react';
import type { Car } from '@/types';

interface StatsProps {
  cars: Car[];
}

export function JobCardStats({ cars }: StatsProps) {
  const active = cars.filter(c => c.stage !== 'completed' && c.stage !== 'collected');
  const paused = active.filter(c => c.isPaused);
  const urgent = active.filter(c => c.priority === 'urgent' || c.priority === 'high');
  const awaitingApproval = active.filter(c => c.stage === 'awaiting_approval');
  const readyPickup = cars.filter(c => c.stage === 'ready_pickup');
  const inRepair = active.filter(c => ['in_repair', 'painting', 'detailing'].includes(c.stage));

  const stats = [
    { label: 'Active Jobs', value: active.length, icon: ClipboardList, color: 'text-blue-600 bg-blue-50' },
    { label: 'In Workshop', value: inRepair.length, icon: Wrench, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Awaiting Approval', value: awaitingApproval.length, icon: Clock, color: 'text-orange-600 bg-orange-50' },
    { label: 'Ready Pickup', value: readyPickup.length, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Urgent/High', value: urgent.length, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
    { label: 'Paused', value: paused.length, icon: PauseCircle, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((s) => (
        <Card key={s.label} className="border-none shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold leading-none">{s.value}</p>
              <p className="text-[10px] text-muted-foreground truncate">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
