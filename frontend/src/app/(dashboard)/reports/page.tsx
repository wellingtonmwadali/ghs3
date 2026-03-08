'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  TrendingUp, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Calendar
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/components/ui/toast';

interface RevenueStats {
  totalRevenue: number;
  paidInvoices: number;
  unpaidInvoices: number;
  partialInvoices: number;
  totalInvoicesThisMonth: number;
  revenueThisMonth: number;
  revenueTrend: number; // percentage change from last month
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" text="Loading financial reports..." />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  const paidPercentage = stats.totalInvoicesThisMonth > 0 
    ? ((stats.paidInvoices / stats.totalInvoicesThisMonth) * 100).toFixed(1)
    : '0';

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Financial Reports</h1>
            <p className="text-gray-600">Track revenue, invoices, and payment trends</p>
          </div>
          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="last3Months">Last 3 Months</option>
              <option value="last6Months">Last 6 Months</option>
              <option value="thisYear">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total Invoices (This Month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalInvoicesThisMonth || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Revenue (This Month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              Ksh {(stats.revenueThisMonth || 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1 text-sm">
              {(stats.revenueTrend || 0) >= 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">+{stats.revenueTrend || 0}%</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                  <span className="text-red-600">{stats.revenueTrend || 0}%</span>
                </>
              )}
              <span className="text-gray-500">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Paid Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.paidInvoices || 0}</div>
            <p className="text-sm text-gray-500 mt-1">{paidPercentage}% of total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Unpaid Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.unpaidInvoices || 0}</div>
            <p className="text-sm text-gray-500 mt-1">{stats.partialInvoices || 0} partial payments</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
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
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{month.month}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Ksh {month.revenue.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{month.invoiceCount} invoices</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No revenue data available</p>
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
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="font-medium capitalize">{method.method}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Ksh {method.amount.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{method.count} transactions</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No payment data available</p>
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
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-full font-bold">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-medium">{client.customerName}</p>
                      <p className="text-sm text-gray-500">{client.invoiceCount} invoices</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">Ksh {client.totalPaid.toLocaleString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No client data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <div className="grid grid-cols-3 gap-4 mt-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Average Invoice Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Ksh {(stats.averageInvoiceValue || 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue (All Time)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Ksh {(stats.totalRevenue || 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Payment Platform Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <p className="mb-2">🔄 Coming Soon</p>
              <p className="text-xs">System will be configured to integrate with your payment platform for automatic payment updates.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
