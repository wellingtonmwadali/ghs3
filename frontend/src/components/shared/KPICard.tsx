'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  } | 'up' | 'down';
  trendValue?: string;
  className?: string;
}

export function KPICard({ title, value, subtitle, icon: Icon, iconColor, iconBg, trend, trendValue, className }: KPICardProps) {
  const renderTrend = () => {
    if (!trend) return null;
    if (typeof trend === 'string') {
      const isPositive = trend === 'up';
      return (
        <p className={cn('text-xs font-medium', isPositive ? 'text-success' : 'text-destructive')}>
          {trendValue || trend}
        </p>
      );
    }
    return (
      <p className={cn('text-xs font-medium', trend.isPositive ? 'text-success' : 'text-destructive')}>
        {trend.isPositive ? '+' : ''}{trend.value}%
      </p>
    );
  };

  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {renderTrend()}
          </div>
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', iconBg || 'bg-primary/10')}>
            <Icon className={cn('h-6 w-6', iconColor || 'text-primary')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
