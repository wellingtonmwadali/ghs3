'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Car, CheckCircle, Clock, DollarSign, Users, Wrench } from 'lucide-react';

interface DashboardStats {
  totalCarsInGarage: number;
  carsCompletedToday: number;
  carsWaitingPickup: number;
  carsInProgress: number;
  activeMechanics: number;
  workloadDistribution: any[];
}

interface RevenueStats {
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, revenueRes] = await Promise.all([
        api.get('/cars/dashboard'),
        api.get('/invoices/revenue-stats'),
      ]);

      setStats(statsRes.data.data);
      setRevenue(revenueRes.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Overview of your garage operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cars in Garage
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{stats?.totalCarsInGarage || 0}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Currently being serviced
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{stats?.carsCompletedToday || 0}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Cars finished today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ready for Pickup
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{stats?.carsWaitingPickup || 0}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Waiting for customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Mechanics
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{stats?.activeMechanics || 0}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Currently working
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Section */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">Revenue</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {formatCurrency(revenue?.revenueToday || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {formatCurrency(revenue?.revenueThisWeek || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {formatCurrency(revenue?.revenueThisMonth || 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Workload Distribution */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">Workload Distribution</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {stats?.workloadDistribution.map((mechanic: any) => (
                <div key={mechanic._id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {mechanic.firstName} {mechanic.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {mechanic.specialization}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-semibold">{mechanic.workload}</p>
                      <p className="text-xs text-muted-foreground">active jobs</p>
                    </div>
                    <div className="h-2 w-24 overflow-hidden bg-secondary">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.min((mechanic.workload / 5) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(!stats?.workloadDistribution || stats.workloadDistribution.length === 0) && (
                <p className="text-center text-muted-foreground">No mechanics available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
