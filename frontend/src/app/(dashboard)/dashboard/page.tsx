'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format-utils';
import { KPICard } from '@/components/shared/KPICard';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { Progress } from '@/components/ui/progress';
import {
  Car, CheckCircle, Clock, Wrench, Cake, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, Users, DollarSign, RefreshCw
} from 'lucide-react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

// ==================== Types ====================

interface DashboardStats {
  totalCarsInGarage: number;
  carsCompletedToday: number;
  carsWaitingPickup: number;
  carsInProgress: number;
  activeMechanics: number;
  workloadDistribution: {
    _id: string;
    firstName: string;
    lastName: string;
    specialization: string;
    workload: number;
  }[];
}

interface RevenueStats {
  totalRevenue: number;
  paidInvoices: number;
  unpaidInvoices: number;
  partialInvoices: number;
  totalInvoicesThisMonth: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  revenueTrend: number;
  averageInvoiceValue: number;
  topPayingClients: {
    customerId: string;
    customerName: string;
    totalPaid: number;
    invoiceCount: number;
  }[];
  paymentMethodDistribution: {
    method: string;
    count: number;
    amount: number;
  }[];
  monthlyRevenue: {
    month: string;
    revenue: number;
    invoiceCount: number;
  }[];
}

interface BirthdayMechanic {
  _id: string;
  firstName: string;
  lastName: string;
  birthday: string;
}

type RevenuePeriod = 'today' | 'week' | 'month';

const QUOTES = [
  "Excellence is not an act, but a habit.",
  "The secret of getting ahead is getting started.",
  "Success is the sum of small efforts repeated day in and day out.",
  "The only way to do great work is to love what you do.",
  "Believe you can and you are halfway there."
];

const PERIOD_OPTIONS: { value: RevenuePeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

// ==================== Sub-Components ====================

function GreetingHeader({ user, dateTime }: { user: any; dateTime: Date }) {
  const hour = dateTime.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">
        {greeting}, {user?.firstName || 'User'}
      </h1>
      <p className="text-sm text-muted-foreground mt-1 italic">&ldquo;{quote}&rdquo;</p>
    </div>
  );
}

function RevenueCard({ revenue }: { revenue: RevenueStats | null }) {
  const [period, setPeriod] = useState<RevenuePeriod>('week');

  const getCurrentRevenue = () => {
    if (!revenue) return 0;
    switch (period) {
      case 'today': return revenue.revenueToday;
      case 'week': return revenue.revenueThisWeek;
      case 'month': return revenue.revenueThisMonth;
    }
  };

  const periodLabel = period === 'today' ? 'today' : period === 'week' ? 'this week' : 'this month';

  return (
    <Card className="lg:col-span-3">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Revenue</CardTitle>
          <div className="flex items-center gap-1.5">
            {revenue && revenue.revenueTrend !== 0 && (
              <span className={cn(
                'flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded',
                revenue.revenueTrend > 0
                  ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950'
                  : 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950'
              )}>
                {revenue.revenueTrend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(revenue.revenueTrend)}%
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={cn(
                'flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors',
                period === opt.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div>
          <p className="text-3xl font-bold">{formatCurrency(getCurrentRevenue())}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Revenue for {periodLabel}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Today</p>
            <p className="text-sm font-semibold">{formatCurrency(revenue?.revenueToday || 0)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">This Week</p>
            <p className="text-sm font-semibold">{formatCurrency(revenue?.revenueThisWeek || 0)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">This Month</p>
            <p className="text-sm font-semibold">{formatCurrency(revenue?.revenueThisMonth || 0)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceChart({ revenue }: { revenue: RevenueStats | null }) {
  const chartData = revenue?.monthlyRevenue || [];

  return (
    <Card className="lg:col-span-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Performance Overview</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: any, name?: string) => {
                  if (name === 'revenue') return [`Ksh ${Number(value).toLocaleString()}`, 'Revenue'];
                  if (name === 'invoiceCount') return [value, 'Invoices'];
                  return [value, name];
                }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }}
                formatter={(value: string) => value === 'invoiceCount' ? 'Invoices' : 'Revenue'}
              />
              <Bar yAxisId="right" dataKey="invoiceCount" fill="hsl(var(--chart-1))" name="invoiceCount" radius={[4, 4, 0, 0]} maxBarSize={32} opacity={0.8} />
              <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(var(--chart-2))" strokeWidth={2.5} name="revenue" dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
            No revenue data available yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WorkloadSection({ stats }: { stats: DashboardStats | null }) {
  if (!stats?.workloadDistribution || stats.workloadDistribution.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Workload Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground py-8">No mechanics available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Workload Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {stats.workloadDistribution.map((mechanic) => (
            <div key={mechanic._id} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary flex-shrink-0">
                {mechanic.firstName?.charAt(0)}{mechanic.lastName?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">{mechanic.firstName} {mechanic.lastName}</p>
                  <span className="text-sm font-semibold text-primary ml-2">{mechanic.workload}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={Math.min((mechanic.workload / 5) * 100, 100)} className="h-1.5" />
                  <span className="text-xs text-muted-foreground capitalize flex-shrink-0">{mechanic.specialization}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BirthdaySection({ mechanics }: { mechanics: BirthdayMechanic[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (mechanics.length === 0) return null;

  const todayBirthdays = mechanics.filter(m => {
    const bday = new Date(m.birthday);
    const now = new Date();
    return bday.getDate() === now.getDate() && bday.getMonth() === now.getMonth();
  });
  const upcomingBirthdays = mechanics.filter(m => !todayBirthdays.includes(m));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Cake className="h-4 w-4" />
          Birthdays This Month
        </CardTitle>
      </CardHeader>
      <CardContent>
        {todayBirthdays.length > 0 && (
          <div className="mb-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 p-4 text-center">
            <p className="text-2xl mb-1">&#x1F389;</p>
            <p className="font-semibold">Happy Birthday, {todayBirthdays[currentIndex]?.firstName}!</p>
            <p className="text-sm text-muted-foreground">Wishing you a wonderful day &#x1F382;</p>
            {todayBirthdays.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : todayBirthdays.length - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">{currentIndex + 1} / {todayBirthdays.length}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentIndex((prev) => (prev < todayBirthdays.length - 1 ? prev + 1 : 0))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
        {upcomingBirthdays.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingBirthdays.map((mechanic) => (
              <div key={mechanic._id} className="flex items-center gap-3 rounded-lg border p-3">
                <span className="text-xl">&#x1F382;</span>
                <div>
                  <p className="text-sm font-medium">{mechanic.firstName} {mechanic.lastName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(mechanic.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickStats({ revenue }: { revenue: RevenueStats | null }) {
  if (!revenue) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="text-lg font-bold">{formatCurrency(revenue.totalRevenue)}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Paid Invoices</p>
              <p className="text-lg font-bold">{revenue.paidInvoices}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
              <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Unpaid Invoices</p>
              <p className="text-lg font-bold">{revenue.unpaidInvoices}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Avg Invoice Value</p>
              <p className="text-lg font-bold">{formatCurrency(revenue.averageInvoiceValue)}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== Main Dashboard ====================

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [birthdayMechanics, setBirthdayMechanics] = useState<BirthdayMechanic[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    const timer = setInterval(() => setCurrentDateTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(false);
      const [statsRes, revenueRes, mechanicsRes] = await Promise.all([
        api.get('/cars/dashboard'),
        api.get('/invoices/revenue-stats'),
        api.get('/mechanics/birthdays')
      ]);
      setStats(statsRes.data.data);
      setRevenue(revenueRes.data.data);
      setBirthdayMechanics(mechanicsRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState title="Failed to load dashboard" message="Could not fetch dashboard data. Please try again." onRetry={fetchDashboardData} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <GreetingHeader user={user} dateTime={currentDateTime} />
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={cn('h-4 w-4 mr-1.5', refreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPICard title="Cars in Garage" value={stats?.totalCarsInGarage || 0} icon={Car} iconColor="text-blue-600" iconBg="bg-blue-100 dark:bg-blue-950" />
        <KPICard title="In Progress" value={stats?.carsInProgress || 0} icon={Wrench} iconColor="text-amber-600" iconBg="bg-amber-100 dark:bg-amber-950" />
        <KPICard title="Completed Today" value={stats?.carsCompletedToday || 0} icon={CheckCircle} iconColor="text-emerald-600" iconBg="bg-emerald-100 dark:bg-emerald-950" />
        <KPICard title="Waiting Pickup" value={stats?.carsWaitingPickup || 0} icon={Clock} iconColor="text-orange-600" iconBg="bg-orange-100 dark:bg-orange-950" />
        <KPICard title="Active Mechanics" value={stats?.activeMechanics || 0} icon={Users} iconColor="text-indigo-600" iconBg="bg-indigo-100 dark:bg-indigo-950" />
      </div>

      {/* Revenue + Chart */}
      <div className="grid gap-4 lg:grid-cols-7">
        <RevenueCard revenue={revenue} />
        <PerformanceChart revenue={revenue} />
      </div>

      {/* Invoice Quick Stats */}
      <QuickStats revenue={revenue} />

      {/* Workload */}
      <WorkloadSection stats={stats} />

      {/* Birthdays */}
      <BirthdaySection mechanics={birthdayMechanics} />
    </div>
  );
}
