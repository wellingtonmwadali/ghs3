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
import { Plus, Eye, Edit, Upload, X } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'details' | 'service' | 'payment' | 'photos' | 'inspection' | 'notes'>('details');
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
    expectedCompletionDate: ''
  });
  const [addFormData, setAddFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    vehicleModel: '',
    vehiclePlate: '',
    vehicleYear: '',
    vehicleColor: '',
    serviceType: 'colour_repair',
    services: [] as string[],
    stage: 'waiting_inspection',
    assignedMechanicId: '',
    estimatedCost: '',
    damageAssessment: '',
    notes: '',
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
      setInventoryItems(response.data.data.inventory || []);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
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
      // Fetch inspections and inventory for the selected car
      fetchInspections(car._id);
      fetchInventory();
      // Scroll to the details section
      setTimeout(() => {
        document.getElementById('car-details-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error) {
      console.error('Failed to fetch car details:', error);
    }
  };

  const handleEditCar = (car: Car) => {
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
      expectedCompletionDate: car.expectedCompletionDate ? new Date(car.expectedCompletionDate).toISOString().split('T')[0] : ''
    });
    setIsEditDialogOpen(true);
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
          afterPhotos: afterPhotos
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
          notes: addFormData.notes || undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Reset form and close dialog
      setAddFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: '',
        vehicleModel: '',
        vehiclePlate: '',
        vehicleYear: '',
        vehicleColor: '',
        serviceType: 'colour_repair',
        services: [],
        stage: 'waiting_inspection',
        assignedMechanicId: '',
        estimatedCost: '',
        damageAssessment: '',
        notes: '',
        expectedCompletionDate: ''
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

      {/* Car Details in Tabs - Replaces Dialog */}
      {selectedCar && (
        <Card id="car-details-section" className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedCar.vehicleModel} - {selectedCar.vehiclePlate}</CardTitle>
                <CardDescription>Customer: {selectedCar.customerName}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedCar(null)}>
                  Close
                </Button>
                <Button size="sm" onClick={() => handleEditCar(selectedCar)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Tab Navigation */}
            <div className="border-b mb-6">
              <div className="flex gap-1 overflow-x-auto">
                {[
                  { id: 'details', label: 'Vehicle Details' },
                  { id: 'service', label: 'Service Info' },
                  { id: 'payment', label: 'Payment' },
                  { id: 'photos', label: 'Photos' },
                  { id: 'inspection', label: 'Inspection' },
                  { id: 'notes', label: 'Notes' },
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
            <div className="mt-4">
              {/* Details Tab */}
              {activeTab === 'details' && (
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
              {activeTab === 'service' && (
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
              {activeTab === 'payment' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
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
                </div>
              )}

              {/* Photos Tab */}
              {activeTab === 'photos' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Before Photos</h3>
                    {selectedCar.beforePhotos && selectedCar.beforePhotos.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {selectedCar.beforePhotos.map((photo, idx) => (
                          <img 
                            key={idx} 
                            src={photo} 
                            alt={`Before ${idx + 1}`} 
                            className="w-full h-48 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
                            onClick={() => window.open(photo, '_blank')}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No before photos uploaded</p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">After Photos</h3>
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
                      <p className="text-sm text-gray-500">No after photos uploaded</p>
                    )}
                  </div>
                </div>
              )}

              {/* Inspection Tab */}
              {activeTab === 'inspection' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Vehicle Inspections</h3>
                    {!showInspectionForm && (
                      <Button size="sm" onClick={() => setShowInspectionForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Inspection
                      </Button>
                    )}
                  </div>

                  {/* Create Inspection Form */}
                  {showInspectionForm && (
                    <Card className="bg-gray-50">
                      <CardHeader>
                        <CardTitle className="text-base">New Inspection</CardTitle>
                        <CardDescription>Select required parts and services for this vehicle</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleCreateInspection} className="space-y-4">
                          {/* Required Parts */}
                          <div>
                            <Label className="text-sm font-semibold mb-2 block">Required Parts</Label>
                            <div className="space-y-2">
                              {/* Part Selection */}
                              <div className="flex gap-2">
                                <select
                                  className="flex-1 border rounded-md px-3 py-2 text-sm"
                                  onChange={(e) => {
                                    const part = inventoryItems.find(item => item._id === e.target.value);
                                    if (part) addPartToInspection(part);
                                    e.target.value = '';
                                  }}
                                >
                                  <option value="">Select part from inventory...</option>
                                  {inventoryItems.map(item => (
                                    <option key={item._id} value={item._id}>
                                      {item.name} - {formatCurrency(item.unitPrice)} (Stock: {item.quantity})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Selected Parts List */}
                              {inspectionFormData.requiredParts.length > 0 ? (
                                <div className="space-y-2 mt-3">
                                  {inspectionFormData.requiredParts.map((part, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-white p-3 rounded border">
                                      <div className="flex-1">
                                        <p className="font-medium text-sm">{part.partName}</p>
                                        <p className="text-xs text-gray-500">Unit Price: {formatCurrency(part.unitPrice)}</p>
                                      </div>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={part.quantity}
                                        onChange={(e) => {
                                          const updatedParts = [...inspectionFormData.requiredParts];
                                          updatedParts[idx].quantity = parseInt(e.target.value) || 1;
                                          setInspectionFormData({ ...inspectionFormData, requiredParts: updatedParts });
                                        }}
                                        className="w-20"
                                        placeholder="Qty"
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removePartFromInspection(idx)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                  <div className="bg-blue-50 p-2 rounded text-sm">
                                    <strong>Parts Total:</strong> {formatCurrency(
                                      inspectionFormData.requiredParts.reduce((sum, part) => sum + (part.unitPrice * part.quantity), 0)
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No parts selected</p>
                              )}
                            </div>
                          </div>

                          {/* Required Services */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-sm font-semibold">Required Services</Label>
                              <Button type="button" size="sm" variant="outline" onClick={addServiceToInspection}>
                                <Plus className="h-3 w-3 mr-1" />
                                Add Service
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {inspectionFormData.requiredServices.length > 0 ? (
                                <div className="space-y-2">
                                  {inspectionFormData.requiredServices.map((service, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded border space-y-2">
                                      <div className="flex gap-2">
                                        <Input
                                          placeholder="Service name"
                                          value={service.name}
                                          onChange={(e) => updateServiceInInspection(idx, 'name', e.target.value)}
                                          className="flex-1"
                                          required
                                        />
                                        <Input
                                          type="number"
                                          placeholder="Price"
                                          value={service.price || ''}
                                          onChange={(e) => updateServiceInInspection(idx, 'price', parseFloat(e.target.value) || 0)}
                                          className="w-32"
                                          required
                                        />
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeServiceFromInspection(idx)}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      <Input
                                        placeholder="Description"
                                        value={service.description}
                                        onChange={(e) => updateServiceInInspection(idx, 'description', e.target.value)}
                                      />
                                    </div>
                                  ))}
                                  <div className="bg-blue-50 p-2 rounded text-sm">
                                    <strong>Services Total:</strong> {formatCurrency(
                                      inspectionFormData.requiredServices.reduce((sum, service) => sum + service.price, 0)
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No services added</p>
                              )}
                            </div>
                          </div>

                          {/* Additional Notes */}
                          <div>
                            <Label htmlFor="inspectionNotes" className="text-sm font-semibold">Additional Notes</Label>
                            <textarea
                              id="inspectionNotes"
                              value={inspectionFormData.additionalNotes}
                              onChange={(e) => setInspectionFormData({ ...inspectionFormData, additionalNotes: e.target.value })}
                              className="w-full border rounded-md px-3 py-2 min-h-[80px] mt-2"
                              placeholder="Any additional observations or recommendations..."
                            />
                          </div>

                          {/* Estimated Total */}
                          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-lg">Estimated Total Cost:</span>
                              <span className="text-2xl font-bold text-green-600">
                                {formatCurrency(
                                  inspectionFormData.requiredParts.reduce((sum, part) => sum + (part.unitPrice * part.quantity), 0) +
                                  inspectionFormData.requiredServices.reduce((sum, service) => sum + service.price, 0)
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Form Actions */}
                          <div className="flex gap-2 justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowInspectionForm(false);
                                setInspectionFormData({ requiredParts: [], requiredServices: [], additionalNotes: '' });
                              }}
                            >
                              Cancel
                            </Button>
                            <Button type="submit">Create Inspection</Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {/* Existing Inspections List */}
                  <div>
                    <h4 className="font-semibold mb-3">Inspection History</h4>
                    {inspections.length > 0 ? (
                      <div className="space-y-3">
                        {inspections.map((inspection: any) => (
                          <Card key={inspection._id}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    inspection.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    inspection.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    inspection.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {inspection.status.toUpperCase()}
                                  </span>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Created {formatDate(inspection.createdAt)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold">{formatCurrency(inspection.estimatedCost)}</p>
                                  <p className="text-xs text-gray-500">Estimated Cost</p>
                                </div>
                              </div>

                              {/* Parts */}
                              {inspection.requiredParts?.length > 0 && (
                                <div className="mb-3">
                                  <Label className="text-xs font-semibold text-gray-600">Required Parts:</Label>
                                  <ul className="text-sm mt-1 space-y-1">
                                    {inspection.requiredParts.map((part: any, idx: number) => (
                                      <li key={idx} className="flex justify-between">
                                        <span>{part.partName} x{part.quantity}</span>
                                        <span className="font-medium">{formatCurrency(part.unitPrice * part.quantity)}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Services */}
                              {inspection.requiredServices?.length > 0 && (
                                <div className="mb-3">
                                  <Label className="text-xs font-semibold text-gray-600">Required Services:</Label>
                                  <ul className="text-sm mt-1 space-y-1">
                                    {inspection.requiredServices.map((service: any, idx: number) => (
                                      <li key={idx} className="flex justify-between">
                                        <span>{service.name}</span>
                                        <span className="font-medium">{formatCurrency(service.price)}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Notes */}
                              {inspection.additionalNotes && (
                                <div className="mb-3">
                                  <Label className="text-xs font-semibold text-gray-600">Notes:</Label>
                                  <p className="text-sm text-gray-700 mt-1">{inspection.additionalNotes}</p>
                                </div>
                              )}

                              {/* Actions for pending inspections */}
                              {inspection.status === 'pending' && (
                                <div className="flex gap-2 mt-3 pt-3 border-t">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                      const reason = prompt('Enter rejection reason:');
                                      if (reason) handleRejectInspection(inspection._id, reason);
                                    }}
                                  >
                                    Reject
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleApproveInspection(inspection._id)}
                                  >
                                    Approve
                                  </Button>
                                </div>
                              )}

                              {/* Rejection reason */}
                              {inspection.rejectionReason && (
                                <div className="mt-3 p-2 bg-red-50 rounded text-sm">
                                  <strong>Rejection Reason:</strong> {inspection.rejectionReason}
                                </div>
                              )}

                              {/* Invoice link */}
                              {inspection.invoiceId && (
                                <div className="mt-3 p-2 bg-green-50 rounded text-sm">
                                  <strong>Invoice Generated:</strong> #{inspection.invoiceId}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border">
                        <p className="text-gray-500">No inspections found for this vehicle</p>
                        <p className="text-sm text-gray-400 mt-1">Create the first inspection using the button above</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Damage Assessment / Issue</h3>
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <p className="text-sm whitespace-pre-wrap">{selectedCar.damageAssessment || 'No damage assessment recorded yet'}</p>
                    </div>
                  </div>
                  {selectedCar.notes && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Additional Notes</h3>
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <p className="text-sm whitespace-pre-wrap">{selectedCar.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Car Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Car Details</DialogTitle>
            <DialogDescription>Update vehicle information, service details, and payment status</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCar}>
            <div className="space-y-6">
              {/* Vehicle Info */}
              <div>
                <h3 className="text-md font-semibold mb-3">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vehicleModel">Vehicle Model</Label>
                    <Input
                      id="vehicleModel"
                      value={editFormData.vehicleModel}
                      onChange={(e) => setEditFormData({ ...editFormData, vehicleModel: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehiclePlate">License Plate</Label>
                    <Input
                      id="vehiclePlate"
                      value={editFormData.vehiclePlate}
                      onChange={(e) => setEditFormData({ ...editFormData, vehiclePlate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicleYear">Year</Label>
                    <Input
                      id="vehicleYear"
                      type="number"
                      value={editFormData.vehicleYear}
                      onChange={(e) => setEditFormData({ ...editFormData, vehicleYear: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicleColor">Color</Label>
                    <Input
                      id="vehicleColor"
                      value={editFormData.vehicleColor}
                      onChange={(e) => setEditFormData({ ...editFormData, vehicleColor: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Service Info */}
              <div>
                <h3 className="text-md font-semibold mb-3">Service Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="serviceType">Service Type</Label>
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
                    <Label htmlFor="stage">Current Stage</Label>
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
                </div>
              </div>

              {/* Diagnosis/Issue */}
              <div>
                <h3 className="text-md font-semibold mb-3">Damage Assessment / Diagnosis</h3>
                <div>
                  <Label htmlFor="damageAssessment">Issue Description</Label>
                  <textarea
                    id="damageAssessment"
                    value={editFormData.damageAssessment}
                    onChange={(e) => setEditFormData({ ...editFormData, damageAssessment: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 min-h-[80px]"
                    placeholder="Describe the damage, issues, or required work..."
                  />
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="text-md font-semibold mb-3">Payment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="estimatedCost">Estimated Cost (Ksh)</Label>
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
                    <Label htmlFor="paidAmount">Paid Amount (Ksh)</Label>
                    <Input
                      id="paidAmount"
                      type="number"
                      step="0.01"
                      value={editFormData.paidAmount}
                      onChange={(e) => setEditFormData({ ...editFormData, paidAmount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentStatus">Payment Status</Label>
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
                  <div>
                    <Label htmlFor="expectedCompletionDate">Expected Completion Date</Label>
                    <Input
                      id="expectedCompletionDate"
                      type="date"
                      value={editFormData.expectedCompletionDate}
                      onChange={(e) => setEditFormData({ ...editFormData, expectedCompletionDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-md font-semibold mb-3">Additional Notes</h3>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 min-h-[80px]"
                    placeholder="Any additional notes or comments..."
                  />
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <h3 className="text-md font-semibold mb-3">Vehicle Photos</h3>
                
                {/* Before Photos */}
                <div className="mb-4">
                  <Label htmlFor="beforePhotos" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Before Photos
                  </Label>
                  <input
                    id="beforePhotos"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'before')}
                    className="w-full border rounded-md px-3 py-2 mt-2 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={uploadingImages}
                  />
                  {beforePhotos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {beforePhotos.map((photo, idx) => (
                        <div key={idx} className="relative group">
                          <img 
                            src={photo} 
                            alt={`Before ${idx + 1}`}
                            className="w-full h-20 object-cover rounded border" 
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
                </div>

                {/* After Photos */}
                <div>
                  <Label htmlFor="afterPhotos" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    After Photos
                  </Label>
                  <input
                    id="afterPhotos"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'after')}
                    className="w-full border rounded-md px-3 py-2 mt-2 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={uploadingImages}
                  />
                  {afterPhotos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {afterPhotos.map((photo, idx) => (
                        <div key={idx} className="relative group">
                          <img 
                            src={photo} 
                            alt={`After ${idx + 1}`}
                            className="w-full h-20 object-cover rounded border" 
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
                </div>

                {uploadingImages && (
                  <p className="text-sm text-gray-500 mt-2">Compressing and uploading images...</p>
                )}
              </div>
            </div>

            <DialogFooter className="mt-6">
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Service / Check-In</DialogTitle>
            <DialogDescription>Select existing customer or add new customer and vehicle information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCar}>
            <div className="space-y-6">
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

              {/* Vehicle Information */}
              <div>
                <h3 className="text-md font-semibold mb-3">Vehicle Information</h3>
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

              {/* Service Information */}
              <div>
                <h3 className="text-md font-semibold mb-3">Service Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
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
                  </div>
                  <div>
                    <Label htmlFor="addEstimatedCost">Estimated Cost (Ksh) *</Label>
                    <Input
                      id="addEstimatedCost"
                      type="number"
                      step="0.01"
                      value={addFormData.estimatedCost}
                      onChange={(e) => setAddFormData({ ...addFormData, estimatedCost: e.target.value })}
                      placeholder="50000"
                      required
                    />
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
                  
                  {/* Services */}
                  <div className="col-span-2">
                    <Label>Services to be Performed *</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {['Inspection', 'Repair', 'Painting', 'Detailing', 'Polish', 'Coating'].map((service) => (
                        <label key={service} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={addFormData.services.includes(service)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAddFormData({
                                  ...addFormData,
                                  services: [...addFormData.services, service]
                                });
                              } else {
                                setAddFormData({
                                  ...addFormData,
                                  services: addFormData.services.filter(s => s !== service)
                                });
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{service}</span>
                        </label>
                      ))}
                    </div>
                    {addFormData.services.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">Select at least one service (Standard Service will be used if none selected)</p>
                    )}
                  </div>

                  {/* Stage Selection */}
                  <div>
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

                  {/* Assigned Mechanic */}
                  <div>
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

                  <div>
                    <Label htmlFor="addExpectedCompletionDate">Expected Completion Date</Label>
                    <Input
                      id="addExpectedCompletionDate"
                      type="date"
                      value={addFormData.expectedCompletionDate}
                      onChange={(e) => setAddFormData({ ...addFormData, expectedCompletionDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Damage Assessment */}
              <div>
                <h3 className="text-md font-semibold mb-3">Initial Assessment</h3>
                <div>
                  <Label htmlFor="addDamageAssessment">Damage/Issue Description</Label>
                  <textarea
                    id="addDamageAssessment"
                    value={addFormData.damageAssessment}
                    onChange={(e) => setAddFormData({ ...addFormData, damageAssessment: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 min-h-[80px]"
                    placeholder="Describe visible damage, scratches, dents, or issues noticed during check-in..."
                  />
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <h3 className="text-md font-semibold mb-3">Vehicle Photos (Initial Condition)</h3>
                
                {/* Before Photos */}
                <div className="mb-4">
                  <Label htmlFor="addBeforePhotos" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Check-in Photos
                  </Label>
                  <input
                    id="addBeforePhotos"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'before')}
                    className="w-full border rounded-md px-3 py-2 mt-2 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={uploadingImages}
                  />
                  {beforePhotos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {beforePhotos.map((photo, idx) => (
                        <div key={idx} className="relative group">
                          <img 
                            src={photo} 
                            alt={`Check-in ${idx + 1}`}
                            className="w-full h-20 object-cover rounded border" 
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
                </div>

                {uploadingImages && (
                  <p className="text-sm text-gray-500 mt-2">Compressing and uploading images...</p>
                )}
              </div>

              {/* Additional Notes */}
              <div>
                <h3 className="text-md font-semibold mb-3">Additional Notes</h3>
                <div>
                  <Label htmlFor="addNotes">Notes (Optional)</Label>
                  <textarea
                    id="addNotes"
                    value={addFormData.notes}
                    onChange={(e) => setAddFormData({ ...addFormData, notes: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 min-h-[80px]"
                    placeholder="Any initial observations, special requests, or customer instructions..."
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
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

