'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import {
  Clock, LogIn, LogOut, Users, Timer, CalendarDays,
  CheckCircle2, XCircle, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { KPICard } from '@/components/shared/KPICard';
import { useToast } from '@/components/ui/toast';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

// ==================== Types ====================

interface AttendanceRecord {
  _id: string;
  mechanicId: string;
  mechanicName: string;
  date: string;
  clockInTime: string;
  clockOutTime?: string;
  totalHours?: number;
  status: 'clocked-in' | 'clocked-out' | 'absent' | 'on-leave';
  notes?: string;
  location?: { latitude: number; longitude: number };
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  'clocked-in': { label: 'Clocked In', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  'clocked-out': { label: 'Clocked Out', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
  'absent': { label: 'Absent', color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' },
  'on-leave': { label: 'On Leave', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
};

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
}

// ==================== Mechanic Clock-In/Out Card ====================

function ClockInOutCard({ onRefresh }: { onRefresh: () => void }) {
  const toast = useToast();
  const [currentStatus, setCurrentStatus] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/attendance/status');
      setCurrentStatus(res.data.data);
    } catch {
      // No status = not clocked in
      setCurrentStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const getLocation = (): Promise<{ latitude: number; longitude: number } | undefined> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(undefined);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(undefined),
        { timeout: 5000 }
      );
    });
  };

  const handleClockIn = async () => {
    setActionLoading(true);
    try {
      const location = await getLocation();
      await api.post('/attendance/clock-in', { location, notes: notes || undefined });
      toast.success('Clocked in successfully!');
      setNotes('');
      await fetchStatus();
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to clock in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    try {
      const location = await getLocation();
      await api.post('/attendance/clock-out', { location, notes: notes || undefined });
      toast.success('Clocked out successfully!');
      setNotes('');
      await fetchStatus();
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to clock out');
    } finally {
      setActionLoading(false);
    }
  };

  const isClockedIn = currentStatus?.status === 'clocked-in';

  // Calculate elapsed time if clocked in
  let elapsedStr = '';
  if (isClockedIn && currentStatus?.clockInTime) {
    const elapsed = Math.floor((currentTime.getTime() - new Date(currentStatus.clockInTime).getTime()) / 1000);
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    elapsedStr = `${h}h ${m}m ${s}s`;
  }

  if (loading) return null;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Timer className="h-4 w-4" />
          My Clock
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Time Display */}
        <div className="text-center">
          <p className="text-4xl font-bold tabular-nums tracking-tight">
            {currentTime.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {currentTime.toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Status */}
        {isClockedIn && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 text-center">
            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Currently Working</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              Clocked in at {formatTime(currentStatus.clockInTime)}
            </p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-2 tabular-nums">{elapsedStr}</p>
          </div>
        )}

        {currentStatus?.status === 'clocked-out' && (
          <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border p-4 text-center">
            <p className="text-sm font-medium">Shift Completed</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatTime(currentStatus.clockInTime)} - {currentStatus.clockOutTime && formatTime(currentStatus.clockOutTime)}
            </p>
            <p className="text-lg font-bold mt-1">{currentStatus.totalHours?.toFixed(1)}h logged</p>
          </div>
        )}

        {/* Notes */}
        <Textarea
          placeholder="Add a note (optional)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="resize-none text-sm"
        />

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isClockedIn && currentStatus?.status !== 'clocked-out' && (
            <Button onClick={handleClockIn} disabled={actionLoading} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              <LogIn className="h-4 w-4 mr-1.5" />
              {actionLoading ? 'Clocking In...' : 'Clock In'}
            </Button>
          )}
          {isClockedIn && (
            <Button onClick={handleClockOut} disabled={actionLoading} variant="destructive" className="flex-1">
              <LogOut className="h-4 w-4 mr-1.5" />
              {actionLoading ? 'Clocking Out...' : 'Clock Out'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== Main Page ====================

export default function AttendancePage() {
  const toast = useToast();
  const { user } = useAuthStore();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isMechanic = user?.role?.slug === 'mechanic';
  const isManager = user?.role?.slug === 'owner' || user?.role?.slug === 'manager';

  const fetchAttendance = useCallback(async () => {
    try {
      if (isManager) {
        const res = await api.get('/attendance/today');
        setRecords(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isManager]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAttendance();
  };

  // KPI counts (managers)
  const clockedIn = records.filter(r => r.status === 'clocked-in').length;
  const clockedOut = records.filter(r => r.status === 'clocked-out').length;
  const totalHoursToday = records.reduce((sum, r) => sum + (r.totalHours || 0), 0);

  if (loading && !isMechanic) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader
          title="Attendance"
          description={isManager ? "Today's team attendance overview" : 'Clock in and out for your shift'}
        />
        {isManager && (
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn('h-4 w-4 mr-1.5', refreshing && 'animate-spin')} />
            Refresh
          </Button>
        )}
      </div>

      {/* Mechanic: Clock In/Out Card */}
      {isMechanic && (
        <div className="max-w-md">
          <ClockInOutCard onRefresh={fetchAttendance} />
        </div>
      )}

      {/* Manager/Owner: KPI + Table */}
      {isManager && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard title="Total Records" value={records.length} icon={CalendarDays} iconColor="text-blue-600" iconBg="bg-blue-100 dark:bg-blue-950" />
            <KPICard title="Currently Working" value={clockedIn} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-100 dark:bg-emerald-950" />
            <KPICard title="Completed Shift" value={clockedOut} icon={XCircle} iconColor="text-slate-600" iconBg="bg-slate-100 dark:bg-slate-950" />
            <KPICard title="Hours Logged" value={`${totalHoursToday.toFixed(1)}h`} icon={Timer} iconColor="text-purple-600" iconBg="bg-purple-100 dark:bg-purple-950" />
          </div>

          {records.length === 0 ? (
            <EmptyState
              title="No attendance records today"
              description="No team members have clocked in yet today"
              icon={Clock}
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Member</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => {
                      const statusCfg = STATUS_CONFIG[record.status] || STATUS_CONFIG['absent'];
                      return (
                        <TableRow key={record._id}>
                          <TableCell className="font-medium">{record.mechanicName}</TableCell>
                          <TableCell>{formatTime(record.clockInTime)}</TableCell>
                          <TableCell>{record.clockOutTime ? formatTime(record.clockOutTime) : '—'}</TableCell>
                          <TableCell>
                            {record.totalHours ? `${record.totalHours.toFixed(1)}h` : '—'}
                          </TableCell>
                          <TableCell>
                            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', statusCfg.color)}>
                              {statusCfg.label}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                            {record.notes || '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
