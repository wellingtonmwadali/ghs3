import type { CarStage, JobType, Priority, ApprovalStatus } from '@/types';

// ── Stage definitions ──

export const STAGES: CarStage[] = [
  'booked_in', 'waiting_inspection', 'diagnosed', 'awaiting_approval',
  'awaiting_parts', 'in_repair', 'painting', 'detailing',
  'quality_check', 'ready_pickup', 'completed', 'collected'
];

export const ACTIVE_STAGES: CarStage[] = STAGES.filter(
  s => s !== 'completed' && s !== 'collected'
);

export const STAGE_LABELS: Record<CarStage, string> = {
  booked_in: 'Booked In',
  waiting_inspection: 'Waiting Inspection',
  diagnosed: 'Diagnosed',
  awaiting_approval: 'Awaiting Approval',
  awaiting_parts: 'Awaiting Parts',
  in_repair: 'In Repair',
  painting: 'Painting',
  detailing: 'Detailing',
  quality_check: 'Quality Check',
  ready_pickup: 'Ready for Pickup',
  completed: 'Completed',
  collected: 'Collected',
};

export const STAGE_COLORS: Record<CarStage, string> = {
  booked_in: 'bg-slate-100 text-slate-700 border-slate-300',
  waiting_inspection: 'bg-amber-100 text-amber-700 border-amber-300',
  diagnosed: 'bg-purple-100 text-purple-700 border-purple-300',
  awaiting_approval: 'bg-orange-100 text-orange-700 border-orange-300',
  awaiting_parts: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  in_repair: 'bg-blue-100 text-blue-700 border-blue-300',
  painting: 'bg-pink-100 text-pink-700 border-pink-300',
  detailing: 'bg-cyan-100 text-cyan-700 border-cyan-300',
  quality_check: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  ready_pickup: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  completed: 'bg-green-100 text-green-700 border-green-300',
  collected: 'bg-gray-100 text-gray-500 border-gray-300',
};

// ── Job Type ──

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  walk_in: 'Walk-In',
  fleet: 'Fleet',
  insurance: 'Insurance',
  warranty: 'Warranty',
};

export const JOB_TYPE_COLORS: Record<JobType, string> = {
  walk_in: 'bg-blue-50 text-blue-700',
  fleet: 'bg-violet-50 text-violet-700',
  insurance: 'bg-amber-50 text-amber-700',
  warranty: 'bg-emerald-50 text-emerald-700',
};

// ── Priority ──

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
};

// ── Approval ──

export const APPROVAL_LABELS: Record<ApprovalStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const APPROVAL_COLORS: Record<ApprovalStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

// ── Service Type ──

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  colour_repair: 'Colour Repair',
  clean_shine: 'Clean & Shine',
  coat_guard: 'Coat Guard',
};

// ── Helpers ──

export function stageProgress(stage: CarStage): number {
  const idx = STAGES.indexOf(stage);
  if (idx === -1) return 0;
  return Math.round((idx / (STAGES.length - 1)) * 100);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}
