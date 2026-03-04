'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Eye, Edit } from 'lucide-react';

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

export default function CarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState<string>('');
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
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

  useEffect(() => {
    fetchCars();
    fetchMechanics();
  }, [filterStage]);

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

  const fetchCars = async () => {
    try {
      const params = filterStage ? { stage: filterStage } : {};
      const response = await api.get('/cars', { params });
      setCars(response.data.data.cars);
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
      setSelectedCar(response.data.data);
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error('Failed to fetch car details:', error);
    }
  };

  const handleEditCar = (car: Car) => {
    setSelectedCar(car);
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
          expectedCompletionDate: editFormData.expectedCompletionDate || undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsEditDialogOpen(false);
      fetchCars();
      if (isViewDialogOpen) {
        handleViewCar(selectedCar._id);
      }
    } catch (error) {
      console.error('Failed to update car:', error);
      alert('Failed to update car. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading cars...</div>
      </div>
    );
  }

  return (
    <div className="h-full p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Cars</h1>
          <p className="mt-2 text-muted-foreground">
            Manage all vehicles in the system
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Car
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex gap-2">
          {stages.map((stage) => (
            <button
              key={stage.value}
              onClick={() => setFilterStage(stage.value)}
              className={`px-3 py-1.5 text-sm transition-colors ${
                filterStage === stage.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {stage.label}
            </button>
          ))}
        </div>
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
                <TableRow key={car._id}>
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
                  <TableCell>
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

      {/* View Car Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Car Details</DialogTitle>
            <DialogDescription>Complete information about this vehicle</DialogDescription>
          </DialogHeader>
          {selectedCar && (
            <div className="space-y-6">
              {/* Vehicle Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-4">
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

              {/* Service Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Service Information</h3>
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
                  <div>
                    <Label className="text-gray-600">Assigned Mechanic</Label>
                    <p className="font-medium">{selectedCar.assignedMechanicName || '—'}</p>
                  </div>
                </div>
                {selectedCar.services && selectedCar.services.length > 0 && (
                  <div className="mt-3">
                    <Label className="text-gray-600">Services</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedCar.services.map((service, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Issue/Diagnosis */}
              {selectedCar.damageAssessment && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Damage Assessment / Issue</h3>
                  <div className="p-3 bg-gray-50 rounded border">
                    <p className="text-sm">{selectedCar.damageAssessment}</p>
                  </div>
                </div>
              )}

              {/* Parts Required */}
              {selectedCar.partsRequired && selectedCar.partsRequired.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Parts Required</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedCar.partsRequired.map((part, idx) => (
                      <li key={idx} className="text-sm">{part}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Payment Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Payment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Estimated Cost</Label>
                    <p className="font-medium">{formatCurrency(selectedCar.estimatedCost)}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Amount Paid</Label>
                    <p className="font-medium">{formatCurrency(selectedCar.paidAmount)}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Balance</Label>
                    <p className="font-medium text-red-600">
                      {formatCurrency(selectedCar.estimatedCost - selectedCar.paidAmount)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Payment Status</Label>
                    <span className={`px-2 py-1 rounded text-xs ${
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

              {/* Dates */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Timeline</h3>
                <div className="grid grid-cols-2 gap-4">
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

              {/* Photos */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Photos</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Before Photos</Label>
                    {selectedCar.beforePhotos && selectedCar.beforePhotos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {selectedCar.beforePhotos.map((photo, idx) => (
                          <img key={idx} src={photo} alt={`Before ${idx + 1}`} className="w-full h-32 object-cover rounded border" />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">No photos uploaded</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-gray-600">After Photos</Label>
                    {selectedCar.afterPhotos && selectedCar.afterPhotos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {selectedCar.afterPhotos.map((photo, idx) => (
                          <img key={idx} src={photo} alt={`After ${idx + 1}`} className="w-full h-32 object-cover rounded border" />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">No photos uploaded</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedCar.notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Additional Notes</h3>
                  <div className="p-3 bg-gray-50 rounded border">
                    <p className="text-sm">{selectedCar.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              if (selectedCar) {
                setIsViewDialogOpen(false);
                handleEditCar(selectedCar);
              }
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Car
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}

