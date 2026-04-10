'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, CalendarDays, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { KPICard } from '@/components/shared/KPICard';

interface Booking {
  _id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerGender?: string;
  vehicleModel: string;
  vehiclePlate?: string;
  requestedServices: string[];
  serviceCategory: 'colour_repair' | 'clean_shine' | 'coat_guard';
  preferredDate: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  photos?: string[];
  description?: string;
  quotationAmount?: number;
  quotationSent: boolean;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function BookingsPage() {
  const toast = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerGender: '' as '' | 'male' | 'female' | 'other',
    vehicleModel: '',
    vehiclePlate: '',
    serviceCategory: '' as '' | 'colour_repair' | 'clean_shine' | 'coat_guard',
    requestedServices: [] as string[],
    description: '',
    preferredDate: '',
    preferredTime: '',
    specialRequest: ''
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data.data.bookings || response.data.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    if (searchTerm) {
      filtered = filtered.filter(
        (booking) =>
          booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((booking) => booking.status === statusFilter);
    }

    setFilteredBookings(filtered);
  };

  const handleView = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsViewDialogOpen(true);
  };

  const handleConfirm = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/${id}/confirm`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBookings();
    } catch (error) {
      console.error('Error confirming booking:', error);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/${id}/cancel`,
        { reason: 'Cancelled by staff' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/${id}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBookings();
    } catch (error) {
      console.error('Error completing booking:', error);
    }
  };

  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings`,
        {
          ...formData,
          source: 'portal'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsAddDialogOpen(false);
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerGender: '' as '' | 'male' | 'female' | 'other',
        vehicleModel: '',
        vehiclePlate: '',
        serviceCategory: '' as '' | 'colour_repair' | 'clean_shine' | 'coat_guard',
        requestedServices: [] as string[],
        description: '',
        preferredDate: '',
        preferredTime: '',
        specialRequest: ''
      });
      fetchBookings();
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  const getStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'destructive' | 'secondary' => {
    const map: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
      pending: 'warning',
      confirmed: 'default',
      cancelled: 'destructive',
      completed: 'success'
    };
    return map[status] || 'secondary';
  };

  if (loading) {
    return <PageSkeleton />;
  }

  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const todayBookings = bookings.filter(b => {
    const bookingDate = new Date(b.preferredDate);
    const today = new Date();
    return bookingDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Booking Management"
        description="Manage customer bookings and appointments"
        action={
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Booking
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Bookings" value={bookings.length} icon={CalendarDays} iconColor="text-primary" iconBg="bg-primary/10" />
        <KPICard title="Pending" value={pendingCount} icon={Clock} iconColor="text-warning" iconBg="bg-warning/10" />
        <KPICard title="Confirmed" value={confirmedCount} icon={CheckCircle2} iconColor="text-info" iconBg="bg-info/10" />
        <KPICard title="Today" value={todayBookings} icon={AlertCircle} iconColor="text-success" iconBg="bg-success/10" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service Category</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{booking.customerName}</div>
                        <div className="text-xs text-muted-foreground">{booking.customerPhone}</div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{booking.serviceCategory.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{booking.vehicleModel}</div>
                        {booking.vehiclePlate && <div className="text-xs text-muted-foreground">{booking.vehiclePlate}</div>}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(booking.preferredDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(booking.status)} className="capitalize">
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={booking.source === 'online' ? 'secondary' : 'outline'} className="capitalize">
                        {booking.source || 'portal'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleView(booking)}>
                          View
                        </Button>
                        {booking.status === 'pending' && (
                          <Button size="sm" variant="default" onClick={() => handleConfirm(booking._id)}>
                            Confirm
                          </Button>
                        )}
                        {booking.status === 'confirmed' && (
                          <Button size="sm" variant="default" onClick={() => handleComplete(booking._id)}>
                            Complete
                          </Button>
                        )}
                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                          <Button size="sm" variant="destructive" onClick={() => handleCancel(booking._id)}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredBookings.length === 0 && (
            <EmptyState icon={CalendarDays} title="No bookings found" description="Try adjusting your search or filters" />
          )}
        </CardContent>
      </Card>

      {/* View Booking Sheet */}
      <Sheet open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Booking Details</SheetTitle>
          </SheetHeader>
          <Separator className="my-4" />
          {selectedBooking && (
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-6 pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Customer Name</Label>
                    <p className="font-medium">{selectedBooking.customerName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge variant={getStatusVariant(selectedBooking.status)} className="capitalize">
                        {selectedBooking.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Phone</Label>
                    <p className="font-medium">{selectedBooking.customerPhone}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedBooking.customerEmail}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Gender</Label>
                    <p className="font-medium capitalize">{selectedBooking.customerGender || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Source</Label>
                    <div className="mt-1">
                      <Badge variant={selectedBooking.source === 'online' ? 'secondary' : 'outline'} className="capitalize">
                        {selectedBooking.source || 'portal'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Service Category</Label>
                    <p className="font-medium capitalize">{selectedBooking.serviceCategory.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Vehicle Model</Label>
                    <p className="font-medium">{selectedBooking.vehicleModel}</p>
                  </div>
                  {selectedBooking.vehiclePlate && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Vehicle Plate</Label>
                      <p className="font-medium">{selectedBooking.vehiclePlate}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-muted-foreground">Preferred Date</Label>
                    <p className="font-medium">{new Date(selectedBooking.preferredDate).toLocaleDateString()}</p>
                  </div>
                  {selectedBooking.requestedServices && selectedBooking.requestedServices.length > 0 && (
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">Requested Services</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedBooking.requestedServices.map((service, idx) => (
                          <Badge key={idx} variant="secondary">{service}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {selectedBooking.description && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <p className="font-medium rounded-md border p-3 bg-muted/50">{selectedBooking.description}</p>
                  </div>
                )}

                {selectedBooking.quotationAmount && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Quotation Amount</Label>
                    <p className="font-medium text-lg text-success">Ksh {selectedBooking.quotationAmount.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
          <Separator className="my-4" />
          <SheetFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {selectedBooking?.status === 'pending' && (
              <Button onClick={() => { handleConfirm(selectedBooking._id); setIsViewDialogOpen(false); }}>
                Confirm Booking
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Add Booking Sheet */}
      <Sheet open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Add New Booking</SheetTitle>
          </SheetHeader>
          <Separator className="my-4" />
          <form onSubmit={handleAddBooking}>
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="space-y-4 pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Customer Name *</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">Email *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerPhone">Phone *</Label>
                    <Input
                      id="customerPhone"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerGender">Gender</Label>
                    <select
                      id="customerGender"
                      value={formData.customerGender || ''}
                      onChange={(e) => setFormData({ ...formData, customerGender: e.target.value as 'male' | 'female' | 'other' | '' })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vehicleModel">Vehicle Model *</Label>
                    <Input
                      id="vehicleModel"
                      placeholder="e.g., BMW X5"
                      value={formData.vehicleModel}
                      onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehiclePlate">Vehicle Plate</Label>
                    <Input
                      id="vehiclePlate"
                      placeholder="e.g., KBB 123A"
                      value={formData.vehiclePlate}
                      onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="serviceCategory">Service Category *</Label>
                  <select
                    id="serviceCategory"
                    value={formData.serviceCategory}
                    onChange={(e) => setFormData({ ...formData, serviceCategory: e.target.value as 'colour_repair' | 'clean_shine' | 'coat_guard' })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    <option value="">Select category</option>
                    <option value="colour_repair">Colour Repair</option>
                    <option value="clean_shine">Clean &amp; Shine</option>
                    <option value="coat_guard">Coat &amp; Guard</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferredDate">Preferred Date *</Label>
                    <Input
                      id="preferredDate"
                      type="date"
                      value={formData.preferredDate}
                      onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="preferredTime">Preferred Time</Label>
                    <Input
                      id="preferredTime"
                      type="time"
                      value={formData.preferredTime}
                      onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Any additional information..."
                  />
                </div>
                <div>
                  <Label htmlFor="specialRequest">Special Request</Label>
                  <Textarea
                    id="specialRequest"
                    value={formData.specialRequest}
                    onChange={(e) => setFormData({ ...formData, specialRequest: e.target.value })}
                    placeholder="Any special requirements or requests..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </ScrollArea>
            <Separator className="my-4" />
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Booking</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
