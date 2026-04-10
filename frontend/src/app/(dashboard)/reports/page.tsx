'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  TrendingUp,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  Calendar,
  Download
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { KPICard } from '@/components/shared/KPICard';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface RevenueStats {
  totalRevenue: number;
  paidInvoices: number;
  unpaidInvoices: number;
  partialInvoices: number;
  totalInvoicesThisMonth: number;
  revenueThisMonth: number;
  revenueTrend: number;
  averageInvoiceValue: number;
  topPayingClients: Array<{
    customerId: string;
    customerName: string;
    totalPaid: number;
    invoiceCount: number;
  }>;
  paymentMethodDistribution: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    invoiceCount: number;
  }>;
}

export default function ReportsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [dateRange, setDateRange] = useState('thisMonth');

  useEffect(() => {
    fetchRevenueStats();
  }, [dateRange]);

  const fetchRevenueStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/invoices/revenue-stats?range=${dateRange}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response.data.data);
    } catch (error: any) {
      toast.error('Failed to load financial reports');
      console.error('Error fetching revenue stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!stats) return;

    let csvContent = "GHS3 Garage - Financial Report\n\n";
    csvContent += `Report Generated: ${new Date().toLocaleString()}\n`;
    csvContent += `Period: ${dateRange}\n\n`;

    csvContent += "=== OVERVIEW ===\n";
    csvContent += `Total Invoices (This Month),${stats.totalInvoicesThisMonth}\n`;
    csvContent += `Revenue (This Month),${stats.revenueThisMonth}\n`;
    csvContent += `Revenue Trend,${stats.revenueTrend}%\n`;
    csvContent += `Paid Invoices,${stats.paidInvoices}\n`;
    csvContent += `Unpaid Invoices,${stats.unpaidInvoices}\n`;
    csvContent += `Partial Invoices,${stats.partialInvoices}\n`;
    csvContent += `Average Invoice Value,${stats.averageInvoiceValue}\n`;
    csvContent += `Total Revenue (All Time),${stats.totalRevenue}\n\n`;

    csvContent += "=== MONTHLY REVENUE TREND ===\n";
    csvContent += "Month,Revenue,Invoice Count\n";
    if (stats.monthlyRevenue && stats.monthlyRevenue.length > 0) {
      stats.monthlyRevenue.forEach(month => {
        csvContent += `${month.month},${month.revenue},${month.invoiceCount}\n`;
      });
    }
    csvContent += "\n";

    csvContent += "=== PAYMENT METHOD DISTRIBUTION ===\n";
    csvContent += "Method,Amount,Transaction Count\n";
    if (stats.paymentMethodDistribution && stats.paymentMethodDistribution.length > 0) {
      stats.paymentMethodDistribution.forEach(method => {
        csvContent += `${method.method},${method.amount},${method.count}\n`;
      });
    }
    csvContent += "\n";

    csvContent += "=== TOP PAYING CLIENTS ===\n";
    csvContent += "Rank,Customer Name,Total Paid,Invoice Count\n";
    if (stats.topPayingClients && stats.topPayingClients.length > 0) {
      stats.topPayingClients.forEach((client, idx) => {
        csvContent += `${idx + 1},${client.customerName},${client.totalPaid},${client.invoiceCount}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `financial_report_${dateRange}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Report downloaded successfully!');
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (!stats) {
    return (
      <div className="space-y-6 p-6">
        <PageHeader title="Financial Reports" description="Track revenue, invoices, and payment trends" />
        <ErrorState message="No data available" onRetry={fetchRevenueStats} />
      </div>
    );
  }

  const paidPercentage = stats.totalInvoicesThisMonth > 0
    ? ((stats.paidInvoices / stats.totalInvoicesThisMonth) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Financial Reports"
        description="Track revenue, invoices, and payment trends"
        action={
          <div className="flex gap-2">
            <Button onClick={downloadReport} className="gap-2">
              <Download className="h-4 w-4" />
              Download Report
            </Button>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="last3Months">Last 3 Months</option>
              <option value="last6Months">Last 6 Months</option>
              <option value="thisYear">This Year</option>
            </select>
          </div>
        }
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Invoices (This Month)"
          value={stats.totalInvoicesThisMonth || 0}
          icon={FileText}
          iconColor="text-primary"
          iconBg="bg-primary/10"
        />
        <KPICard
          title="Revenue (This Month)"
          value={`Ksh ${(stats.revenueThisMonth || 0).toLocaleString()}`}
          icon={DollarSign}
          iconColor="text-success"
          iconBg="bg-success/10"
          trend={(stats.revenueTrend || 0) >= 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(stats.revenueTrend || 0)}% from last month`}
        />
        <KPICard
          title="Paid Invoices"
          value={stats.paidInvoices || 0}
          icon={CheckCircle}
          iconColor="text-success"
          iconBg="bg-success/10"
          trend="up"
          trendValue={`${paidPercentage}% of total`}
        />
        <KPICard
          title="Unpaid Invoices"
          value={stats.unpaidInvoices || 0}
          icon={AlertCircle}
          iconColor="text-destructive"
          iconBg="bg-destructive/10"
          trend="down"
          trendValue={`${stats.partialInvoices || 0} partial payments`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
            <CardDescription>Revenue performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.monthlyRevenue && stats.monthlyRevenue.length > 0 ? (
                stats.monthlyRevenue.map((month, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{month.month}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Ksh {(month.revenue || 0).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{month.invoiceCount} invoices</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No revenue data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method Distribution</CardTitle>
            <CardDescription>How customers are paying</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.paymentMethodDistribution && stats.paymentMethodDistribution.length > 0 ? (
                stats.paymentMethodDistribution.map((method, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-primary" />
                      <span className="font-medium capitalize">{method.method}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Ksh {(method.amount || 0).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{method.count} transactions</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No payment data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Paying Clients */}
      <Card>
        <CardHeader>
          <CardTitle>Top Paying Clients</CardTitle>
          <CardDescription>Customers with highest payment volume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.topPayingClients && stats.topPayingClients.length > 0 ? (
              stats.topPayingClients.map((client, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-medium">{client.customerName}</p>
                      <p className="text-sm text-muted-foreground">{client.invoiceCount} invoices</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-success">Ksh {(client.totalPaid || 0).toLocaleString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No client data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard
          title="Average Invoice Value"
          value={`Ksh ${(stats.averageInvoiceValue || 0).toLocaleString()}`}
          icon={FileText}
          iconColor="text-primary"
          iconBg="bg-primary/10"
        />
        <KPICard
          title="Total Revenue (All Time)"
          value={`Ksh ${(stats.totalRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          iconColor="text-info"
          iconBg="bg-info/10"
        />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Platform</p>
                <Badge variant="secondary">Coming Soon</Badge>
                <p className="mt-1 text-xs text-muted-foreground">Auto payment integration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
