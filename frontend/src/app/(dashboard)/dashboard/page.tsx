'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Car, CheckCircle, Clock, DollarSign, Users, Wrench, Calendar, CloudSun, Quote, Cake, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/ui/toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

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

interface Mechanic {
  _id: string;
  firstName: string;
  lastName: string;
  birthday: string;
}

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
}

const quotes = [
  "Excellence is not an act, but a habit. - Aristotle",
  "Quality is not an act, it is a habit. - Aristotle",
  "The secret of getting ahead is getting started. - Mark Twain",
  "Success is the sum of small efforts repeated day in and day out. - Robert Collier",
  "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
  "The only way to do great work is to love what you do. - Steve Jobs",
  "Your work is going to fill a large part of your life. - Steve Jobs",
  "Believe you can and you're halfway there. - Theodore Roosevelt"
];

export default function DashboardPage() {
  const toast = useToast();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [birthdayMechanics, setBirthdayMechanics] = useState<Mechanic[]>([]);
  const [dailyQuote] = useState(quotes[Math.floor(Math.random() * quotes.length)]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [revenuePeriod, setRevenuePeriod] = useState<'today' | 'week' | 'month' | '3months' | '6months' | 'custom'>('week');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentBirthdayIndex, setCurrentBirthdayIndex] = useState(0);

  useEffect(() => {
    fetchDashboardData();
    fetchWeather();
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchWeather = async () => {
    try {
      // Using OpenWeatherMap API for Nairobi
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=Nairobi,KE&units=metric&appid=YOUR_API_KEY`
      );
      setWeather({
        temp: Math.round(response.data.main.temp),
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon
      });
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      // Fallback to default weather
      setWeather({
        temp: 24,
        description: 'Partly Sunny',
        icon: '02d'
      });
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [statsRes, revenueRes, mechanicsRes] = await Promise.all([
        api.get('/cars/dashboard'),
        api.get('/invoices/revenue-stats'),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/mechanics/birthdays`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsRes.data.data);
      setRevenue(revenueRes.data.data);
      setBirthdayMechanics(mechanicsRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = currentDateTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getCurrentRevenue = () => {
    if (!revenue) return 0;
    switch (revenuePeriod) {
      case 'today': return revenue.revenueToday;
      case 'week': return revenue.revenueThisWeek;
      case 'month': return revenue.revenueThisMonth;
      case '3months': return revenue.revenueThisMonth * 3;
      case '6months': return revenue.revenueThisMonth * 6;
      case 'custom': return revenue.revenueThisMonth;
      default: return 0;
    }
  };

  const getTodayBirthdays = () => {
    const today = new Date();
    return birthdayMechanics.filter(mechanic => {
      const birthday = new Date(mechanic.birthday);
      return birthday.getDate() === today.getDate() && birthday.getMonth() === today.getMonth();
    });
  };

  const getWorkloadChartData = () => {
    if (!stats?.workloadDistribution) return [];
    return stats.workloadDistribution.slice(0, 8).map(mechanic => ({
      name: `${mechanic.firstName.charAt(0)}. ${mechanic.lastName}`,
      workload: mechanic.workload
    }));
  };

  const getChartData = () => {
    if (!revenue) return [];
    // Mock data for demonstration - replace with actual API data
    if (revenuePeriod === 'today') {
      return [
        { time: '9 AM', revenue: revenue.revenueToday * 0.1, cars: 2 },
        { time: '11 AM', revenue: revenue.revenueToday * 0.3, cars: 5 },
        { time: '1 PM', revenue: revenue.revenueToday * 0.5, cars: 8 },
        { time: '3 PM', revenue: revenue.revenueToday * 0.7, cars: 11 },
        { time: '5 PM', revenue: revenue.revenueToday * 0.9, cars: 14 },
        { time: 'Now', revenue: revenue.revenueToday, cars: stats?.carsCompletedToday || 0 }
      ];
    } else if (revenuePeriod === 'week') {
      return [
        { time: 'Mon', revenue: revenue.revenueThisWeek * 0.1, cars: 3 },
        { time: 'Tue', revenue: revenue.revenueThisWeek * 0.25, cars: 5 },
        { time: 'Wed', revenue: revenue.revenueThisWeek * 0.4, cars: 8 },
        { time: 'Thu', revenue: revenue.revenueThisWeek * 0.6, cars: 12 },
        { time: 'Fri', revenue: revenue.revenueThisWeek * 0.8, cars: 15 },
        { time: 'Today', revenue: revenue.revenueThisWeek, cars: 18 }
      ];
    } else if (revenuePeriod === 'month') {
      return [
        { time: 'Week 1', revenue: revenue.revenueThisMonth * 0.15, cars: 12 },
        { time: 'Week 2', revenue: revenue.revenueThisMonth * 0.35, cars: 28 },
        { time: 'Week 3', revenue: revenue.revenueThisMonth * 0.65, cars: 45 },
        { time: 'Week 4', revenue: revenue.revenueThisMonth, cars: 60 }
      ];
    } else if (revenuePeriod === '3months') {
      const monthlyRev = revenue.revenueThisMonth;
      return [
        { time: 'Month 1', revenue: monthlyRev * 0.8, cars: 50 },
        { time: 'Month 2', revenue: monthlyRev * 0.9, cars: 55 },
        { time: 'Month 3', revenue: monthlyRev, cars: 60 }
      ];
    } else if (revenuePeriod === '6months') {
      const monthlyRev = revenue.revenueThisMonth;
      return [
        { time: 'M1', revenue: monthlyRev * 0.7, cars: 45 },
        { time: 'M2', revenue: monthlyRev * 0.75, cars: 48 },
        { time: 'M3', revenue: monthlyRev * 0.85, cars: 52 },
        { time: 'M4', revenue: monthlyRev * 0.9, cars: 55 },
        { time: 'M5', revenue: monthlyRev * 0.95, cars: 58 },
        { time: 'M6', revenue: monthlyRev, cars: 60 }
      ];
    } else {
      return [
        { time: 'Start', revenue: revenue.revenueThisMonth * 0.5, cars: 30 },
        { time: 'Mid', revenue: revenue.revenueThisMonth * 0.75, cars: 45 },
        { time: 'End', revenue: revenue.revenueThisMonth, cars: 60 }
      ];
    }
  };

  const handleExportExcel = () => {
    if (!dateRange.start || !dateRange.end) {
      setShowDatePicker(true);
    } else {
      // Implement Excel export logic here
      toast.info(`Exporting data from ${dateRange.start} to ${dateRange.end}`);
      setShowDatePicker(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="h-full p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          {getGreeting()}, {user?.firstName || 'User'}! 👋
        </h1>
      </div>

      {/* Top Info Row - Date, Weather, Quote */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date & Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">
              {currentDateTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-2xl font-bold mt-2">
              {currentDateTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit'
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CloudSun className="h-4 w-4" />
              Weather - Nairobi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="text-4xl">
                {weather?.icon ? 
                  <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt="weather" className="w-12 h-12" /> 
                  : '☀️'
                }
              </div>
              <div>
                <div className="text-2xl font-bold">{weather?.temp || 24}°C</div>
                <div className="text-sm text-muted-foreground capitalize">{weather?.description || 'Partly Sunny'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Quote className="h-4 w-4" />
              Quote of the Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm italic leading-relaxed">
              "{dailyQuote}"
            </p>
          </CardContent>
        </Card>
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

      {/* Revenue & Performance Section */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {/* Revenue Card with Period Toggle */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg font-semibold">Revenue</CardTitle>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setRevenuePeriod('today')}
                  className={`px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors ${revenuePeriod === 'today' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Today
                </button>
                <button
                  onClick={() => setRevenuePeriod('week')}
                  className={`px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors ${revenuePeriod === 'week' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Week
                </button>
                <button
                  onClick={() => setRevenuePeriod('month')}
                  className={`px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors ${revenuePeriod === 'month' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Month
                </button>
                <button
                  onClick={() => setRevenuePeriod('3months')}
                  className={`px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors ${revenuePeriod === '3months' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  3 Months
                </button>
                <button
                  onClick={() => setRevenuePeriod('6months')}
                  className={`px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors ${revenuePeriod === '6months' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  6 Months
                </button>
                <button
                  onClick={() => {
                    setRevenuePeriod('custom');
                    setShowDatePicker(true);
                  }}
                  className={`px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors ${revenuePeriod === 'custom' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Custom
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              Ksh {getCurrentRevenue().toLocaleString()}
            </div>
            <p className="mt-1 text-sm text-muted-foreground capitalize">
              Revenue for {revenuePeriod === 'today' ? 'today' : revenuePeriod === 'week' ? 'this week' : revenuePeriod === 'month' ? 'this month' : revenuePeriod === '3months' ? 'last 3 months' : revenuePeriod === '6months' ? 'last 6 months' : 'custom period'}
            </p>
            {revenuePeriod === 'custom' && dateRange.start && dateRange.end && (
              <p className="mt-1 text-xs text-gray-500">
                {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
              </p>
            )}
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Today</p>
                <p className="font-semibold">Ksh {(revenue?.revenueToday || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">This Week</p>
                <p className="font-semibold">Ksh {(revenue?.revenueThisWeek || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">This Month</p>
                <p className="font-semibold">Ksh {(revenue?.revenueThisMonth || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Graph */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Performance</CardTitle>
              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-green-50 rounded-md transition-colors border border-green-200"
                  title="Export to Excel"
                >
                  <div className="w-5 h-5 bg-gradient-to-br from-green-600 to-green-700 rounded flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 012-2h8l4 4v10a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
                      <path d="M12 2v4h4"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-green-700">Excel</span>
                </button>
                {showDatePicker && (
                  <div className="absolute right-0 mt-2 p-4 bg-white border rounded-lg shadow-xl z-10 w-72">
                    <p className="text-sm font-semibold mb-3">Export Revenue Data</p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">From Date</label>
                        <input
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">To Date</label>
                        <input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDatePicker(false)}
                          className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleExportExcel}
                          className="flex-1 bg-green-600 text-white py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
                        >
                          Export
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={getChartData()} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  stroke="#9ca3af"
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  stroke="#9ca3af"
                  label={{ value: 'Revenue (Ksh)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#6b7280' } }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  stroke="#9ca3af"
                  label={{ value: 'Cars', angle: 90, position: 'insideRight', style: { fontSize: 11, fill: '#6b7280' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: any, name?: string) => {
                    if (name === 'revenue') return [`Ksh ${value.toLocaleString()}`, 'Revenue'];
                    if (name === 'cars') return [value, 'Cars Completed'];
                    return value;
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px' }}
                  iconType="circle"
                />
                <Bar 
                  yAxisId="right"
                  dataKey="cars" 
                  fill="#3b82f6" 
                  name="cars"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={40}
                  opacity={0.8}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  name="revenue"
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Workload Distribution */}
      <div className="mt-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Workload Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {stats?.workloadDistribution.map((mechanic: any) => (
                <div key={mechanic._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium">
                      {mechanic.firstName} {mechanic.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {mechanic.specialization}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-blue-600">{mechanic.workload}</p>
                      <p className="text-xs text-muted-foreground">active jobs</p>
                    </div>
                    <div className="h-2 w-24 overflow-hidden bg-gray-200 rounded-full">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min((mechanic.workload / 5) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(!stats?.workloadDistribution || stats.workloadDistribution.length === 0) && (
                <p className="text-center text-muted-foreground py-8">No mechanics available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Birthday Section */}
      <div className="mt-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Cake className="h-5 w-5" />
              Birthdays This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getTodayBirthdays().length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Today's Birthday Celebration */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-200">
                  <div className="text-center">
                    <div className="text-5xl mb-3">🎉</div>
                    <h3 className="text-2xl font-bold text-blue-900 mb-2">
                      Happy Birthday!
                    </h3>
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                        {getTodayBirthdays()[currentBirthdayIndex]?.firstName.charAt(0)}{getTodayBirthdays()[currentBirthdayIndex]?.lastName.charAt(0)}
                      </div>
                    </div>
                    <p className="text-xl font-semibold text-gray-800">
                      {getTodayBirthdays()[currentBirthdayIndex]?.firstName} {getTodayBirthdays()[currentBirthdayIndex]?.lastName}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Wishing you a wonderful day! 🎂</p>
                    {getTodayBirthdays().length > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <button
                          onClick={() => setCurrentBirthdayIndex((prev) => (prev > 0 ? prev - 1 : getTodayBirthdays().length - 1))}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 shadow-sm"
                        >
                          <ChevronLeft className="h-5 w-5 text-gray-600" />
                        </button>
                        <span className="text-sm text-gray-600">
                          {currentBirthdayIndex + 1} of {getTodayBirthdays().length}
                        </span>
                        <button
                          onClick={() => setCurrentBirthdayIndex((prev) => (prev < getTodayBirthdays().length - 1 ? prev + 1 : 0))}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 shadow-sm"
                        >
                          <ChevronRight className="h-5 w-5 text-gray-600" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {/* Other birthdays this month */}
                <div>
                  {birthdayMechanics.length > getTodayBirthdays().length ? (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {birthdayMechanics.filter(m => !getTodayBirthdays().includes(m)).map((mechanic) => (
                        <div key={mechanic._id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          <div className="text-3xl">🎂</div>
                          <div>
                            <p className="font-medium">{mechanic.firstName} {mechanic.lastName}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(mechanic.birthday).toLocaleDateString('en-US', { 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-center text-muted-foreground">No other birthdays this month</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {birthdayMechanics.length > 0 ? (
                  birthdayMechanics.map((mechanic) => (
                    <div key={mechanic._id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="text-3xl">🎂</div>
                      <div>
                        <p className="font-medium">{mechanic.firstName} {mechanic.lastName}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(mechanic.birthday).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No birthdays this month</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
