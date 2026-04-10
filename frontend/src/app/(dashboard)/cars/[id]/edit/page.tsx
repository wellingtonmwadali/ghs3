'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/toast';
import { useNotify } from '@/hooks/useNotify';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import {
  VehicleSection,
  ServiceSection,
  JobDetailsSection,
  TechnicianSection,
  InsuranceSection,
  PartsSection,
} from '@/components/job-card/form';
import { fetchJobCard, updateJobCard } from '@/lib/job-card-api';
import api from '@/lib/api';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import type { Car, Mechanic, AssignedTechnician, CustomerSuppliedPart, ServiceCategory } from '@/types';

interface ServiceType {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
}

export default function EditJobCardPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const toast = useToast();
  const notify = useNotify();

  const [car, setCar] = useState<Car | null>(null);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    vehicleMake: '',
    vehicleModel: '',
    vehiclePlate: '',
    vehicleYear: '',
    vehicleColor: '',
    vehicleMileage: '',
    serviceType: 'colour_repair' as ServiceCategory,
    services: [] as string[],
    customServiceDescription: '',
    customServiceAmount: '',
    jobType: 'walk_in',
    priority: 'normal',
    bayNumber: '',
    complaint: '',
    damageAssessment: '',
    notes: '',
    estimatedCost: '',
    expectedCompletionDate: '',
    assignedMechanicId: '',
    assignedMechanicName: '',
    assignedTechnicians: [] as AssignedTechnician[],
    insuranceClaim: {
      hasInsurance: false,
      claimNumber: '',
      insurer: '',
      status: '',
    },
    partsRequired: [] as string[],
    customerSuppliedParts: [] as CustomerSuppliedPart[],
  });

  // Load car + reference data
  useEffect(() => {
    const load = async () => {
      try {
        const [carData, mechRes, settingsRes] = await Promise.all([
          fetchJobCard(id),
          api.get('/mechanics'),
          api.get('/settings'),
        ]);
        setCar(carData);
        setMechanics(mechRes.data.data?.mechanics || mechRes.data.data || []);
        setServiceTypes(settingsRes.data.data?.serviceTypes || []);

        // Populate form from car
        setForm({
          vehicleMake: carData.vehicleMake || '',
          vehicleModel: carData.vehicleModel || '',
          vehiclePlate: carData.vehiclePlate || '',
          vehicleYear: carData.vehicleYear ? String(carData.vehicleYear) : '',
          vehicleColor: carData.vehicleColor || '',
          vehicleMileage: carData.vehicleMileage ? String(carData.vehicleMileage) : '',
          serviceType: carData.serviceType || 'colour_repair',
          services: carData.services || [],
          customServiceDescription: carData.customServiceDescription || '',
          customServiceAmount: carData.customServiceAmount ? String(carData.customServiceAmount) : '',
          jobType: carData.jobType || 'walk_in',
          priority: carData.priority || 'normal',
          bayNumber: carData.bayNumber || '',
          complaint: carData.complaint || '',
          damageAssessment: carData.damageAssessment || '',
          notes: carData.notes || '',
          estimatedCost: carData.estimatedCost ? String(carData.estimatedCost) : '',
          expectedCompletionDate: carData.expectedCompletionDate
            ? new Date(carData.expectedCompletionDate).toISOString().split('T')[0]
            : '',
          assignedMechanicId: carData.assignedMechanicId || '',
          assignedMechanicName: carData.assignedMechanicName || '',
          assignedTechnicians: carData.assignedTechnicians || [],
          insuranceClaim: {
            hasInsurance: carData.insuranceClaim?.hasInsurance || false,
            claimNumber: carData.insuranceClaim?.claimNumber || '',
            insurer: carData.insuranceClaim?.insurer || '',
            status: carData.insuranceClaim?.status || '',
          },
          partsRequired: carData.partsRequired || [],
          customerSuppliedParts: carData.customerSuppliedParts || [],
        });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load job card');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleFieldChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicleModel.trim()) {
      toast.error('Vehicle model is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {};

      // Only send changed fields
      if (form.vehicleMake) payload.vehicleMake = form.vehicleMake;
      payload.vehicleModel = form.vehicleModel;
      payload.vehiclePlate = form.vehiclePlate.toUpperCase();
      payload.vehicleYear = Number(form.vehicleYear);
      payload.vehicleColor = form.vehicleColor;
      if (form.vehicleMileage) payload.vehicleMileage = Number(form.vehicleMileage);
      payload.serviceType = form.serviceType;
      payload.services = form.services;
      if (form.estimatedCost) payload.estimatedCost = Number(form.estimatedCost);
      if (form.expectedCompletionDate) payload.expectedCompletionDate = form.expectedCompletionDate;
      if (form.complaint) payload.complaint = form.complaint;
      if (form.damageAssessment) payload.damageAssessment = form.damageAssessment;
      if (form.notes) payload.notes = form.notes;
      if (form.jobType) payload.jobType = form.jobType;
      if (form.priority) payload.priority = form.priority;
      if (form.bayNumber) payload.bayNumber = form.bayNumber;
      if (form.customServiceDescription)
        payload.customServiceDescription = form.customServiceDescription;
      if (form.customServiceAmount)
        payload.customServiceAmount = Number(form.customServiceAmount);
      if (form.assignedMechanicId) {
        payload.assignedMechanicId = form.assignedMechanicId;
        payload.assignedMechanicName = form.assignedMechanicName;
      }
      if (form.assignedTechnicians.length > 0) {
        payload.assignedTechnicians = form.assignedTechnicians.map((t) => ({
          technicianId: t.technicianId,
          technicianName: t.technicianName,
        }));
      }
      if (form.insuranceClaim.hasInsurance) {
        payload.insuranceClaim = form.insuranceClaim;
      }
      if (form.partsRequired.length > 0) payload.partsRequired = form.partsRequired;
      if (form.customerSuppliedParts.length > 0) {
        payload.customerSuppliedParts = form.customerSuppliedParts.filter(
          (p) => p.name.trim()
        );
      }

      await updateJobCard(id, payload);
      notify.success('Updated', 'Job card updated successfully');
      router.push(`/cars/${id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update job card');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageSkeleton />;
  if (error || !car) {
    return (
      <div className="p-6">
        <ErrorState message={error || 'Job card not found'} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={`Edit ${car.jobCardNumber || 'Job Card'}`}
        description={`${car.vehiclePlate} — ${car.customerName}`}
        action={
          <Button variant="outline" onClick={() => router.push(`/cars/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Detail
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-8 p-6">
            {/* Customer info (read-only) */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Customer
              </h3>
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <p className="font-medium">{car.customerName}</p>
                <p className="text-muted-foreground">ID: {car.customerId}</p>
              </div>
            </div>

            <Separator />

            <VehicleSection
              vehicleMake={form.vehicleMake}
              vehicleModel={form.vehicleModel}
              vehiclePlate={form.vehiclePlate}
              vehicleYear={form.vehicleYear}
              vehicleColor={form.vehicleColor}
              vehicleMileage={form.vehicleMileage}
              onFieldChange={handleFieldChange}
            />

            <Separator />

            <ServiceSection
              serviceType={form.serviceType}
              services={form.services}
              customServiceDescription={form.customServiceDescription}
              customServiceAmount={form.customServiceAmount}
              availableServiceTypes={serviceTypes}
              onFieldChange={handleFieldChange}
            />

            <Separator />

            <JobDetailsSection
              jobType={form.jobType}
              priority={form.priority}
              bayNumber={form.bayNumber}
              complaint={form.complaint}
              damageAssessment={form.damageAssessment}
              notes={form.notes}
              estimatedCost={form.estimatedCost}
              expectedCompletionDate={form.expectedCompletionDate}
              onFieldChange={handleFieldChange}
            />

            <Separator />

            <TechnicianSection
              mechanics={mechanics}
              assignedMechanicId={form.assignedMechanicId}
              assignedMechanicName={form.assignedMechanicName}
              assignedTechnicians={form.assignedTechnicians}
              onFieldChange={handleFieldChange}
            />

            <Separator />

            <InsuranceSection
              insurance={form.insuranceClaim}
              onFieldChange={handleFieldChange}
            />

            <Separator />

            <PartsSection
              parts={form.customerSuppliedParts}
              partsRequired={form.partsRequired}
              onFieldChange={handleFieldChange}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/cars/${id}`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
