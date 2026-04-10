'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/toast';
import { useNotify } from '@/hooks/useNotify';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import {
  CustomerSection,
  VehicleSection,
  ServiceSection,
  JobDetailsSection,
  TechnicianSection,
  InsuranceSection,
  PartsSection,
} from '@/components/job-card/form';
import { createJobCard } from '@/lib/job-card-api';
import api from '@/lib/api';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import type { Customer, Mechanic, AssignedTechnician, CustomerSuppliedPart, ServiceCategory } from '@/types';

interface ServiceType {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
}

// Default completion date: 7 days from now
function defaultCompletionDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

export default function NewJobCardPage() {
  const router = useRouter();
  const toast = useToast();
  const notify = useNotify();

  // Reference data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loadingRef, setLoadingRef] = useState(true);

  // Form state
  const [submitting, setSubmitting] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  const [form, setForm] = useState({
    // Customer
    customerId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    customerGender: '',
    // Vehicle
    vehicleMake: '',
    vehicleModel: '',
    vehiclePlate: '',
    vehicleYear: '',
    vehicleColor: '',
    vehicleMileage: '',
    // Service
    serviceType: 'colour_repair' as ServiceCategory,
    services: [] as string[],
    customServiceDescription: '',
    customServiceAmount: '',
    // Job details
    jobType: 'walk_in',
    priority: 'normal',
    bayNumber: '',
    complaint: '',
    damageAssessment: '',
    notes: '',
    estimatedCost: '',
    expectedCompletionDate: defaultCompletionDate(),
    // Technicians
    assignedMechanicId: '',
    assignedMechanicName: '',
    assignedTechnicians: [] as AssignedTechnician[],
    // Insurance
    insuranceClaim: {
      hasInsurance: false,
      claimNumber: '',
      insurer: '',
      status: '',
    },
    // Parts
    partsRequired: [] as string[],
    customerSuppliedParts: [] as CustomerSuppliedPart[],
  });

  // Fetch reference data on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [custRes, mechRes, settingsRes] = await Promise.all([
          api.get('/customers'),
          api.get('/mechanics'),
          api.get('/settings'),
        ]);
        setCustomers(custRes.data.data?.customers || custRes.data.data || []);
        setMechanics(mechRes.data.data?.mechanics || mechRes.data.data || []);
        const settings = settingsRes.data.data;
        setServiceTypes(settings?.serviceTypes || []);
      } catch (err) {
        console.error('Failed to load reference data:', err);
        toast.error('Failed to load form data. Please refresh.');
      } finally {
        setLoadingRef(false);
      }
    };
    load();
  }, []);

  // Generic field updater
  const handleFieldChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Customer selection
  const handleCustomerSelect = (c: Customer | null) => {
    if (c) {
      setForm((prev) => ({
        ...prev,
        customerId: c._id,
        customerName: c.name,
        customerEmail: c.email || '',
        customerPhone: c.phone || '',
        customerAddress: c.address || '',
        customerGender: c.gender || '',
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        customerId: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: '',
        customerGender: '',
      }));
    }
  };

  // Compute estimated cost from selected services + custom
  const computeEstimatedCost = (): number => {
    let total = 0;
    for (const sName of form.services) {
      const st = serviceTypes.find((s) => s.name === sName);
      if (st) total += st.basePrice;
    }
    if (form.customServiceAmount) total += Number(form.customServiceAmount) || 0;
    return total;
  };

  // Validation
  const validate = (): string | null => {
    if (!isNewCustomer && !form.customerId) return 'Please select a customer';
    if (isNewCustomer && !form.customerName.trim()) return 'Customer name is required';
    if (isNewCustomer && !form.customerPhone.trim()) return 'Customer phone is required';
    if (!form.vehicleModel.trim()) return 'Vehicle model is required';
    if (!form.vehiclePlate.trim()) return 'Vehicle plate is required';
    if (!form.vehicleYear) return 'Vehicle year is required';
    if (!form.vehicleColor.trim()) return 'Vehicle color is required';
    if (form.services.length === 0) return 'Please select at least one service';
    if (!form.expectedCompletionDate) return 'Expected completion date is required';
    return null;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setSubmitting(true);
    try {
      // If new customer, create first
      let customerId = form.customerId;
      let customerName = form.customerName;

      if (isNewCustomer) {
        const custPayload: Record<string, string> = {
          name: form.customerName,
          phone: form.customerPhone,
        };
        if (form.customerEmail) custPayload.email = form.customerEmail;
        if (form.customerGender) custPayload.gender = form.customerGender;
        if (form.customerAddress) custPayload.address = form.customerAddress;

        const custRes = await api.post('/customers', custPayload);
        const newCust = custRes.data.data;
        customerId = newCust._id;
        customerName = newCust.name;
      }

      const estimatedCost =
        Number(form.estimatedCost) || computeEstimatedCost();

      const payload: Record<string, any> = {
        customerId,
        customerName,
        vehicleModel: form.vehicleModel,
        vehiclePlate: form.vehiclePlate.toUpperCase(),
        vehicleYear: Number(form.vehicleYear),
        vehicleColor: form.vehicleColor,
        serviceType: form.serviceType,
        services: form.services,
        estimatedCost,
        expectedCompletionDate: form.expectedCompletionDate,
      };

      // Optional fields
      if (form.vehicleMake) payload.vehicleMake = form.vehicleMake;
      if (form.vehicleMileage) payload.vehicleMileage = Number(form.vehicleMileage);
      if (form.jobType) payload.jobType = form.jobType;
      if (form.priority) payload.priority = form.priority;
      if (form.bayNumber) payload.bayNumber = form.bayNumber;
      if (form.complaint) payload.complaint = form.complaint;
      if (form.damageAssessment) payload.damageAssessment = form.damageAssessment;
      if (form.notes) payload.notes = form.notes;
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

      const created = await createJobCard(payload);
      notify.success('Job Card Created', `Job card ${created.jobCardNumber || ''} created successfully`);
      router.push('/cars');
    } catch (err: any) {
      const msg =
        err.response?.data?.message || 'Failed to create job card';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingRef) return <PageSkeleton />;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="New Job Card"
        description="Register a new vehicle into the workshop"
        action={
          <Button variant="outline" onClick={() => router.push('/cars')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Job Cards
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-8 p-6">
            {/* 1. Customer */}
            <CustomerSection
              customers={customers}
              customerId={form.customerId}
              customerName={form.customerName}
              customerEmail={form.customerEmail}
              customerPhone={form.customerPhone}
              customerAddress={form.customerAddress}
              customerGender={form.customerGender}
              isNewCustomer={isNewCustomer}
              onCustomerSelect={handleCustomerSelect}
              onToggleNewCustomer={setIsNewCustomer}
              onFieldChange={handleFieldChange}
            />

            <Separator />

            {/* 2. Vehicle */}
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

            {/* 3. Service */}
            <ServiceSection
              serviceType={form.serviceType}
              services={form.services}
              customServiceDescription={form.customServiceDescription}
              customServiceAmount={form.customServiceAmount}
              availableServiceTypes={serviceTypes}
              onFieldChange={handleFieldChange}
            />

            <Separator />

            {/* 4. Job Details */}
            <JobDetailsSection
              jobType={form.jobType}
              priority={form.priority}
              bayNumber={form.bayNumber}
              complaint={form.complaint}
              damageAssessment={form.damageAssessment}
              notes={form.notes}
              estimatedCost={
                form.estimatedCost || String(computeEstimatedCost())
              }
              expectedCompletionDate={form.expectedCompletionDate}
              onFieldChange={handleFieldChange}
            />

            <Separator />

            {/* 5. Technicians */}
            <TechnicianSection
              mechanics={mechanics}
              assignedMechanicId={form.assignedMechanicId}
              assignedMechanicName={form.assignedMechanicName}
              assignedTechnicians={form.assignedTechnicians}
              onFieldChange={handleFieldChange}
            />

            <Separator />

            {/* 6. Insurance */}
            <InsuranceSection
              insurance={form.insuranceClaim}
              onFieldChange={handleFieldChange}
            />

            <Separator />

            {/* 7. Parts */}
            <PartsSection
              parts={form.customerSuppliedParts}
              partsRequired={form.partsRequired}
              onFieldChange={handleFieldChange}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/cars')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Job Card
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
