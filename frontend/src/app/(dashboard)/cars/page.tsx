'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency, formatDate, getStageLabel, getStageColor } from '@/lib/utils';
import { Plus, Eye, Edit, Upload, X, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Car {
  _id: string;
  customerId: string;
  customerName: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleYear: number;
  vehicleColor: string;
  stage: string;
  serviceType: string;
  services: string[];
  inspectedBy?: string;
  inspectorName?: string;
  assignedMechanicId?: string;
  assignedMechanicName?: string;
  estimatedCost: number;
  actualCost?: number;
  paidAmount: number;
  paymentStatus: string;
  checkInDate: string;
  expectedCompletionDate: string;
  completionDate?: string;
  daysInGarage: number;
  damageAssessment?: string;
  partsRequired?: string[];
  beforePhotos: string[];
  afterPhotos: string[];
  notes?: string;
  statusProgress: number;
  customServiceDescription?: string;
  inspectionNotes?: string;
  completionNotes?: string;
}

interface Mechanic {
  _id: string;
  firstName: string;
  lastName: string;
  specialization: string;
}

interface ServiceType {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  paymentTerms?: 'full_upfront' | 'deposit' | 'upon_completion' | 'custom';
  depositPercentage?: number;
}

interface Settings {
  serviceTypes: ServiceType[];
}

export default function CarsPage() {
  const toast = useToast();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState<string>('');
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'service' | 'inspection' | 'payment' | 'completed'>('details');
  const [editTab, setEditTab] = useState<'details' | 'service' | 'inspection' | 'payment' | 'completed'>('details');
  const [addTab, setAddTab] = useState<'customer' | 'details' | 'service' | 'inspection' | 'payment' | 'completed'>('customer');
  const [customServiceDescription, setCustomServiceDescription] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [viewMode, setViewMode] = useState<'pending' | 'history'>('pending');
  const [inspections, setInspections] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [inspectionFormData, setInspectionFormData] = useState({
    requiredParts: [] as Array<{ inventoryId: string; partName: string; quantity: number; unitPrice: number }>,
    requiredServices: [] as Array<{ name: string; description: string; price: number }>,
    additionalNotes: ''
  });
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [editFormData, setEditFormData] = useState({
    vehicleModel: '',
    vehiclePlate: '',
    vehicleYear: '',
    vehicleColor: '',
    serviceType: '',
    stage: '',
    assignedMechanicId: '',
    estimatedCost: '',
    paidAmount: '',
    paymentStatus: '',
    damageAssessment: '',
    notes: '',
    expectedCompletionDate: '',
    services: [] as string[],
    customServiceDescription: '',
    inspectionNotes: '',
    completionNotes: ''
  });
  const [addFormData, setAddFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    customerGender: '' as '' | 'male' | 'female' | 'other',
    vehicleModel: '',
    vehiclePlate: '',
    vehicleYear: '',
    vehicleColor: '',
    serviceType: 'colour_repair',
    services: [] as string[],
    customServiceDescription: '',
    customServiceAmount: '',
    stage: 'waiting_inspection',
    assignedMechanicId: '',
    estimatedCost: '',
    damageAssessment: '',
    inspectionNotes: '',
    notes: '',
    completionNotes: '',
    expectedCompletionDate: ''
  });

  useEffect(() => {
    fetchCars();
    fetchMechanics();
    fetchSettings();
    fetchCustomers();
  }, [filterStage, viewMode]);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/customers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCustomers(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(response.data.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const fetchMechanics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/mechanics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMechanics(response.data.data.mechanics || response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch mechanics:', error);
    }
  };

  const fetchInspections = async (vehicleId: string) => {
    try {
      const response = await api.get(`/inspections?vehicleId=${vehicleId}`);
      setInspections(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch inspections:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await api.get('/inventory');
      const items = response.data.data.inventory || [];
      console.log('Fetched inventory items:', items.length);
      setInventoryItems(items);
    } catch (error: any) {
      console.error('Failed to fetch inventory:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to load inventory items');
    }
  };

  const handleCreateInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCar) return;

    try {
      await api.post('/inspections', {
        vehicleId: selectedCar._id,
        customerId: selectedCar.customerId,
        mechanicId: selectedCar.assignedMechanicId,
        bookingId: selectedCar._id, // Using car ID as booking ID for now
        requiredParts: inspectionFormData.requiredParts,
        requiredServices: inspectionFormData.requiredServices,
        additionalNotes: inspectionFormData.additionalNotes
      });
      toast.success('Inspection created successfully!');
      setShowInspectionForm(false);
      setInspectionFormData({
        requiredParts: [],
        requiredServices: [],
        additionalNotes: ''
      });
      fetchInspections(selectedCar._id);
    } catch (error: any) {
      console.error('Failed to create inspection:', error);
      toast.error(error.response?.data?.message || 'Failed to create inspection');
    }
  };

  const handleApproveInspection = async (inspectionId: string) => {
    try {
      await api.post(`/inspections/${inspectionId}/approve`);
      toast.success('Inspection approved successfully!');
      if (selectedCar) fetchInspections(selectedCar._id);
    } catch (error: any) {
      console.error('Failed to approve inspection:', error);
      toast.error(error.response?.data?.message || 'Failed to approve inspection');
    }
  };

  const handleRejectInspection = async (inspectionId: string, reason: string) => {
    try {
      await api.post(`/inspections/${inspectionId}/reject`, { rejectionReason: reason });
      toast.success('Inspection rejected');
      if (selectedCar) fetchInspections(selectedCar._id);
    } catch (error: any) {
      console.error('Failed to reject inspection:', error);
      toast.error(error.response?.data?.message || 'Failed to reject inspection');
    }
  };

  const handleGenerateInvoice = async () => {
    if (!selectedCar) return;
    if (generatingInvoice) return; // Prevent multiple clicks

    try {
      setGeneratingInvoice(true);

      // Check if invoice already exists for this car
      const checkResponse = await api.get(`/invoices?carId=${selectedCar._id}`);
      if (checkResponse.data.data && checkResponse.data.data.length > 0) {
        toast.error('Invoice already exists for this vehicle');
        setGeneratingInvoice(false);
        return;
      }
      // Build items array from selected services
      const items = [];
      
      if (selectedCar.services && selectedCar.services.length > 0) {
        // If services are specified, create line items for each
        selectedCar.services.forEach(serviceName => {
          const serviceType = settings?.serviceTypes?.find((st: any) => st.name === serviceName);
          if (serviceType) {
            items.push({
              description: `${serviceType.name} - ${selectedCar.vehicleModel} (${selectedCar.vehiclePlate})`,
              quantity: 1,
              unitPrice: serviceType.basePrice,
              total: serviceType.basePrice
            });
          } else if (serviceName === 'Other' && selectedCar.customServiceDescription) {
            items.push({
              description: `${selectedCar.customServiceDescription} - ${selectedCar.vehicleModel} (${selectedCar.vehiclePlate})`,
              quantity: 1,
              unitPrice: selectedCar.estimatedCost,
              total: selectedCar.estimatedCost
            });
          }
        });
      }
      
      // Fallback if no services or items
      if (items.length === 0) {
        items.push({
          description: `${selectedCar.serviceType.replace('_', ' ')} - ${selectedCar.vehicleModel} (${selectedCar.vehiclePlate})`,
          quantity: 1,
          unitPrice: selectedCar.estimatedCost,
          total: selectedCar.estimatedCost
        });
      }
      
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const tax = 0; // No tax for now
      const total = subtotal + tax;
      
      const invoiceData = {
        carId: selectedCar._id,
        customerId: selectedCar.customerId,
        items,
        subtotal,
        tax,
        taxRate: 0,
        total,
        paidAmount: selectedCar.paidAmount || 0,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        ...(selectedCar.notes && { notes: selectedCar.notes })
      };
      
      console.log('Sending invoice data:', invoiceData);
      
      const response = await api.post('/invoices', invoiceData);
      toast.success('Invoice generated successfully!');
      console.log('Invoice created:', response.data);
      
      // Refresh the car details to show invoice was created
      if (selectedCar._id) {
        await handleViewCar(selectedCar._id);
      }
    } catch (error: any) {
      console.error('Failed to generate invoice:', error);
      console.error('Error response:', error.response?.data);
      if (error.response?.data?.errors) {
        console.error('Validation errors:', JSON.stringify(error.response.data.errors, null, 2));
      }
      const errorMessage = error.response?.data?.errors?.[0]?.message || 
                          error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to generate invoice';
      toast.error(errorMessage);
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedCar || !paymentAmount) return;

    try {
      const newPaidAmount = selectedCar.paidAmount + parseFloat(paymentAmount);
      let paymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
      
      if (newPaidAmount >= selectedCar.estimatedCost) {
        paymentStatus = 'paid';
      } else if (newPaidAmount > 0) {
        paymentStatus = 'partial';
      }

      await api.put(`/cars/${selectedCar._id}`, {
        paidAmount: newPaidAmount,
        paymentStatus
      });

      toast.success('Payment recorded successfully!');
      setPaymentAmount('');
      setIsRecordingPayment(false);
      
      // Refresh data
      fetchCars();
      if (selectedCar._id) {
        await handleViewCar(selectedCar._id);
      }
    } catch (error: any) {
      console.error('Failed to record payment:', error);
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  };

  const addPartToInspection = (part: any) => {
    const existingPart = inspectionFormData.requiredParts.find(p => p.inventoryId === part._id);
    if (existingPart) {
      toast.error('Part already added');
      return;
    }
    setInspectionFormData({
      ...inspectionFormData,
      requiredParts: [
        ...inspectionFormData.requiredParts,
        {
          inventoryId: part._id,
          partName: part.name,
          quantity: 1,
          unitPrice: part.unitPrice
        }
      ]
    });
  };

  const removePartFromInspection = (index: number) => {
    setInspectionFormData({
      ...inspectionFormData,
      requiredParts: inspectionFormData.requiredParts.filter((_, i) => i !== index)
    });
  };

  const addServiceToInspection = () => {
    setInspectionFormData({
      ...inspectionFormData,
      requiredServices: [
        ...inspectionFormData.requiredServices,
        { name: '', description: '', price: 0 }
      ]
    });
  };

  const updateServiceInInspection = (index: number, field: string, value: any) => {
    const updatedServices = [...inspectionFormData.requiredServices];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    setInspectionFormData({ ...inspectionFormData, requiredServices: updatedServices });
  };

  const removeServiceFromInspection = (index: number) => {
    setInspectionFormData({
      ...inspectionFormData,
      requiredServices: inspectionFormData.requiredServices.filter((_, i) => i !== index)
    });
  };

  // Image compression and upload functions
  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions (max 1200px width/height)
          let width = img.width;
          let height = img.height;
          const maxSize = 1200;
          
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to 0.7 quality JPEG
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'before' | 'after'
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const compressedImages: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i]);
        compressedImages.push(compressed);
      }
      
      if (type === 'before') {
        setBeforePhotos([...beforePhotos, ...compressedImages]);
      } else {
        setAfterPhotos([...afterPhotos, ...compressedImages]);
      }
    } catch (error) {
      console.error('Failed to compress images:', error);
      toast.error('Failed to process images');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (type: 'before' | 'after', index: number) => {
    if (type === 'before') {
      setBeforePhotos(beforePhotos.filter((_, i) => i !== index));
    } else {
      setAfterPhotos(afterPhotos.filter((_, i) => i !== index));
    }
  };

  const fetchCars = async () => {
    try {
      let params: any = {};
      
      if (filterStage) {
        // If a specific stage is selected, filter by that stage
        params.stage = filterStage;
      } else if (viewMode === 'pending') {
        // In pending mode with no specific stage, exclude completed cars
        // We'll filter on the frontend since the API doesn't support "not equal" easily
        params = {};
      }
      
      const response = await api.get('/cars', { params });
      const allCars = response.data.data.cars;
      
      // Filter out completed cars when in pending mode with no specific stage filter
      if (viewMode === 'pending' && !filterStage) {
        setCars(allCars.filter((car: any) => car.stage !== 'completed'));
      } else {
        setCars(allCars);
      }
    } catch (error) {
      console.error('Failed to fetch cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const stages = [
    { value: '', label: 'All Stages' },
    { value: 'waiting_inspection', label: 'Waiting Inspection' },
    { value: 'in_repair', label: 'In Repair' },
    { value: 'painting', label: 'Painting' },
    { value: 'detailing', label: 'Detailing' },
    { value: 'quality_check', label: 'Quality Check' },
    { value: 'ready_pickup', label: 'Ready Pickup' },
    { value: 'completed', label: 'Completed' },
  ];

  const handleViewCar = async (carId: string) => {
    try {
      const response = await api.get(`/cars/${carId}`);
      const car = response.data.data;
      setSelectedCar(car);
      setActiveTab('details');
      setIsViewDialogOpen(true);
      // Fetch inspections and inventory for the selected car
      await fetchInspections(car._id);
      await fetchInventory();
      console.log('Car details dialog opened with inventory:', inventoryItems.length);
    } catch (error: any) {
      console.error('Failed to fetch car details:', error);
      toast.error(error.response?.data?.message || 'Failed to load car details');
    }
  };

  const handleDeleteCar = async (carId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this car? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/cars/${carId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Car deleted successfully');
      fetchCars();
    } catch (error: any) {
      console.error('Error deleting car:', error);
      toast.error(error.response?.data?.message || 'Failed to delete car');
    }
  };

  const handleEditCar = async (car: Car) => {
    setSelectedCar(car);
    setBeforePhotos(car.beforePhotos || []);
    setAfterPhotos(car.afterPhotos || []);
    setEditFormData({
      vehicleModel: car.vehicleModel,
      vehiclePlate: car.vehiclePlate,
      vehicleYear: car.vehicleYear.toString(),
      vehicleColor: car.vehicleColor,
      serviceType: car.serviceType,
      stage: car.stage,
      assignedMechanicId: car.assignedMechanicId || '',
      estimatedCost: car.estimatedCost.toString(),
      paidAmount: car.paidAmount.toString(),
      paymentStatus: car.paymentStatus,
      damageAssessment: car.damageAssessment || '',
      notes: car.notes || '',
      expectedCompletionDate: car.expectedCompletionDate ? new Date(car.expectedCompletionDate).toISOString().split('T')[0] : '',
      services: car.services || [],
      customServiceDescription: car.customServiceDescription || '',
      inspectionNotes: car.inspectionNotes || '',
      completionNotes: car.completionNotes || ''
    });
    setEditTab('details');
    setIsEditDialogOpen(true);
    // Fetch inspections and inventory for editing
    await fetchInspections(car._id);
    await fetchInventory();
  };

  const handleUpdateCar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCar) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/cars/${selectedCar._id}`,
        {
          vehicleModel: editFormData.vehicleModel,
          vehiclePlate: editFormData.vehiclePlate,
          vehicleYear: parseInt(editFormData.vehicleYear),
          vehicleColor: editFormData.vehicleColor,
          serviceType: editFormData.serviceType,
          stage: editFormData.stage,
          assignedMechanicId: editFormData.assignedMechanicId || undefined,
          estimatedCost: parseFloat(editFormData.estimatedCost),
          paidAmount: parseFloat(editFormData.paidAmount),
          paymentStatus: editFormData.paymentStatus,
          damageAssessment: editFormData.damageAssessment || undefined,
          notes: editFormData.notes || undefined,
          expectedCompletionDate: editFormData.expectedCompletionDate || undefined,
          beforePhotos: beforePhotos,
          afterPhotos: afterPhotos,
          services: editFormData.services,
          customServiceDescription: editFormData.customServiceDescription || undefined,
          inspectionNotes: editFormData.inspectionNotes || undefined,
          completionNotes: editFormData.completionNotes || undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsEditDialogOpen(false);
      fetchCars();
      if (selectedCar) {
        handleViewCar(selectedCar._id);
      }
    } catch (error) {
      console.error('Failed to update car:', error);
      toast.error('Failed to update car. Please try again.');
    }
  };

  const handleAddCar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      // Handle customer - use existing or create new
      let customerId = '';
      
      if (!isNewCustomer) {
        // Use selected existing customer
        customerId = selectedCustomerId;
      } else {
        // Create new customer
        try {
          const newCustomerResponse = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/customers`,
            {
              name: addFormData.customerName,
              email: addFormData.customerEmail,
              phone: addFormData.customerPhone,
              address: addFormData.customerAddress || undefined
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          customerId = newCustomerResponse.data.data._id;
        } catch (error: any) {
          // Check if customer already exists
          if (error.response?.status === 409 || error.response?.data?.message?.includes('already exists')) {
            toast.warning('A customer with this email already exists. Please use "Existing Customer" option.');
            return;
          }
          console.error('Customer creation failed:', error);
          throw new Error('Failed to create customer');
        }
      }
      
      // Create the car with service details
      const completionDate = addFormData.expectedCompletionDate || 
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/cars`,
        {
          customerId,
          customerName: addFormData.customerName,
          vehicleModel: addFormData.vehicleModel,
          vehiclePlate: addFormData.vehiclePlate,
          vehicleYear: parseInt(addFormData.vehicleYear),
          vehicleColor: addFormData.vehicleColor,
          serviceType: addFormData.serviceType,
          services: addFormData.services.length > 0 ? addFormData.services : ['Standard Service'],
          stage: addFormData.stage,
          assignedMechanicId: addFormData.assignedMechanicId || undefined,
          estimatedCost: parseFloat(addFormData.estimatedCost),
          expectedCompletionDate: completionDate,
          damageAssessment: addFormData.damageAssessment || undefined,
          beforePhotos: beforePhotos,
          afterPhotos: afterPhotos,
          notes: addFormData.notes || undefined,
          customServiceDescription: addFormData.customServiceDescription || undefined,
          inspectionNotes: addFormData.inspectionNotes || undefined,
          completionNotes: addFormData.completionNotes || undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Reset form and close dialog
      setAddFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: '',
        customerGender: '' as '' | 'male' | 'female' | 'other',
        vehicleModel: '',
        vehiclePlate: '',
        vehicleYear: '',
        vehicleColor: '',
        serviceType: 'colour_repair',
        services: [],
        customServiceDescription: '',
        customServiceAmount: '',
        stage: 'waiting_inspection',
        assignedMechanicId: '',
        estimatedCost: '',
        damageAssessment: '',
        notes: '',
        expectedCompletionDate: '',
        inspectionNotes: '',
        completionNotes: ''
      });
      setIsNewCustomer(true);
      setSelectedCustomerId('');
      setBeforePhotos([]);
      setAfterPhotos([]);
      setIsAddDialogOpen(false);
      fetchCars();
      toast.success('Service check-in completed successfully!');
    } catch (error) {
      console.error('Failed to add car:', error);
      toast.error('Failed to add car. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" text="Loading cars..." />
      </div>
    );
  }

  return (
    <div className="h-full p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Car</h1>
          <p className="mt-2 text-muted-foreground">
            Manage all vehicles in the system
          </p>
          <p className="mt-1 text-sm text-blue-600">
            💡 Customer information is automatically recorded when adding a car
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Car
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        {/* View Mode Toggle */}
        <div className="flex gap-3 mb-4">
          <Button
            onClick={() => {
              setViewMode('pending');
              setFilterStage('');
            }}
            variant={viewMode === 'pending' ? 'default' : 'outline'}
            className="font-semibold"
          >
            Pending Services
          </Button>
          <Button
            onClick={() => {
              setViewMode('history');
              setFilterStage('completed');
            }}
            variant={viewMode === 'history' ? 'default' : 'outline'}
            className="font-semibold"
          >
            History (Completed)
          </Button>
        </div>

        {/* Stage Filters - Only show for Pending mode */}
        {viewMode === 'pending' && (
          <div className="flex gap-2 flex-wrap">
            {stages.filter(s => s.value !== 'completed').map((stage) => (
              <button
                key={stage.value}
                onClick={() => setFilterStage(stage.value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filterStage === stage.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {stage.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Plate</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Mechanic</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.map((car) => (
                <TableRow key={car._id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleViewCar(car._id)}>
                  <TableCell className="font-medium">{car.customerName}</TableCell>
                  <TableCell>{car.vehicleModel}</TableCell>
                  <TableCell className="font-mono text-xs">{car.vehiclePlate}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded ${getStageColor(car.stage)}`}>
                      {getStageLabel(car.stage)}
                    </span>
                  </TableCell>
                  <TableCell className="capitalize">
                    {car.serviceType.replace('_', ' ')}
                  </TableCell>
                  <TableCell className="text-sm">
                    {car.assignedMechanicName || '—'}
                  </TableCell>
                  <TableCell>{formatCurrency(car.estimatedCost)}</TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-1 ${
                        car.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : car.paymentStatus === 'partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {car.paymentStatus}
                    </span>
                  </TableCell>
                  <TableCell>{car.daysInGarage}</TableCell>
                  <TableCell className="text-sm">{formatDate(car.checkInDate)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" onClick={() => handleViewCar(car._id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => handleDeleteCar(car._id, e)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {cars.length === 0 && (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No cars found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Car Details Dialog with Tabs */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{selectedCar?.vehicleModel} - {selectedCar?.vehiclePlate}</DialogTitle>
                <DialogDescription>Customer: {selectedCar?.customerName}</DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                <Button size="sm" onClick={() => {
                  if (selectedCar) {
                    setIsViewDialogOpen(false);
                    handleEditCar(selectedCar);
                  }
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Tab Navigation */}
            <div className="border-b mb-6">
              <div className="flex gap-1 overflow-x-auto">
                {[
                  { id: 'details', label: 'Vehicle Info' },
                  { id: 'service', label: 'Service Info' },
                  { id: 'inspection', label: 'Inspection' },
                  { id: 'payment', label: 'Payment' },
                  { id: 'completed', label: 'Completed' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto mt-4 pr-2">
              {/* Details Tab */}
              {selectedCar && activeTab === 'details' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Vehicle Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-gray-600">Vehicle Model</Label>
                        <p className="font-medium">{selectedCar.vehicleModel}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">License Plate</Label>
                        <p className="font-medium font-mono">{selectedCar.vehiclePlate}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Year</Label>
                        <p className="font-medium">{selectedCar.vehicleYear}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Color</Label>
                        <p className="font-medium">{selectedCar.vehicleColor}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Customer</Label>
                        <p className="font-medium">{selectedCar.customerName}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Days in Garage</Label>
                        <p className="font-medium">{selectedCar.daysInGarage} days</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Timeline</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-gray-600">Check-in Date</Label>
                        <p className="font-medium">{formatDate(selectedCar.checkInDate)}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Expected Completion</Label>
                        <p className="font-medium">{formatDate(selectedCar.expectedCompletionDate)}</p>
                      </div>
                      {selectedCar.completionDate && (
                        <div>
                          <Label className="text-gray-600">Actual Completion</Label>
                          <p className="font-medium">{formatDate(selectedCar.completionDate)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Service Info Tab */}
              {selectedCar && activeTab === 'service' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Service Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-600">Service Type</Label>
                        <p className="font-medium capitalize">{selectedCar.serviceType.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Current Stage</Label>
                        <span className={`px-2 py-1 rounded text-xs ${getStageColor(selectedCar.stage)}`}>
                          {getStageLabel(selectedCar.stage)}
                        </span>
                      </div>
                      <div>
                        <Label className="text-gray-600">Assigned Mechanic</Label>
                        <p className="font-medium">{selectedCar.assignedMechanicName || '—'}</p>
                      </div>
                      {selectedCar.inspectorName && (
                        <div>
                          <Label className="text-gray-600">Inspected By</Label>
                          <p className="font-medium">{selectedCar.inspectorName}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-gray-600">Progress</Label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded">
                            <div 
                              className="h-full bg-blue-500 rounded" 
                              style={{ width: `${selectedCar.statusProgress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{selectedCar.statusProgress}%</span>
                        </div>
                      </div>
                    </div>
                    {selectedCar.services && selectedCar.services.length > 0 && (
                      <div className="mt-4">
                        <Label className="text-gray-600">Services</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedCar.services.map((service, idx) => (
                            <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedCar.partsRequired && selectedCar.partsRequired.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Parts Required</h3>
                      <ul className="list-disc list-inside space-y-2">
                        {selectedCar.partsRequired.map((part, idx) => (
                          <li key={idx} className="text-sm">{part}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Tab */}
              {selectedCar && activeTab === 'payment' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Payment Information</h3>
                    <Button 
                      onClick={handleGenerateInvoice} 
                      size="sm"
                      disabled={generatingInvoice}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {generatingInvoice ? 'Generating...' : 'Generate Invoice'}
                    </Button>
                  </div>
                  <div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <Label className="text-gray-600 text-sm">Estimated Cost</Label>
                        <p className="font-bold text-xl mt-1">{formatCurrency(selectedCar.estimatedCost)}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <Label className="text-gray-600 text-sm">Amount Paid</Label>
                        <p className="font-bold text-xl mt-1 text-green-600">{formatCurrency(selectedCar.paidAmount)}</p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <Label className="text-gray-600 text-sm">Balance</Label>
                        <p className="font-bold text-xl mt-1 text-red-600">
                          {formatCurrency(selectedCar.estimatedCost - selectedCar.paidAmount)}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <Label className="text-gray-600 text-sm">Payment Status</Label>
                        <span className={`inline-block px-3 py-1 rounded mt-2 text-sm font-medium ${
                          selectedCar.paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : selectedCar.paymentStatus === 'partial'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedCar.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Record Payment Section */}
                  {selectedCar.paymentStatus !== 'paid' && (
                    <div className="border-t pt-6">
                      {!isRecordingPayment ? (
                        <Button 
                          onClick={() => setIsRecordingPayment(true)}
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Record Payment
                        </Button>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                          <h4 className="font-semibold">Record New Payment</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="paymentAmount">Payment Amount (Ksh)</Label>
                              <Input
                                id="paymentAmount"
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder="Enter amount"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <div>
                              <Label className="text-gray-600">After Payment</Label>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm">Paid:</span>
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(selectedCar.paidAmount + (parseFloat(paymentAmount) || 0))}
                                </span>
                                <span className="text-sm text-gray-500">
                                  / {formatCurrency(selectedCar.estimatedCost)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={handleRecordPayment}
                              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                            >
                              Save Payment
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setIsRecordingPayment(false);
                                setPaymentAmount('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Inspection Tab */}
              {selectedCar && activeTab === 'inspection' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Check-in Photos</h3>
                    {selectedCar.beforePhotos && selectedCar.beforePhotos.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {selectedCar.beforePhotos.map((photo, idx) => (
                          <img 
                            key={idx} 
                            src={photo} 
                            alt={`Check-in ${idx + 1}`} 
                            className="w-full h-48 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
                            onClick={() => window.open(photo, '_blank')}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No check-in photos uploaded</p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Damage Assessment</h3>
                    {selectedCar.damageAssessment ? (
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <p className="text-sm whitespace-pre-wrap">{selectedCar.damageAssessment}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No damage assessment recorded</p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Initial Inspection Notes</h3>
                    {selectedCar.inspectionNotes ? (
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <p className="text-sm whitespace-pre-wrap">{selectedCar.inspectionNotes}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No inspection notes recorded</p>
                    )}
                  </div>
                </div>
              )}

              {/* Completed Tab */}
              {selectedCar && activeTab === 'completed' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">After/Completion Photos</h3>
                    {selectedCar.afterPhotos && selectedCar.afterPhotos.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {selectedCar.afterPhotos.map((photo, idx) => (
                          <img 
                            key={idx} 
                            src={photo} 
                            alt={`After ${idx + 1}`} 
                            className="w-full h-48 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
                            onClick={() => window.open(photo, '_blank')}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No completion photos uploaded</p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Completion Notes</h3>
                    {selectedCar.completionNotes ? (
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <p className="text-sm whitespace-pre-wrap">{selectedCar.completionNotes}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No completion notes recorded</p>
                    )}
                  </div>
                  {selectedCar.completionDate && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Completion Details</h3>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-gray-600 text-sm">Completed On</Label>
                            <p className="font-medium">{formatDate(selectedCar.completionDate)}</p>
                          </div>
                          <div>
                            <Label className="text-gray-600 text-sm">Status</Label>
                            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                              COMPLETED
                            </span>
                          </div>
                          {selectedCar.assignedMechanicName && (
                            <div>
                              <Label className="text-gray-600 text-sm">Assigned Worker</Label>
                              <p className="font-medium">{selectedCar.assignedMechanicName}</p>
                            </div>
                          )}
                          <div>
                            <Label className="text-gray-600 text-sm">Days in Garage</Label>
                            <p className="font-medium">{selectedCar.daysInGarage} days</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Car Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Car Details</DialogTitle>
            <DialogDescription>Update vehicle information, service details, and payment status</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCar} className="flex-1 overflow-hidden flex flex-col">
            {/* Tab Navigation */}
            <div className="border-b mb-4">
              <div className="flex gap-1 overflow-x-auto">
                {[
                  { id: 'details', label: 'Vehicle Info' },
                  { id: 'service', label: 'Service Info' },
                  { id: 'inspection', label: 'Inspection' },
                  { id: 'payment', label: 'Payment' },
                  { id: 'completed', label: 'Completed' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setEditTab(tab.id as any)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      editTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto pr-2">
              {/* Vehicle Info Tab */}
              {editTab === 'details' && (
                <div className="space-y-4">
                  <h3 className="text-md font-semibold">Vehicle Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vehicleModel">Vehicle Model *</Label>
                      <Input
                        id="vehicleModel"
                        value={editFormData.vehicleModel}
                        onChange={(e) => setEditFormData({ ...editFormData, vehicleModel: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehiclePlate">License Plate *</Label>
                      <Input
                        id="vehiclePlate"
                        value={editFormData.vehiclePlate}
                        onChange={(e) => setEditFormData({ ...editFormData, vehiclePlate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicleYear">Year *</Label>
                      <Input
                        id="vehicleYear"
                        type="number"
                        value={editFormData.vehicleYear}
                        onChange={(e) => setEditFormData({ ...editFormData, vehicleYear: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicleColor">Color *</Label>
                      <Input
                        id="vehicleColor"
                        value={editFormData.vehicleColor}
                        onChange={(e) => setEditFormData({ ...editFormData, vehicleColor: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Service Info Tab */}
              {editTab === 'service' && (
                <div className="space-y-4">
                  <h3 className="text-md font-semibold">Service Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="serviceType">Service Type *</Label>
                      <select
                        id="serviceType"
                        value={editFormData.serviceType}
                        onChange={(e) => setEditFormData({ ...editFormData, serviceType: e.target.value })}
                        className="w-full border rounded-md px-3 py-2"
                        required
                      >
                        <option value="colour_repair">Colour Repair</option>
                        <option value="clean_shine">Clean & Shine</option>
                        <option value="coat_guard">Coat & Guard</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="stage">Current Stage *</Label>
                      <select
                        id="stage"
                        value={editFormData.stage}
                        onChange={(e) => setEditFormData({ ...editFormData, stage: e.target.value })}
                        className="w-full border rounded-md px-3 py-2"
                        required
                      >
                        {stages.filter(s => s.value !== '').map(stage => (
                          <option key={stage.value} value={stage.value}>
                            {stage.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="assignedMechanic">Assigned Mechanic</Label>
                      <select
                        id="assignedMechanic"
                        value={editFormData.assignedMechanicId}
                        onChange={(e) => setEditFormData({ ...editFormData, assignedMechanicId: e.target.value })}
                        className="w-full border rounded-md px-3 py-2"
                      >
                        <option value="">No mechanic assigned</option>
                        {mechanics.map(mechanic => (
                          <option key={mechanic._id} value={mechanic._id}>
                            {mechanic.firstName} {mechanic.lastName} - {mechanic.specialization}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="expectedCompletionDate">Expected Completion Date</Label>
                      <Input
                        id="expectedCompletionDate"
                        type="date"
                        value={editFormData.expectedCompletionDate}
                        onChange={(e) => setEditFormData({ ...editFormData, expectedCompletionDate: e.target.value })}
                      />
                    </div>
                    
                    {/* Services Selection */}
                    <div className="col-span-2">
                      <Label className="mb-3 block font-semibold">Services to Perform</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {settings?.serviceTypes && settings.serviceTypes.length > 0 ? (
                          <>
                            {settings.serviceTypes.map((serviceType: any) => (
                              <label 
                                key={serviceType._id}
                                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={editFormData.services?.includes(serviceType.name) || false}
                                  onChange={(e) => {
                                    const services = editFormData.services || [];
                                    if (e.target.checked) {
                                      setEditFormData({ ...editFormData, services: [...services, serviceType.name] });
                                    } else {
                                      setEditFormData({ ...editFormData, services: services.filter(s => s !== serviceType.name) });
                                    }
                                  }}
                                  className="w-4 h-4"
                                />
                                <div className="flex-1">
                                  <span className="text-sm font-medium">{serviceType.name}</span>
                                  <span className="text-xs text-gray-500 ml-2">({formatCurrency(serviceType.basePrice)})</span>
                                </div>
                              </label>
                            ))}
                            
                            {/* Other Custom Service */}
                            <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border-dashed">
                              <input
                                type="checkbox"
                                checked={editFormData.services?.includes('Other') || false}
                                onChange={(e) => {
                                  const services = editFormData.services || [];
                                  if (e.target.checked) {
                                    setEditFormData({ ...editFormData, services: [...services, 'Other'] });
                                  } else {
                                    setEditFormData({ 
                                      ...editFormData, 
                                      services: services.filter(s => s !== 'Other'),
                                      customServiceDescription: ''
                                    });
                                  }
                                }}
                                className="w-4 h-4"
                              />
                              <div className="flex-1">
                                <span className="text-sm font-medium">Other (Custom Service)</span>
                              </div>
                            </label>
                          </>
                        ) : (
                          <p className="col-span-2 text-sm text-gray-500">Loading services...</p>
                        )}
                      </div>

                      {/* Custom Service Description */}
                      {editFormData.services?.includes('Other') && (
                        <div className="mt-3">
                          <Label htmlFor="editCustomServiceDescription">Describe Custom Service *</Label>
                          <Input
                            id="editCustomServiceDescription"
                            value={editFormData.customServiceDescription || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, customServiceDescription: e.target.value })}
                            placeholder="e.g., Window tinting, Custom paint job..."
                            required
                          />
                        </div>
                      )}

                      {/* Total Cost Display */}
                      {editFormData.services && editFormData.services.length > 0 && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Calculated Total from Services:</span>
                            <span className="text-lg font-bold text-green-700">
                              {formatCurrency(
                                editFormData.services.reduce((total, serviceName) => {
                                  const service = settings?.serviceTypes?.find((st: any) => st.name === serviceName);
                                  return total + (service?.basePrice || 0);
                                }, 0)
                              )}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">You can adjust the final cost in the Payment tab</p>
                        </div>
                      )}

                      {settings?.serviceTypes && settings.serviceTypes.length === 0 && (
                        <p className="text-sm text-gray-500 mt-2">
                          💡 No services configured yet. Please add service types in settings.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Inspection Tab */}
              {editTab === 'inspection' && (
                <div className="space-y-4">
                  <h3 className="text-md font-semibold">Initial Inspection</h3>
                  
                  {/* Check-in Photos */}
                  <div>
                    <Label htmlFor="editBeforePhotos" className="flex items-center gap-2 mb-2">
                      <Upload className="h-4 w-4" />
                      Check-in Photos (Multiple)
                    </Label>
                    <input
                      id="editBeforePhotos"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'before')}
                      className="w-full border rounded-md px-3 py-2 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      disabled={uploadingImages}
                    />
                    {beforePhotos.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-3">
                        {beforePhotos.map((photo, idx) => (
                          <div key={idx} className="relative group">
                            <img 
                              src={photo} 
                              alt={`Check-in ${idx + 1}`}
                              className="w-full h-24 object-cover rounded border" 
                            />
                            <button
                              type="button"
                              onClick={() => removeImage('before', idx)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {uploadingImages && (
                      <p className="text-sm text-gray-500 mt-2">Compressing and uploading images...</p>
                    )}
                  </div>

                  {/* Damage Assessment */}
                  <div>
                    <Label htmlFor="editDamageAssessment">Damage Assessment</Label>
                    <textarea
                      id="editDamageAssessment"
                      value={editFormData.damageAssessment}
                      onChange={(e) => setEditFormData({ ...editFormData, damageAssessment: e.target.value })}
                      className="w-full border rounded-md px-3 py-2 min-h-[120px]"
                      placeholder="Describe visible damage, dents, scratches, mechanical issues..."
                    />
                  </div>

                  {/* Initial Inspection Notes */}
                  <div>
                    <Label htmlFor="editInspectionNotes">Initial Inspection Notes</Label>
                    <textarea
                      id="editInspectionNotes"
                      value={editFormData.inspectionNotes || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, inspectionNotes: e.target.value })}
                      className="w-full border rounded-md px-3 py-2 min-h-[120px]"
                      placeholder="Initial observations, customer complaints, condition notes..."
                    />
                  </div>
                </div>
              )}

              {/* Payment Tab */}
              {editTab === 'payment' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-semibold">Payment Information</h3>
                    {selectedCar && (
                      <Button 
                        type="button" 
                        onClick={handleGenerateInvoice} 
                        size="sm"
                        disabled={generatingInvoice}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {generatingInvoice ? 'Generating...' : 'Generate Invoice'}
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="estimatedCost">Estimated Cost (Ksh) *</Label>
                      <Input
                        id="estimatedCost"
                        type="number"
                        step="0.01"
                        value={editFormData.estimatedCost}
                        onChange={(e) => setEditFormData({ ...editFormData, estimatedCost: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="paidAmount">Paid Amount (Ksh) *</Label>
                      <Input
                        id="paidAmount"
                        type="number"
                        step="0.01"
                        value={editFormData.paidAmount}
                        onChange={(e) => setEditFormData({ ...editFormData, paidAmount: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="paymentStatus">Payment Status *</Label>
                      <select
                        id="paymentStatus"
                        value={editFormData.paymentStatus}
                        onChange={(e) => setEditFormData({ ...editFormData, paymentStatus: e.target.value })}
                        className="w-full border rounded-md px-3 py-2"
                        required
                      >
                        <option value="pending">Pending</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-sm mb-2">Payment Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Estimated Cost:</span>
                        <span className="font-medium">{formatCurrency(parseFloat(editFormData.estimatedCost) || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Paid Amount:</span>
                        <span className="font-medium">{formatCurrency(parseFloat(editFormData.paidAmount) || 0)}</span>
                      </div>
                      <div className="flex justify-between border-t border-blue-300 pt-1 mt-1">
                        <span className="font-semibold">Balance:</span>
                        <span className="font-bold text-lg">
                          {formatCurrency((parseFloat(editFormData.estimatedCost) || 0) - (parseFloat(editFormData.paidAmount) || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Completed Tab */}
              {editTab === 'completed' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mb-4">
                    <p className="text-sm text-blue-800">
                      💡 This section contains post-completion data that will be shown to the customer
                    </p>
                  </div>

                  <h3 className="text-md font-semibold">Completion Documentation</h3>
                  
                  {/* After Photos */}
                  <div>
                    <Label htmlFor="editAfterPhotos" className="flex items-center gap-2 mb-2">
                      <Upload className="h-4 w-4" />
                      After / Completion Photos (Multiple)
                    </Label>
                    <input
                      id="editAfterPhotos"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'after')}
                      className="w-full border rounded-md px-3 py-2 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      disabled={uploadingImages}
                    />
                    {afterPhotos.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-3">
                        {afterPhotos.map((photo, idx) => (
                          <div key={idx} className="relative group">
                            <img 
                              src={photo} 
                              alt={`After ${idx + 1}`}
                              className="w-full h-24 object-cover rounded border" 
                            />
                            <button
                              type="button"
                              onClick={() => removeImage('after', idx)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {uploadingImages && (
                      <p className="text-sm text-gray-500 mt-2">Compressing and uploading images...</p>
                    )}
                  </div>

                  {/* Completion Notes */}
                  <div>
                    <Label htmlFor="editCompletionNotes">Completion Notes</Label>
                    <textarea
                      id="editCompletionNotes"
                      value={editFormData.completionNotes || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, completionNotes: e.target.value })}
                      className="w-full border rounded-md px-3 py-2 min-h-[150px]"
                      placeholder="Describe the work completed, parts replaced, services performed, recommendations..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This will be shown to the customer when work is marked as completed
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="mt-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Car Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add New Service / Check-In</DialogTitle>
            <DialogDescription>Create new car entry with customer and vehicle information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCar} className="flex-1 overflow-hidden flex flex-col">
            {/* Tab Navigation */}
            <div className="border-b mb-4">
              <div className="flex gap-1 overflow-x-auto">
                {[
                  { id: 'customer', label: 'Customer' },
                  { id: 'details', label: 'Vehicle Info' },
                  { id: 'service', label: 'Service Info' },
                  { id: 'inspection', label: 'Inspection' },
                  { id: 'payment', label: 'Payment' },
                  { id: 'completed', label: 'Completed' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAddTab(tab.id as any)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      addTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto pr-2">
              {/* Customer Tab */}
              {addTab === 'customer' && (
                <div className="space-y-4">
                  {/* Customer Selection Toggle */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-4 mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={!isNewCustomer}
                          onChange={() => {
                            setIsNewCustomer(false);
                            setAddFormData({
                              ...addFormData,
                              customerName: '',
                              customerEmail: '',
                              customerPhone: '',
                              customerAddress: ''
                            });
                            setSelectedCustomerId('');
                          }}
                          className="w-4 h-4"
                        />
                        <span className="font-medium">Existing Customer</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={isNewCustomer}
                          onChange={() => {
                            setIsNewCustomer(true);
                            setSelectedCustomerId('');
                            setAddFormData({
                              ...addFormData,
                              customerName: '',
                              customerEmail: '',
                              customerPhone: '',
                              customerAddress: ''
                            });
                          }}
                          className="w-4 h-4"
                        />
                        <span className="font-medium">New Customer</span>
                      </label>
                    </div>

                    {!isNewCustomer && (
                      <div>
                        <Label htmlFor="existingCustomer">Search & Select Customer *</Label>
                        <select
                          id="existingCustomer"
                          value={selectedCustomerId}
                          onChange={(e) => {
                            const customerId = e.target.value;
                            setSelectedCustomerId(customerId);
                            const customer = customers.find(c => c._id === customerId);
                            if (customer) {
                              setAddFormData({
                                ...addFormData,
                                customerName: customer.name,
                                customerEmail: customer.email,
                                customerPhone: customer.phone,
                                customerAddress: customer.address || ''
                              });
                            }
                          }}
                          className="w-full border rounded-md px-3 py-2 mt-2"
                          required={!isNewCustomer}
                        >
                          <option value="">-- Select a customer --</option>
                          {customers.map(customer => (
                            <option key={customer._id} value={customer._id}>
                              {customer.name} - {customer.phone} - {customer.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Customer Information */}
                  <div>
                    <h3 className="text-md font-semibold mb-3">Customer Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customerName">Customer Name *</Label>
                        <Input
                          id="customerName"
                          value={addFormData.customerName}
                          onChange={(e) => setAddFormData({ ...addFormData, customerName: e.target.value })}
                          placeholder="John Doe"
                          required
                          readOnly={!isNewCustomer}
                          className={!isNewCustomer ? 'bg-gray-100 cursor-not-allowed' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="customerEmail">Email *</Label>
                        <Input
                          id="customerEmail"
                          type="email"
                          value={addFormData.customerEmail}
                          onChange={(e) => setAddFormData({ ...addFormData, customerEmail: e.target.value })}
                          placeholder="john@example.com"
                          required
                          readOnly={!isNewCustomer}
                          className={!isNewCustomer ? 'bg-gray-100 cursor-not-allowed' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="customerPhone">Phone Number *</Label>
                        <Input
                          id="customerPhone"
                          value={addFormData.customerPhone}
                          onChange={(e) => setAddFormData({ ...addFormData, customerPhone: e.target.value })}
                          placeholder="+254712345678"
                          required
                          readOnly={!isNewCustomer}
                          className={!isNewCustomer ? 'bg-gray-100 cursor-not-allowed' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="customerGender">Gender</Label>
                        <select
                          id="customerGender"
                          value={addFormData.customerGender || ''}
                          onChange={(e) => setAddFormData({ ...addFormData, customerGender: e.target.value as 'male' | 'female' | 'other' | '' })}
                          className="w-full border rounded-md px-3 py-2"
                          disabled={!isNewCustomer}
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="customerAddress">Address (Optional)</Label>
                        <Input
                          id="customerAddress"
                          value={addFormData.customerAddress}
                          onChange={(e) => setAddFormData({ ...addFormData, customerAddress: e.target.value })}
                          placeholder="Nairobi, Kenya"
                          readOnly={!isNewCustomer}
                          className={!isNewCustomer ? 'bg-gray-100 cursor-not-allowed' : ''}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vehicle Info Tab */}
              {addTab === 'details' && (
                <div className="space-y-4">
                  <h3 className="text-md font-semibold">Vehicle Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="addVehicleModel">Vehicle Model *</Label>
                      <Input
                        id="addVehicleModel"
                        value={addFormData.vehicleModel}
                        onChange={(e) => setAddFormData({ ...addFormData, vehicleModel: e.target.value })}
                        placeholder="Toyota Corolla"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="addVehiclePlate">License Plate *</Label>
                      <Input
                        id="addVehiclePlate"
                        value={addFormData.vehiclePlate}
                        onChange={(e) => setAddFormData({ ...addFormData, vehiclePlate: e.target.value })}
                        placeholder="KBB123A"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="addVehicleYear">Year *</Label>
                      <Input
                        id="addVehicleYear"
                        type="number"
                        value={addFormData.vehicleYear}
                        onChange={(e) => setAddFormData({ ...addFormData, vehicleYear: e.target.value })}
                        placeholder="2020"
                        min="1900"
                        max="2030"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="addVehicleColor">Color *</Label>
                      <Input
                        id="addVehicleColor"
                        value={addFormData.vehicleColor}
                        onChange={(e) => setAddFormData({ ...addFormData, vehicleColor: e.target.value })}
                        placeholder="Red"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Service Info Tab */}
              {addTab === 'service' && (
                <div className="space-y-4">
                  <h3 className="text-md font-semibold">Service Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* <div>
                      <Label htmlFor="addServiceType">Service Type *</Label>
                      <select
                        id="addServiceType"
                        value={addFormData.serviceType}
                        onChange={(e) => {
                          const selectedType = e.target.value;
                          const serviceType = settings?.serviceTypes?.find(
                            st => st.name.toLowerCase().replace(' & ', '_').replace(' ', '_') === selectedType
                          );
                          setAddFormData({ 
                            ...addFormData, 
                            serviceType: selectedType,
                            estimatedCost: serviceType ? serviceType.basePrice.toString() : addFormData.estimatedCost
                          });
                        }}
                        className="w-full border rounded-md px-3 py-2"
                        required
                      >
                        <option value="colour_repair">Colour Repair</option>
                        <option value="clean_shine">Clean & Shine</option>
                        <option value="coat_guard">Coat & Guard</option>
                      </select>
                    </div> */}
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label htmlFor="addStage">Initial Stage *</Label>
                        <select
                          id="addStage"
                          value={addFormData.stage}
                          onChange={(e) => setAddFormData({ ...addFormData, stage: e.target.value })}
                          className="w-full border rounded-md px-3 py-2"
                          required
                        >
                          {stages.filter(s => s.value !== '' && s.value !== 'completed').map(stage => (
                            <option key={stage.value} value={stage.value}>
                              {stage.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Default: Waiting Inspection</p>
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="addAssignedMechanic">Assign Mechanic (Optional)</Label>
                        <select
                          id="addAssignedMechanic"
                          value={addFormData.assignedMechanicId}
                          onChange={(e) => setAddFormData({ ...addFormData, assignedMechanicId: e.target.value })}
                          className="w-full border rounded-md px-3 py-2"
                        >
                          <option value="">No mechanic assigned</option>
                          {mechanics.map(mechanic => (
                            <option key={mechanic._id} value={mechanic._id}>
                              {mechanic.firstName} {mechanic.lastName} - {mechanic.specialization}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Auto-assign if left empty</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="addExpectedCompletionDate">Expected Completion Date</Label>
                      <Input
                        id="addExpectedCompletionDate"
                        type="date"
                        value={addFormData.expectedCompletionDate}
                        onChange={(e) => setAddFormData({ ...addFormData, expectedCompletionDate: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Services Selection */}
                  <div>
                    <Label>Services to be Performed *</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {settings?.serviceTypes && settings.serviceTypes.length > 0 ? (
                        <>
                          {settings.serviceTypes.map((serviceType) => (
                            <label key={serviceType.id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={addFormData.services.includes(serviceType.name)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setAddFormData({
                                      ...addFormData,
                                      services: [...addFormData.services, serviceType.name]
                                    });
                                  } else {
                                    setAddFormData({
                                      ...addFormData,
                                      services: addFormData.services.filter(s => s !== serviceType.name)
                                    });
                                  }
                                }}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">{serviceType.name} ({formatCurrency(serviceType.basePrice)})</span>
                            </label>
                          ))}
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={addFormData.services.includes('Other')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAddFormData({
                                    ...addFormData,
                                    services: [...addFormData.services, 'Other']
                                  });
                                } else {
                                  setAddFormData({
                                    ...addFormData,
                                    services: addFormData.services.filter(s => s !== 'Other'),
                                    customServiceDescription: ''
                                  });
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <span className="text-sm font-medium">Other (Custom Service)</span>
                          </label>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500 col-span-2">Loading services...</p>
                      )}
                    </div>

                    {/* Custom Service Description */}
                    {addFormData.services.includes('Other') && (
                      <div className="mt-3 space-y-3">
                        <div>
                          <Label htmlFor="customServiceDesc">Describe Custom Service *</Label>
                          <Input
                            id="customServiceDesc"
                            value={addFormData.customServiceDescription}
                            onChange={(e) => setAddFormData({ ...addFormData, customServiceDescription: e.target.value })}
                            placeholder="Describe the custom service needed..."
                            required={addFormData.services.includes('Other')}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="customServiceAmount">Payment Amount (Ksh) *</Label>
                          <Input
                            id="customServiceAmount"
                            type="number"
                            step="0.01"
                            value={addFormData.customServiceAmount || ''}
                            onChange={(e) => setAddFormData({ ...addFormData, customServiceAmount: e.target.value })}
                            placeholder="Enter amount for custom service"
                            required={addFormData.services.includes('Other')}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}

                    {/* Total Cost Calculation */}
                    {addFormData.services.length > 0 && settings?.serviceTypes && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold">Total Services Cost:</span>
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(
                              addFormData.services.reduce((total, serviceName) => {
                                const service = settings.serviceTypes.find(st => st.name === serviceName);
                                return total + (service?.basePrice || 0);
                              }, 0)
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Automatically calculated from selected services</p>
                      </div>
                    )}

                    {addFormData.services.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">Select at least one service</p>
                    )}
                  </div>
                </div>
              )}

              {/* Inspection Tab */}
              {addTab === 'inspection' && (
                <div className="space-y-4">
                  <h3 className="text-md font-semibold">Vehicle Inspection</h3>
                  
                  {/* Check-in Photos */}
                  <div>
                    <Label htmlFor="addBeforePhotos" className="flex items-center gap-2 mb-2">
                      <Upload className="h-4 w-4" />
                      Upload Check-in Photos (Multiple)
                    </Label>
                    <input
                      id="addBeforePhotos"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'before')}
                      className="w-full border rounded-md px-3 py-2 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      disabled={uploadingImages}
                    />
                    {beforePhotos.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-3">
                        {beforePhotos.map((photo, idx) => (
                          <div key={idx} className="relative group">
                            <img 
                              src={photo} 
                              alt={`Check-in ${idx + 1}`}
                              className="w-full h-24 object-cover rounded border" 
                            />
                            <button
                              type="button"
                              onClick={() => removeImage('before', idx)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {uploadingImages && (
                      <p className="text-sm text-gray-500 mt-2">Compressing and uploading images...</p>
                    )}
                  </div>

                  {/* Damage Assessment */}
                  <div>
                    <Label htmlFor="addDamageAssessment">Damage/Issue Description</Label>
                    <textarea
                      id="addDamageAssessment"
                      value={addFormData.damageAssessment}
                      onChange={(e) => setAddFormData({ ...addFormData, damageAssessment: e.target.value })}
                      className="w-full border rounded-md px-3 py-2 min-h-[120px]"
                      placeholder="Describe visible damage, scratches, dents, or issues noticed during check-in..."
                    />
                  </div>

                  {/* Initial Notes */}
                  <div>
                    <Label htmlFor="addNotes">Initial Inspection Notes</Label>
                    <textarea
                      id="addNotes"
                      value={addFormData.notes}
                      onChange={(e) => setAddFormData({ ...addFormData, notes: e.target.value })}
                      className="w-full border rounded-md px-3 py-2 min-h-[120px]"
                      placeholder="Any initial observations, special requests, or customer instructions..."
                    />
                  </div>
                </div>
              )}

              {/* Payment Tab */}
              {addTab === 'payment' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-md font-semibold">Payment Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="addEstimatedCost">Estimated Cost (Ksh) *</Label>
                      <Input
                        id="addEstimatedCost"
                        type="number"
                        step="0.01"
                        value={addFormData.estimatedCost || (settings?.serviceTypes && addFormData.services.length > 0 ? 
                          addFormData.services.reduce((total, serviceName) => {
                            const service = settings.serviceTypes.find(st => st.name === serviceName);
                            return total + (service?.basePrice || 0);
                          }, 0) : 0)}
                        onChange={(e) => setAddFormData({ ...addFormData, estimatedCost: e.target.value })}
                        placeholder="50000"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Auto-calculated from selected services. You can adjust if needed.</p>
                      {settings?.serviceTypes?.find(
                        st => st.name.toLowerCase().replace(' & ', '_').replace(' ', '_') === addFormData.serviceType
                      )?.paymentTerms === 'deposit' && (
                        <p className="text-sm text-blue-600 mt-1">
                          💡 Deposit required: {settings?.serviceTypes?.find(
                            st => st.name.toLowerCase().replace(' & ', '_').replace(' ', '_') === addFormData.serviceType
                          )?.depositPercentage}% (Ksh {Math.round((parseFloat(addFormData.estimatedCost) || 0) * (settings?.serviceTypes?.find(
                            st => st.name.toLowerCase().replace(' & ', '_').replace(' ', '_') === addFormData.serviceType
                          )?.depositPercentage || 0) / 100).toLocaleString()})
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Payment Summary */}
                  {(addFormData.estimatedCost || addFormData.services.length > 0) && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-sm mb-2">Payment Summary</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Service Type:</span>
                          <span className="font-medium capitalize">{addFormData.serviceType.replace('_', ' ')}</span>
                        </div>
                        {addFormData.services.length > 0 && (
                          <div className="flex justify-between">
                            <span>Selected Services:</span>
                            <span className="font-medium">{addFormData.services.length}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Estimated Cost:</span>
                          <span className="font-medium">{formatCurrency(parseFloat(addFormData.estimatedCost) || 
                            (settings?.serviceTypes && addFormData.services.length > 0 ? 
                              addFormData.services.reduce((total, serviceName) => {
                                const service = settings.serviceTypes.find(st => st.name === serviceName);
                                return total + (service?.basePrice || 0);
                              }, 0) : 0))}</span>
                        </div>
                        {settings?.serviceTypes?.find(
                          st => st.name.toLowerCase().replace(' & ', '_').replace(' ', '_') === addFormData.serviceType
                        )?.paymentTerms === 'deposit' && (
                          <div className="flex justify-between border-t border-blue-300 pt-1 mt-1">
                            <span className="font-semibold">Deposit Due:</span>
                            <span className="font-bold text-lg">
                              {formatCurrency(Math.round((parseFloat(addFormData.estimatedCost) || 0) * (settings?.serviceTypes?.find(
                                st => st.name.toLowerCase().replace(' & ', '_').replace(' ', '_') === addFormData.serviceType
                              )?.depositPercentage || 0) / 100))}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      💡 <strong>Tip:</strong> Invoice can be generated after the car is checked in from the Payment tab.
                    </p>
                  </div>
                </div>
              )}

              {/* Completed Tab */}
              {addTab === 'completed' && (
                <div className="space-y-4">
                  <h3 className="text-md font-semibold">Completion Information</h3>
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
                    <p className="text-sm text-blue-800">
                      ℹ️ This section will be filled when the work is completed. Leave empty for now or fill in if work is already done.
                    </p>
                  </div>

                  {/* After Photos */}
                  <div>
                    <Label htmlFor="addAfterPhotos" className="flex items-center gap-2 mb-2">
                      <Upload className="h-4 w-4" />
                      Upload After/Completion Photos (Multiple)
                    </Label>
                    <input
                      id="addAfterPhotos"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'after')}
                      className="w-full border rounded-md px-3 py-2 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      disabled={uploadingImages}
                    />
                    {afterPhotos.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-3">
                        {afterPhotos.map((photo, idx) => (
                          <div key={idx} className="relative group">
                            <img 
                              src={photo} 
                              alt={`After ${idx + 1}`}
                              className="w-full h-24 object-cover rounded border" 
                            />
                            <button
                              type="button"
                              onClick={() => removeImage('after', idx)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {uploadingImages && (
                      <p className="text-sm text-gray-500 mt-2">Compressing and uploading images...</p>
                    )}
                  </div>

                  {/* Completion Notes */}
                  <div>
                    <Label htmlFor="completionNotes">Completion Notes</Label>
                    <textarea
                      id="completionNotes"
                      value={addFormData.completionNotes}
                      onChange={(e) => setAddFormData({ ...addFormData, completionNotes: e.target.value })}
                      className="w-full border rounded-md px-3 py-2 min-h-[150px]"
                      placeholder="Describe what was done, parts replaced, issues resolved, etc..."
                    />
                    <p className="text-xs text-gray-500 mt-1">This will be shown to the customer when the work is marked as completed</p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="mt-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => {
                setIsAddDialogOpen(false);
                setAddTab('customer');
              }}>
                Cancel
              </Button>
              <Button type="submit">
                <Plus className="h-4 w-4 mr-2" />
                Add Car
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

