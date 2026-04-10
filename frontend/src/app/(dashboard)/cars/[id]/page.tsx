'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchJobCard, pauseJobCard, resumeJobCard, approveJobCard, rejectJobCard, updateJobCard, generateInvoiceFromJobCard } from '@/lib/job-card-api';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/ui/toast';
import { formatCurrency, formatDate, formatDateTime, STAGE_LABELS, STAGES } from '@/lib/job-card-utils';
import {
  StageBadge, JobTypeBadge, PriorityBadge, ApprovalBadge, PaymentBadge,
  ServiceTypeBadge, PausedBadge, ComebackBadge,
} from '@/components/job-card/JobCardBadges';
import type { Car, CarStage } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import {
  ArrowLeft, Edit, Printer, Pause, Play, CheckCircle, XCircle,
  Car as CarIcon, User, Wrench, Clock, DollarSign, FileText,
  Shield, Camera, AlertTriangle, History, MapPin, Calendar,
  Phone, Mail, ChevronRight, Package, Hammer, ClipboardList, Receipt
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────

function InfoRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value || '—'}</p>
      </div>
    </div>
  );
}

function SectionCard({ title, description, icon: Icon, children, actions }: {
  title: string;
  description?: string;
  icon?: any;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          {actions}
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ─── Stage Stepper ───────────────────────────────────────

function StageStepper({ currentStage }: { currentStage: CarStage }) {
  const currentIdx = STAGES.indexOf(currentStage);

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center gap-1 min-w-max py-2">
        {STAGES.map((stage, idx) => {
          const isPast = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div key={stage} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`h-2.5 w-2.5 rounded-full ${
                  isCurrent ? 'bg-primary ring-2 ring-primary/30' :
                  isPast ? 'bg-primary/60' : 'bg-muted'
                }`} />
                <span className={`text-[10px] mt-1 whitespace-nowrap ${
                  isCurrent ? 'font-semibold text-primary' :
                  isPast ? 'text-muted-foreground' : 'text-muted-foreground/50'
                }`}>
                  {STAGE_LABELS[stage]}
                </span>
              </div>
              {idx < STAGES.length - 1 && (
                <div className={`h-0.5 w-6 mx-0.5 mt-[-12px] ${
                  isPast ? 'bg-primary/60' : 'bg-muted'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────

export default function JobCardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const toast = useToast();
  const id = params.id as string;

  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog state
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<CarStage | ''>('');

  const userRole = user?.role?.slug;
  const canEdit = ['owner', 'manager', 'mechanic'].includes(userRole || '');
  const canApprove = ['owner', 'manager'].includes(userRole || '');
  const canManageWorkflow = ['owner', 'manager', 'mechanic'].includes(userRole || '');

  const loadCar = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchJobCard(id);
      setCar(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load job card');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadCar(); }, [loadCar]);

  // ── Actions ──

  const handlePause = async () => {
    if (!pauseReason.trim()) return;
    setActionLoading(true);
    try {
      await pauseJobCard(id, pauseReason);
      setPauseDialogOpen(false);
      setPauseReason('');
      await loadCar();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to pause job');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      await resumeJobCard(id);
      await loadCar();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resume job');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproval = async () => {
    setActionLoading(true);
    try {
      if (approvalAction === 'approve') {
        await approveJobCard(id, approvalNotes);
      } else {
        await rejectJobCard(id, approvalNotes);
      }
      setApprovalDialogOpen(false);
      setApprovalNotes('');
      await loadCar();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update approval');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStageChange = async () => {
    if (!selectedStage) return;
    setActionLoading(true);
    try {
      await updateJobCard(id, { stage: selectedStage as CarStage });
      setStageDialogOpen(false);
      setSelectedStage('');
      await loadCar();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update stage');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    setActionLoading(true);
    try {
      const invoice = await generateInvoiceFromJobCard(id);
      toast.success(`Invoice ${(invoice as any)?.invoiceNumber || ''} generated successfully`);
      await loadCar();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate invoice');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Loading / Error ──

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48 lg:col-span-2" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-destructive font-medium">{error || 'Job card not found'}</p>
            <Button variant="outline" onClick={() => router.push('/cars')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Job Cards
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Computed values ──
  const isTerminal = ['completed', 'collected'].includes(car.stage);
  const totalParts = (car.partsUsed?.length || 0) + (car.customerSuppliedParts?.length || 0);
  const totalLabor = car.laborLines?.reduce((sum, l) => sum + l.total, 0) || 0;
  const totalPartsUsedCost = car.partsUsed?.reduce((sum, p) => sum + (p.unitPrice || 0) * p.quantity, 0) || 0;

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/cars')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold tracking-tight">
                {car.jobCardNumber || `Job #${car._id.slice(-6)}`}
              </h1>
              <StageBadge stage={car.stage} />
              {car.isPaused && <PausedBadge />}
              {car.comebackWarning && <ComebackBadge />}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {car.vehicleYear} {car.vehicleMake} {car.vehicleModel} — {car.vehiclePlate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Workflow actions */}
          {canManageWorkflow && !isTerminal && (
            <>
              {car.isPaused ? (
                <Button size="sm" variant="outline" onClick={handleResume} disabled={actionLoading}>
                  <Play className="h-3.5 w-3.5 mr-1.5" /> Resume
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setPauseDialogOpen(true)} disabled={actionLoading}>
                  <Pause className="h-3.5 w-3.5 mr-1.5" /> Pause
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setStageDialogOpen(true)} disabled={actionLoading}>
                <ChevronRight className="h-3.5 w-3.5 mr-1.5" /> Advance Stage
              </Button>
            </>
          )}
          {canApprove && car.approvalStatus === 'pending' && car.stage === 'awaiting_approval' && (
            <>
              <Button size="sm" variant="default" onClick={() => { setApprovalAction('approve'); setApprovalDialogOpen(true); }}>
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => { setApprovalAction('reject'); setApprovalDialogOpen(true); }}>
                <XCircle className="h-3.5 w-3.5 mr-1.5" /> Reject
              </Button>
            </>
          )}
          {canEdit && (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/cars/${id}/edit`}>
                <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
              </Link>
            </Button>
          )}
          {/* Invoice actions */}
          {car.invoiceId ? (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/invoices?highlight=${car.invoiceId}`}>
                <Receipt className="h-3.5 w-3.5 mr-1.5" /> View Invoice
              </Link>
            </Button>
          ) : (
            canApprove && (car.laborLines?.length || car.partsUsed?.length) && (
              <Button size="sm" variant="default" onClick={handleGenerateInvoice} disabled={actionLoading}>
                <Receipt className="h-3.5 w-3.5 mr-1.5" /> Generate Invoice
              </Button>
            )
          )}
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5 mr-1.5" /> Print
          </Button>
        </div>
      </div>

      {/* ── Stage Stepper ── */}
      <Card>
        <CardContent className="pt-4 pb-2">
          <StageStepper currentStage={car.stage} />
          <Progress value={car.statusProgress} className="h-1.5 mt-2" />
          <p className="text-xs text-muted-foreground mt-1 text-right">{car.statusProgress}% complete</p>
        </CardContent>
      </Card>

      {/* ── Quick KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Days in Garage</p>
            <p className="text-2xl font-bold">{car.daysInGarage}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Estimated Cost</p>
            <p className="text-2xl font-bold">{formatCurrency(car.estimatedCost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Actual Cost</p>
            <p className="text-2xl font-bold">{formatCurrency(car.actualCost || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Payment</p>
              <PaymentBadge status={car.paymentStatus} />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(car.paidAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabbed Content ── */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="parts-labor">Parts & Labor</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
        </TabsList>

        {/* ════════ OVERVIEW TAB ════════ */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Customer */}
            <SectionCard title="Customer" icon={User}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <InfoRow label="Name" value={car.customerName} icon={User} />
                <InfoRow label="Gender" value={car.customerGender} />
              </div>
            </SectionCard>

            {/* Vehicle */}
            <SectionCard title="Vehicle" icon={CarIcon}>
              <div className="grid grid-cols-2 gap-x-6">
                <InfoRow label="Make" value={car.vehicleMake} />
                <InfoRow label="Model" value={car.vehicleModel} />
                <InfoRow label="Plate" value={car.vehiclePlate} />
                <InfoRow label="Year" value={car.vehicleYear} />
                <InfoRow label="Color" value={car.vehicleColor} />
                <InfoRow label="Mileage" value={car.vehicleMileage ? `${car.vehicleMileage.toLocaleString()} km` : '—'} />
              </div>
            </SectionCard>

            {/* Service Details */}
            <SectionCard title="Service Details" icon={Wrench}>
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <ServiceTypeBadge serviceType={car.serviceType} />
                  {car.jobType && <JobTypeBadge jobType={car.jobType} />}
                  {car.priority && <PriorityBadge priority={car.priority} />}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Services Requested</p>
                  <div className="flex flex-wrap gap-1.5">
                    {car.services.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
                {car.customServiceDescription && (
                  <InfoRow label="Custom Service" value={`${car.customServiceDescription} — ${formatCurrency(car.customServiceAmount || 0)}`} />
                )}
                <InfoRow label="Bay Number" value={car.bayNumber} icon={MapPin} />
              </div>
            </SectionCard>

            {/* Dates */}
            <SectionCard title="Dates" icon={Calendar}>
              <div className="grid grid-cols-2 gap-x-6">
                <InfoRow label="Check-in" value={formatDate(car.checkInDate)} icon={Calendar} />
                <InfoRow label="Expected Completion" value={formatDate(car.expectedCompletionDate)} icon={Clock} />
                {car.completionDate && (
                  <InfoRow label="Completed" value={formatDate(car.completionDate)} icon={CheckCircle} />
                )}
                <InfoRow label="Days in Garage" value={`${car.daysInGarage} days`} />
              </div>
            </SectionCard>

            {/* Technicians */}
            <SectionCard title="Assigned Team" icon={Wrench}>
              <div className="space-y-2">
                <InfoRow label="Lead Mechanic" value={car.assignedMechanicName || 'Unassigned'} icon={Wrench} />
                {car.assignedTechnicians && car.assignedTechnicians.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Additional Technicians</p>
                    <div className="flex flex-wrap gap-1.5">
                      {car.assignedTechnicians.map((t) => (
                        <Badge key={t.technicianId} variant="secondary" className="text-xs">
                          {t.technicianName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Approval */}
            <SectionCard title="Approval" icon={Shield}>
              <div className="grid grid-cols-2 gap-x-6">
                <div className="py-2">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-1">
                    {car.approvalStatus ? <ApprovalBadge status={car.approvalStatus} /> : <span className="text-sm text-muted-foreground">—</span>}
                  </div>
                </div>
                <InfoRow label="Approved By" value={car.approvedByName} />
                {car.approvedAt && <InfoRow label="Approved At" value={formatDateTime(car.approvedAt)} />}
                {car.approvalNotes && <InfoRow label="Notes" value={car.approvalNotes} />}
              </div>
            </SectionCard>
          </div>

          {/* Notes & Diagnosis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Complaint & Diagnosis" icon={ClipboardList}>
              <div className="space-y-3">
                {car.complaint && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Customer Complaint</p>
                    <p className="text-sm bg-muted/50 rounded-md p-3">{car.complaint}</p>
                  </div>
                )}
                {car.diagnosis && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Diagnosis</p>
                    <p className="text-sm bg-muted/50 rounded-md p-3">{car.diagnosis}</p>
                  </div>
                )}
                {car.damageAssessment && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Damage Assessment</p>
                    <p className="text-sm bg-muted/50 rounded-md p-3">{car.damageAssessment}</p>
                  </div>
                )}
                {!car.complaint && !car.diagnosis && !car.damageAssessment && (
                  <p className="text-sm text-muted-foreground">No notes recorded yet.</p>
                )}
              </div>
            </SectionCard>

            {/* Insurance */}
            <SectionCard title="Insurance" icon={Shield}>
              {car.insuranceClaim?.hasInsurance ? (
                <div className="grid grid-cols-2 gap-x-6">
                  <InfoRow label="Claim Number" value={car.insuranceClaim.claimNumber} />
                  <InfoRow label="Insurer" value={car.insuranceClaim.insurer} />
                  <InfoRow label="Status" value={car.insuranceClaim.status} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No insurance claim</p>
              )}
            </SectionCard>
          </div>

          {/* Additional Notes */}
          {(car.notes || car.inspectionNotes || car.completionNotes) && (
            <SectionCard title="Additional Notes" icon={FileText}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {car.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">General Notes</p>
                    <p className="text-sm bg-muted/50 rounded-md p-3">{car.notes}</p>
                  </div>
                )}
                {car.inspectionNotes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Inspection Notes</p>
                    <p className="text-sm bg-muted/50 rounded-md p-3">{car.inspectionNotes}</p>
                  </div>
                )}
                {car.completionNotes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Completion Notes</p>
                    <p className="text-sm bg-muted/50 rounded-md p-3">{car.completionNotes}</p>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* Warranty */}
          {car.warranty?.hasWarranty && (
            <SectionCard title="Warranty" icon={Shield}>
              <div className="grid grid-cols-2 gap-x-6">
                <InfoRow label="Type" value={car.warranty.warrantyType} />
                <InfoRow label="Expiry" value={formatDate(car.warranty.expiryDate)} />
              </div>
            </SectionCard>
          )}
        </TabsContent>

        {/* ════════ PARTS & LABOR TAB ════════ */}
        <TabsContent value="parts-labor" className="space-y-4">
          {/* Labor Lines */}
          <SectionCard title="Labor" icon={Hammer}
            actions={<span className="text-sm font-medium">{formatCurrency(totalLabor)}</span>}
          >
            {car.laborLines && car.laborLines.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground">Description</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Technician</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Hours</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Rate</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {car.laborLines.map((line, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-2">{line.description}</td>
                        <td className="py-2">{line.technicianName || '—'}</td>
                        <td className="py-2 text-right">{line.hours}</td>
                        <td className="py-2 text-right">{formatCurrency(line.rate)}</td>
                        <td className="py-2 text-right font-medium">{formatCurrency(line.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No labor lines recorded</p>
            )}
          </SectionCard>

          {/* Parts Used (from inventory) */}
          <SectionCard title="Parts Used" icon={Package}
            actions={<span className="text-sm font-medium">{formatCurrency(totalPartsUsedCost)}</span>}
          >
            {car.partsUsed && car.partsUsed.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground">Item</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Qty</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Unit Price</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {car.partsUsed.map((p, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-2">{p.itemName}</td>
                        <td className="py-2 text-right">{p.quantity}</td>
                        <td className="py-2 text-right">{formatCurrency(p.unitPrice || 0)}</td>
                        <td className="py-2 text-right font-medium">{formatCurrency((p.unitPrice || 0) * p.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No parts from inventory</p>
            )}
          </SectionCard>

          {/* Parts Required */}
          {car.partsRequired && car.partsRequired.length > 0 && (
            <SectionCard title="Parts Required" icon={Package}>
              <div className="flex flex-wrap gap-1.5">
                {car.partsRequired.map((p, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">{p}</Badge>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Customer-Supplied Parts */}
          {car.customerSuppliedParts && car.customerSuppliedParts.length > 0 && (
            <SectionCard title="Customer-Supplied Parts" icon={Package}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground">Name</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Qty</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {car.customerSuppliedParts.map((p, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-2">{p.name}</td>
                        <td className="py-2 text-right">{p.quantity}</td>
                        <td className="py-2 text-muted-foreground">{p.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* Cost Summary */}
          <SectionCard title="Cost Summary" icon={DollarSign}
            actions={
              car.invoiceId ? (
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/invoices?highlight=${car.invoiceId}`}>
                    <Receipt className="h-3.5 w-3.5 mr-1.5" /> View Invoice
                  </Link>
                </Button>
              ) : (
                canApprove && (car.laborLines?.length || car.partsUsed?.length) ? (
                  <Button size="sm" onClick={handleGenerateInvoice} disabled={actionLoading}>
                    <Receipt className="h-3.5 w-3.5 mr-1.5" /> Generate Invoice
                  </Button>
                ) : null
              )
            }
          >
            <div className="max-w-sm space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estimated Cost</span>
                <span>{formatCurrency(car.estimatedCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Labor</span>
                <span>{formatCurrency(totalLabor)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Parts (Inventory)</span>
                <span>{formatCurrency(totalPartsUsedCost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm font-semibold">
                <span>Actual Cost</span>
                <span>{formatCurrency(car.actualCost || (totalLabor + totalPartsUsedCost))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paid</span>
                <span className="text-green-600">{formatCurrency(car.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Balance</span>
                <span className={(car.actualCost || 0) - car.paidAmount > 0 ? 'text-destructive' : 'text-green-600'}>
                  {formatCurrency((car.actualCost || 0) - car.paidAmount)}
                </span>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        {/* ════════ TIMELINE TAB ════════ */}
        <TabsContent value="timeline" className="space-y-4">
          {/* Status History */}
          <SectionCard title="Status History" icon={History}>
            {car.statusHistory && car.statusHistory.length > 0 ? (
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-muted" />
                {[...car.statusHistory].reverse().map((entry, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-4 top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <StageBadge stage={entry.stage} />
                        <span className="text-xs text-muted-foreground">{formatDateTime(entry.changedAt)}</span>
                      </div>
                      <p className="text-sm mt-1">
                        Changed by <span className="font-medium">{entry.changedByName}</span>
                      </p>
                      {entry.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No status changes recorded</p>
            )}
          </SectionCard>

          {/* Pause History */}
          {car.pauseHistory && car.pauseHistory.length > 0 && (
            <SectionCard title="Pause History" icon={Pause}>
              <div className="space-y-3">
                {[...car.pauseHistory].reverse().map((entry, idx) => (
                  <div key={idx} className="flex flex-col gap-1 rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Paused by {entry.pausedByName}</span>
                      <Badge variant={entry.resumedAt ? 'secondary' : 'destructive'} className="text-xs">
                        {entry.resumedAt ? 'Resumed' : 'Active'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{entry.reason}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Paused: {formatDateTime(entry.pausedAt)}</span>
                      {entry.resumedAt && <span>Resumed: {formatDateTime(entry.resumedAt)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Audit Info */}
          <SectionCard title="Audit Trail" icon={FileText}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              <InfoRow label="Created By" value={car.createdByName || '—'} />
              <InfoRow label="Created At" value={formatDateTime(car.createdAt)} />
              <InfoRow label="Last Modified By" value={car.lastModifiedByName || '—'} />
              <InfoRow label="Last Modified At" value={formatDateTime(car.lastModifiedAt || car.updatedAt)} />
            </div>
          </SectionCard>
        </TabsContent>

        {/* ════════ PHOTOS TAB ════════ */}
        <TabsContent value="photos" className="space-y-4">
          <SectionCard title="Before Photos" icon={Camera}>
            {car.beforePhotos && car.beforePhotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {car.beforePhotos.map((url, idx) => (
                  <div key={idx} className="aspect-square rounded-lg border overflow-hidden bg-muted">
                    <img src={url} alt={`Before ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No before photos uploaded</p>
            )}
          </SectionCard>

          <SectionCard title="After Photos" icon={Camera}>
            {car.afterPhotos && car.afterPhotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {car.afterPhotos.map((url, idx) => (
                  <div key={idx} className="aspect-square rounded-lg border overflow-hidden bg-muted">
                    <img src={url} alt={`After ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No after photos uploaded</p>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* ═══ DIALOGS ═══ */}

      {/* Pause Dialog */}
      <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pause Job Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Provide a reason for pausing this job.</p>
            <Textarea
              placeholder="e.g., Waiting for customer response..."
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPauseDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePause} disabled={!pauseReason.trim() || actionLoading}>
              {actionLoading ? 'Pausing...' : 'Pause Job'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{approvalAction === 'approve' ? 'Approve' : 'Reject'} Job Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {approvalAction === 'approve'
                ? 'Approve this job to proceed with repairs.'
                : 'Provide a reason for rejecting this job.'}
            </p>
            <Textarea
              placeholder="Notes (optional)..."
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
            <Button
              variant={approvalAction === 'approve' ? 'default' : 'destructive'}
              onClick={handleApproval}
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : approvalAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage Change Dialog */}
      <Dialog open={stageDialogOpen} onOpenChange={setStageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Stage</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Current stage: <strong>{STAGE_LABELS[car.stage]}</strong></p>
            <Select value={selectedStage} onValueChange={(val) => setSelectedStage(val as CarStage)}>
              <SelectTrigger>
                <SelectValue placeholder="Select new stage" />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage} disabled={stage === car.stage}>
                    {STAGE_LABELS[stage]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStageDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleStageChange} disabled={!selectedStage || actionLoading}>
              {actionLoading ? 'Updating...' : 'Update Stage'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
