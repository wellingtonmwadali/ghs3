'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Booking {
  _id: string;
  bookingReference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceType: string;
  vehicleInfo: string;
  preferredDate: string;
  preferredTime?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  source?: string;
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
    serviceType: '',
    vehicleInfo: '',
    preferredDate: '',
    preferredTime: '',
    notes: ''
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
          booking.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        serviceType: '',
        vehicleInfo: '',
        preferredDate: '',
        preferredTime: '',
        notes: ''
      });
      fetchBookings();
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getSourceBadge = (source?: string) => {
    if (source === 'online') {
      return 'bg-purple-100 text-purple-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" text="Loading bookings..." />
      </div>
    );
  }

  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const todayBookings = bookings.filter(b => {
    const bookingDate = new Date(b.preferredDate);
    const today = new Date();
    return bookingDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Booking Management</h1>
        <p className="text-gray-600">Manage customer bookings and appointments</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{confirmedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayBookings}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
            <Button onClick={() => setIsAddDialogOpen(true)} className="ml-auto">
              Add Booking
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking._id}>
                  <TableCell className="font-medium">{booking.bookingReference}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{booking.customerName}</div>
                      <div className="text-xs text-gray-500">{booking.customerPhone}</div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{booking.serviceType.replace('_', ' ')}</TableCell>
                  <TableCell>{booking.vehicleInfo}</TableCell>
                  <TableCell>{new Date(booking.preferredDate).toLocaleDateString()}</TableCell>
                  <TableCell>{booking.preferredTime || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusBadge(booking.status)}`}>
                      {booking.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${getSourceBadge(booking.source)}`}>
                      {booking.source || 'portal'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
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

          {filteredBookings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No bookings found
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Booking Reference</Label>
                  <p className="font-medium">{selectedBooking.bookingReference}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Status</Label>
                  <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusBadge(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </span>
                </div>
                <div>
                  <Label className="text-gray-600">Customer Name</Label>
                  <p className="font-medium">{selectedBooking.customerName}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Email</Label>
                  <p className="font-medium">{selectedBooking.customerEmail}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Phone</Label>
                  <p className="font-medium">{selectedBooking.customerPhone}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Source</Label>
                  <span className={`px-2 py-1 rounded-full text-xs capitalize ${getSourceBadge(selectedBooking.source)}`}>
                    {selectedBooking.source || 'portal'}
                  </span>
                </div>
                <div>
                  <Label className="text-gray-600">Service Type</Label>
                  <p className="font-medium capitalize">{selectedBooking.serviceType.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Vehicle Info</Label>
                  <p className="font-medium">{selectedBooking.vehicleInfo}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Preferred Date</Label>
                  <p className="font-medium">{new Date(selectedBooking.preferredDate).toLocaleDateString()}</p>
                </div>
                {selectedBooking.preferredTime && (
                  <div>
                    <Label className="text-gray-600">Preferred Time</Label>
                    <p className="font-medium">{selectedBooking.preferredTime}</p>
                  </div>
                )}
              </div>
              
              {selectedBooking.notes && (
                <div>
                  <Label className="text-gray-600">Notes</Label>
                  <p className="font-medium border rounded-md p-3 bg-gray-50">{selectedBooking.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {selectedBooking?.status === 'pending' && (
              <Button onClick={() => { handleConfirm(selectedBooking._id); setIsViewDialogOpen(false); }}>
                Confirm Booking
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Booking Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Booking</DialogTitle>
            <DialogDescription>Create a new booking manually</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddBooking}>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email</Label>
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
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleInfo">Vehicle Info</Label>
                  <Input
                    id="vehicleInfo"
                    placeholder="e.g., BMW X5 KBB 123A"
                    value={formData.vehicleInfo}
                    onChange={(e) => setFormData({ ...formData, vehicleInfo: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="serviceType">Service Type</Label>
                <select
                  id="serviceType"
                  value={formData.serviceType}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select service</option>
                  <option value="colour_repair">Colour Repair</option>
                  <option value="clean_shine">Clean & Shine</option>
                  <option value="coat_guard">Coat & Guard</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preferredDate">Preferred Date</Label>
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
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional information..."
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Booking</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
