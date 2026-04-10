'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format-utils';
import {
  Search, ClipboardCheck, CheckCircle2, AlertCircle, Clock,
  XCircle, Eye, ChevronDown, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { KPICard } from '@/components/shared/KPICard';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

// ==================== Types ====================

interface InspectionPart {
  inventoryId: string;
  partName: string;
  quantity: number;
  unitPrice: number;
  inStock: boolean;
  supplierInfo?: string;
}

interface InspectionService {
  serviceId?: string;
  name: string;
  description: string;
  price: number;
}

interface Inspection {
  _id: string;
  bookingId: string | { _id: string; customerName?: string; vehicleModel?: string; vehiclePlate?: string };
  vehicleId: string | { _id: string; vehicleModel?: string; vehiclePlate?: string; customerName?: string };
  customerId: string | { _id: string; name?: string; email?: string; phone?: string };
  mechanicId: string | { _id: string; firstName?: string; lastName?: string };
  requiredParts: InspectionPart[];
  requiredServices: InspectionService[];
  additionalNotes: string;
  estimatedCost: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  invoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

type StatusFilter = '' | 'pending' | 'approved' | 'rejected' | 'completed';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  approved: { label: 'Approved', variant: 'default', icon: CheckCircle2 },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
  completed: { label: 'Completed', variant: 'outline', icon: CheckCircle2 },
};

// ==================== Helpers ====================

function getVehicleInfo(inspection: Inspection): string {
  if (typeof inspection.vehicleId === 'object' && inspection.vehicleId) {
    const v = inspection.vehicleId;
    return [v.vehicleModel, v.vehiclePlate].filter(Boolean).join(' - ') || 'Unknown Vehicle';
  }
  return 'N/A';
}

function getCustomerName(inspection: Inspection): string {
  if (typeof inspection.customerId === 'object' && inspection.customerId) {
    return inspection.customerId.name || 'Unknown';
  }
  return 'N/A';
}

function getMechanicName(inspection: Inspection): string {
  if (typeof inspection.mechanicId === 'object' && inspection.mechanicId) {
    const m = inspection.mechanicId;
    return [m.firstName, m.lastName].filter(Boolean).join(' ') || 'Unknown';
  }
  return 'N/A';
}

// ==================== Sub-Components ====================

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function InspectionDetail({ inspection, onClose, onApprove, onReject }: {
  inspection: Inspection;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const partsTotal = inspection.requiredParts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
  const servicesTotal = inspection.requiredServices.reduce((sum, s) => sum + s.price, 0);
  const outOfStockCount = inspection.requiredParts.filter(p => !p.inStock).length;

  return (
    <>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Inspection Report
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-10rem)] mt-4 pr-4">
          <div className="space-y-6">
            {/* Status & Vehicle */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vehicle</p>
                <p className="text-lg font-semibold">{getVehicleInfo(inspection)}</p>
                <p className="text-sm text-muted-foreground mt-0.5">Customer: {getCustomerName(inspection)}</p>
              </div>
              <StatusBadge status={inspection.status} />
            </div>

            <Separator />

            {/* Inspector Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Inspector</p>
                <p className="text-sm font-medium">{getMechanicName(inspection)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm font-medium">{new Date(inspection.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estimated Cost</p>
                <p className="text-sm font-bold text-primary">{formatCurrency(inspection.estimatedCost)}</p>
              </div>
              {inspection.invoiceId && (
                <div>
                  <p className="text-xs text-muted-foreground">Invoice</p>
                  <p className="text-sm font-medium text-blue-600">Linked</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Required Parts */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
                Required Parts ({inspection.requiredParts.length})
                {outOfStockCount > 0 && (
                  <span className="text-xs text-destructive font-normal">{outOfStockCount} out of stock</span>
                )}
              </h4>
              {inspection.requiredParts.length > 0 ? (
                <div className="space-y-2">
                  {inspection.requiredParts.map((part, idx) => (
                    <div key={idx} className={cn(
                      'flex items-center justify-between p-3 rounded-lg border text-sm',
                      !part.inStock && 'border-destructive/30 bg-destructive/5'
                    )}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{part.partName}</p>
                          {!part.inStock && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Out of Stock</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Qty: {part.quantity} x {formatCurrency(part.unitPrice)}</p>
                      </div>
                      <p className="font-semibold">{formatCurrency(part.quantity * part.unitPrice)}</p>
                    </div>
                  ))}
                  <div className="text-right text-sm font-semibold pt-1">Parts Total: {formatCurrency(partsTotal)}</div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No parts required</p>
              )}
            </div>

            <Separator />

            {/* Required Services */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Required Services ({inspection.requiredServices.length})</h4>
              {inspection.requiredServices.length > 0 ? (
                <div className="space-y-2">
                  {inspection.requiredServices.map((service, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-xs text-muted-foreground">{service.description}</p>
                      </div>
                      <p className="font-semibold">{formatCurrency(service.price)}</p>
                    </div>
                  ))}
                  <div className="text-right text-sm font-semibold pt-1">Services Total: {formatCurrency(servicesTotal)}</div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No services listed</p>
              )}
            </div>

            {/* Notes */}
            {inspection.additionalNotes && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{inspection.additionalNotes}</p>
                </div>
              </>
            )}

            {/* Rejection Reason */}
            {inspection.status === 'rejected' && inspection.rejectionReason && (
              <>
                <Separator />
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                  <p className="text-sm font-semibold text-destructive mb-1">Rejection Reason</p>
                  <p className="text-sm">{inspection.rejectionReason}</p>
                </div>
              </>
            )}

            {/* Cost Summary */}
            <Separator />
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Parts</span>
                <span>{formatCurrency(partsTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Services</span>
                <span>{formatCurrency(servicesTotal)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total Estimate</span>
                <span className="text-primary">{formatCurrency(inspection.estimatedCost)}</span>
              </div>
            </div>

            {/* Actions */}
            {inspection.status === 'pending' && (
              <div className="flex gap-3 pt-2">
                <Button className="flex-1" onClick={() => onApprove(inspection._id)}>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Approve
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => setRejectDialogOpen(true)}>
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Inspection</DialogTitle>
            <DialogDescription>Provide a reason for rejecting this inspection report.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!rejectionReason.trim()}
              onClick={() => {
                onReject(inspection._id, rejectionReason.trim());
                setRejectDialogOpen(false);
                setRejectionReason('');
                onClose();
              }}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ==================== Main Page ====================

export default function InspectionsPage() {
  const toast = useToast();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      const res = await api.get('/inspections');
      setInspections(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch inspections:', err);
      toast.error('Failed to load inspections');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/inspections/${id}/approve`);
      toast.success('Inspection approved and invoice generated');
      setIsDetailOpen(false);
      fetchInspections();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to approve inspection';
      toast.error(msg);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      await api.post(`/inspections/${id}/reject`, { rejectionReason: reason });
      toast.success('Inspection rejected');
      fetchInspections();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to reject inspection';
      toast.error(msg);
    }
  };

  // Filter logic
  const filtered = inspections.filter(ins => {
    const matchesStatus = !statusFilter || ins.status === statusFilter;
    if (!matchesStatus) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const vehicle = getVehicleInfo(ins).toLowerCase();
    const customer = getCustomerName(ins).toLowerCase();
    const mechanic = getMechanicName(ins).toLowerCase();
    return vehicle.includes(term) || customer.includes(term) || mechanic.includes(term);
  });

  // KPI counts
  const counts = {
    total: inspections.length,
    pending: inspections.filter(i => i.status === 'pending').length,
    approved: inspections.filter(i => i.status === 'approved').length,
    rejected: inspections.filter(i => i.status === 'rejected').length,
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inspections"
        description="Vehicle inspection reports and diagnostics"
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Inspections" value={counts.total} icon={ClipboardCheck} iconColor="text-blue-600" iconBg="bg-blue-100 dark:bg-blue-950" />
        <KPICard title="Pending Review" value={counts.pending} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-100 dark:bg-amber-950" />
        <KPICard title="Approved" value={counts.approved} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-100 dark:bg-emerald-950" />
        <KPICard title="Rejected" value={counts.rejected} icon={XCircle} iconColor="text-red-600" iconBg="bg-red-100 dark:bg-red-950" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by vehicle, customer, or mechanic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {(['', 'pending', 'approved', 'rejected', 'completed'] as StatusFilter[]).map(status => (
                <Button
                  key={status || 'all'}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status ? STATUS_CONFIG[status]?.label || status : 'All'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No inspections found"
          description={searchTerm || statusFilter ? 'Try adjusting your search or filters' : 'No inspections have been created yet'}
          icon={ClipboardCheck}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Parts</TableHead>
                  <TableHead>Estimate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inspection) => (
                  <TableRow
                    key={inspection._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedInspection(inspection);
                      setIsDetailOpen(true);
                    }}
                  >
                    <TableCell className="font-medium">{getVehicleInfo(inspection)}</TableCell>
                    <TableCell>{getCustomerName(inspection)}</TableCell>
                    <TableCell>{getMechanicName(inspection)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span>{inspection.requiredParts.length}</span>
                        {inspection.requiredParts.some(p => !p.inStock) && (
                          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(inspection.estimatedCost)}</TableCell>
                    <TableCell><StatusBadge status={inspection.status} /></TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(inspection.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        {selectedInspection && (
          <InspectionDetail
            inspection={selectedInspection}
            onClose={() => setIsDetailOpen(false)}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      </Sheet>
    </div>
  );
}
