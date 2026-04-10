'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, Eye, Mail, Phone, MapPin, Download, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import api from '@/lib/api';
import * as XLSX from 'xlsx';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  notes?: string;
  serviceHistory?: {
    date: Date;
    carId: string;
    serviceDetails: string;
    cost: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export default function CustomersPage() {
  const toast = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '' as '' | 'male' | 'female' | 'other',
    address: '',
    notes: ''
  });
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterMinVisits, setFilterMinVisits] = useState<string>('');
  const [filterMaxVisits, setFilterMaxVisits] = useState<string>('');
  const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportDateRange, setExportDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [isPromoMode, setIsPromoMode] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [selectedPromoMessage, setSelectedPromoMessage] = useState<string>('');
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchCustomers();
    fetchSettings();
  }, [searchQuery, filterGender, filterMinVisits, filterMaxVisits, dateSort]);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(response.data.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (filterGender && filterGender !== 'all') params.gender = filterGender;
      if (filterMinVisits) params.minVisits = filterMinVisits;
      if (filterMaxVisits) params.maxVisits = filterMaxVisits;
      params.sort = dateSort === 'newest' ? '-createdAt' : 'createdAt';
      
      const response = await api.get('/customers', { params });
      setCustomers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/customers', formData);
      setShowAddDialog(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      console.error('Failed to add customer:', error);
    }
  };

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    
    try {
      await api.put(`/customers/${selectedCustomer._id}`, formData);
      setShowEditDialog(false);
      resetForm();
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to update customer:', error);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to delete customer:', error);
    }
  };

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      gender: customer.gender || '',
      address: customer.address || '',
      notes: customer.notes || ''
    });
    setShowEditDialog(true);
  };

  const openViewDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowViewDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      gender: '',
      address: '',
      notes: ''
    });
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalSpent = (customer: Customer) => {
    if (!customer.serviceHistory || customer.serviceHistory.length === 0) return 0;
    return customer.serviceHistory.reduce((sum, service) => sum + service.cost, 0);
  };

  const handleExportToExcel = async () => {
    try {
      const params: any = {};
      if (exportDateRange.startDate) params.startDate = exportDateRange.startDate;
      if (exportDateRange.endDate) params.endDate = exportDateRange.endDate;
      
      const response = await api.get('/customers', { params });
      const customersData = response.data.data;

      // Prepare data for Excel
      const excelData = customersData.map((customer: Customer) => ({
        'Name': customer.name,
        'Email': customer.email,
        'Phone': customer.phone,
        'Gender': customer.gender ? customer.gender.charAt(0).toUpperCase() + customer.gender.slice(1) : 'N/A',
        'Address': customer.address || 'N/A',
        'Total Spent (Ksh)': getTotalSpent(customer),
        'Visit Count': customer.serviceHistory?.length || 0,
        'First Visit': customer.createdAt ? formatDate(customer.createdAt) : 'N/A',
        'Last Service': customer.serviceHistory && customer.serviceHistory.length > 0 
          ? formatDate(customer.serviceHistory[customer.serviceHistory.length - 1].date) 
          : 'N/A'
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, // Name
        { wch: 25 }, // Email
        { wch: 15 }, // Phone
        { wch: 10 }, // Gender
        { wch: 30 }, // Address
        { wch: 15 }, // Total Spent
        { wch: 12 }, // Visit Count
        { wch: 15 }, // First Visit
        { wch: 15 }  // Last Service
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Customers');

      // Generate filename with date range
      const filename = exportDateRange.startDate && exportDateRange.endDate
        ? `customers_${exportDateRange.startDate}_to_${exportDateRange.endDate}.xlsx`
        : `customers_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);
      
      setShowExportDialog(false);
      setExportDateRange({ startDate: '', endDate: '' });
    } catch (error) {
      console.error('Failed to export customers:', error);
      toast.error('Failed to export customers to Excel');
    }
  };

  const handleToggleCustomerSelection = (customerId: string) => {
    setSelectedCustomerIds(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSelectAllCustomers = () => {
    if (selectedCustomerIds.length === customers.length) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(customers.map(c => c._id));
    }
  };

  const handleSendPromo = async () => {
    if (selectedCustomerIds.length === 0) {
      toast.warning('Please select at least one customer');
      return;
    }
    if (!selectedPromoMessage) {
      toast.warning('Please select a promotional message');
      return;
    }

    try {
      await api.post('/customers/send-promo', {
        customerIds: selectedCustomerIds,
        messageId: selectedPromoMessage
      });
      toast.success(`Promotional message sent to ${selectedCustomerIds.length} customer(s)`);
      setIsPromoMode(false);
      setSelectedCustomerIds([]);
      setSelectedPromoMessage('');
    } catch (error) {
      console.error('Failed to send promotional message:', error);
      toast.error('Failed to send promotional message');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Customers"
        description="Manage customer information and history"
        action={
          <div className="flex gap-2">
          {isPromoMode ? (
            <>
              <div className="flex items-center gap-2 mr-4">
                <Label>Message:</Label>
                <select
                  className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={selectedPromoMessage}
                  onChange={(e) => setSelectedPromoMessage(e.target.value)}
                >
                  <option value="">Select promotional message</option>
                  {settings?.promotionalMessages?.map((msg: any) => (
                    <option key={msg.id} value={msg.id}>{msg.title}</option>
                  ))}
                </select>
              </div>
              <Button
                onClick={handleSendPromo}
                disabled={selectedCustomerIds.length === 0 || !selectedPromoMessage}
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                Send to {selectedCustomerIds.length} selected
              </Button>
              <Button
                onClick={() => {
                  setIsPromoMode(false);
                  setSelectedCustomerIds([]);
                  setSelectedPromoMessage('');
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => setIsPromoMode(true)}
                variant="outline"
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                Send Promo
              </Button>
              <Button
                onClick={() => setShowExportDialog(true)}
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export to Excel
              </Button>
              <Button
                onClick={() => {
                  resetForm();
                  setShowAddDialog(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Customer
              </Button>
            </>
          )}
          </div>
        }
      />

      <Card className="p-6">
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Filters Row */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Gender:</Label>
              <select
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
              >
                <option value="all">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-sm">Visits:</Label>
              <Input
                type="number"
                placeholder="Min"
                value={filterMinVisits}
                onChange={(e) => setFilterMinVisits(e.target.value)}
                className="w-20 h-9"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="Max"
                value={filterMaxVisits}
                onChange={(e) => setFilterMaxVisits(e.target.value)}
                className="w-20 h-9"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-sm">Sort:</Label>
              <div className="flex gap-1">
                <Button
                  variant={dateSort === 'newest' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateSort('newest')}
                  className="h-9"
                >
                  Newest
                </Button>
                <Button
                  variant={dateSort === 'oldest' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateSort('oldest')}
                  className="h-9"
                >
                  Oldest
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {isPromoMode && (
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedCustomerIds.length === customers.length && customers.length > 0}
                      onChange={handleSelectAllCustomers}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </TableHead>
                )}
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Services</TableHead>
                <TableHead>Joined</TableHead>
                {!isPromoMode && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isPromoMode ? 7 : 7} className="text-center py-8 text-muted-foreground">
                    Loading customers...
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isPromoMode ? 7 : 7} className="text-center text-muted-foreground">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer._id}>
                    {isPromoMode && (
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedCustomerIds.includes(customer._id)}
                          onChange={() => handleToggleCustomerSelection(customer._id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{formatCurrency(getTotalSpent(customer))}</TableCell>
                    <TableCell>{customer.serviceHistory?.length || 0}</TableCell>
                    <TableCell>{formatDate(customer.createdAt)}</TableCell>
                    {!isPromoMode && (
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewDialog(customer)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(customer)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCustomer(customer._id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add Customer Sheet */}
      <Sheet open={showAddDialog} onOpenChange={(open) => { if (!open) { setShowAddDialog(false); resetForm(); } }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add New Customer</SheetTitle>
          </SheetHeader>
          <Separator className="my-4" />
          <form onSubmit={handleAddCustomer}>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-4 pr-2">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as '' | 'male' | 'female' | 'other' })}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
            </ScrollArea>
            <Separator className="my-4" />
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit">Add Customer</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Edit Customer Sheet */}
      <Sheet open={showEditDialog && !!selectedCustomer} onOpenChange={(open) => { if (!open) { setShowEditDialog(false); setSelectedCustomer(null); resetForm(); } }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Customer</SheetTitle>
          </SheetHeader>
          <Separator className="my-4" />
          <form onSubmit={handleEditCustomer}>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-4 pr-2">
                <div>
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone *</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-gender">Gender</Label>
                  <select
                    id="edit-gender"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as '' | 'male' | 'female' | 'other' })}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit-address">Address</Label>
                  <Input
                    id="edit-address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Input
                    id="edit-notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
            </ScrollArea>
            <Separator className="my-4" />
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => { setShowEditDialog(false); setSelectedCustomer(null); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* View Customer Sheet */}
      <Sheet open={showViewDialog && !!selectedCustomer} onOpenChange={(open) => { if (!open) { setShowViewDialog(false); setSelectedCustomer(null); } }}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Customer Details</SheetTitle>
          </SheetHeader>
          <Separator className="my-4" />
          {selectedCustomer && (
            <ScrollArea className="h-[calc(100vh-160px)]">
              <div>
                <h3 className="text-lg font-semibold">{selectedCustomer.name}</h3>
                <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {selectedCustomer.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {selectedCustomer.phone}
                  </div>
                  {selectedCustomer.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {selectedCustomer.address}
                    </div>
                  )}
                </div>
              </div>

              {selectedCustomer.notes && (
                <div>
                  <h4 className="font-medium">Notes</h4>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedCustomer.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-semibold">{formatCurrency(getTotalSpent(selectedCustomer))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Services</p>
                  <p className="text-2xl font-semibold">{selectedCustomer.serviceHistory?.length || 0}</p>
                </div>
              </div>

              <div>
                <h4 className="mb-3 font-medium">Service History</h4>
                {selectedCustomer.serviceHistory && selectedCustomer.serviceHistory.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCustomer.serviceHistory.map((service, index) => (
                      <div key={index} className="rounded-lg border p-3">
                        <div className="flex justify-between">
                          <p className="font-medium">{service.serviceDetails}</p>
                          <p className="font-semibold">{formatCurrency(service.cost)}</p>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatDate(service.date)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No service history yet</p>
                )}
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* Export to Excel Sheet */}
      <Sheet open={showExportDialog} onOpenChange={(open) => { if (!open) { setShowExportDialog(false); setExportDateRange({ startDate: '', endDate: '' }); } }}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Export Customers to Excel</SheetTitle>
          </SheetHeader>
          <Separator className="my-4" />
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a date range to filter customers by their registration date. Leave empty to export all customers.
            </p>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={exportDateRange.startDate}
                onChange={(e) => setExportDateRange({ ...exportDateRange, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={exportDateRange.endDate}
                onChange={(e) => setExportDateRange({ ...exportDateRange, endDate: e.target.value })}
              />
            </div>
          </div>
          <Separator className="my-4" />
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowExportDialog(false);
                setExportDateRange({ startDate: '', endDate: '' });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleExportToExcel}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
