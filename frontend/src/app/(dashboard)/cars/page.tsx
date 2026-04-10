'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useNotify } from '@/hooks/useNotify';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { JobCardFilterBar, JobCardTable, JobCardStats, JobCardPagination } from '@/components/job-card';
import { fetchJobCards, deleteJobCard } from '@/lib/job-card-api';
import type { Car } from '@/types';

export default function CarsPage() {
  const toast = useToast();
  const notify = useNotify();

  // Data
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [allCars, setAllCars] = useState<Car[]>([]); // for stats (unfiltered active)

  // Filters
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  const [jobType, setJobType] = useState('');
  const [priority, setPriority] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch cars
  const loadCars = useCallback(async () => {
    try {
      setLoading(true);
      const filters: Record<string, any> = { page, limit };

      if (viewMode === 'history') {
        filters.stage = 'completed';
      } else if (stage) {
        filters.stage = stage;
      }
      if (debouncedSearch) filters.search = debouncedSearch;
      if (jobType) filters.jobType = jobType;
      if (priority) filters.priority = priority;
      if (paymentStatus) filters.paymentStatus = paymentStatus;

      const result = await fetchJobCards(filters);
      let fetchedCars = result.cars || [];

      // In active mode with no stage filter, exclude completed + collected on frontend
      if (viewMode === 'active' && !stage) {
        fetchedCars = fetchedCars.filter(
          (c: Car) => c.stage !== 'completed' && c.stage !== 'collected'
        );
      }

      setCars(fetchedCars);
      setTotalPages(result.pagination?.pages || 1);
      setTotal(result.pagination?.total || fetchedCars.length);
    } catch (error) {
      console.error('Failed to fetch cars:', error);
      toast.error('Failed to load job cards');
    } finally {
      setLoading(false);
    }
  }, [viewMode, stage, debouncedSearch, jobType, priority, paymentStatus, page]);

  // Fetch all active cars for stats (on mount)
  const loadAllActiveForStats = useCallback(async () => {
    try {
      const result = await fetchJobCards({ limit: 200 });
      const active = (result.cars || []).filter(
        (c: Car) => c.stage !== 'completed' && c.stage !== 'collected'
      );
      setAllCars(active);
    } catch {
      // stats are non-critical
    }
  }, []);

  useEffect(() => { loadCars(); }, [loadCars]);
  useEffect(() => { loadAllActiveForStats(); }, [loadAllActiveForStats]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [viewMode, stage, debouncedSearch, jobType, priority, paymentStatus]);

  // Handlers
  const handleView = (id: string) => {
    // Navigate to car detail — for now open in same page
    window.location.href = `/cars/${id}`;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job card? This cannot be undone.')) return;
    try {
      await deleteJobCard(id);
      notify.success('Deleted', 'Job card removed successfully');
      loadCars();
      loadAllActiveForStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete job card');
    }
  };

  const handleAddNew = () => {
    window.location.href = '/cars/new';
  };

  if (loading && cars.length === 0) return <PageSkeleton />;

  return (
    <div className="space-y-5 p-6">
      <PageHeader
        title="Job Cards"
        description="Track every vehicle from check-in to collection"
        action={
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Job Card
          </Button>
        }
      />

      {/* KPI Strip */}
      {viewMode === 'active' && allCars.length > 0 && (
        <JobCardStats cars={allCars} />
      )}

      {/* Filters */}
      <JobCardFilterBar
        search={search}
        onSearchChange={setSearch}
        stage={stage}
        onStageChange={setStage}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        jobType={jobType}
        onJobTypeChange={setJobType}
        priority={priority}
        onPriorityChange={setPriority}
        paymentStatus={paymentStatus}
        onPaymentStatusChange={setPaymentStatus}
      />

      {/* Table */}
      <JobCardTable
        cars={cars}
        onView={handleView}
        onDelete={handleDelete}
        onAddNew={handleAddNew}
      />

      {/* Pagination */}
      <JobCardPagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
