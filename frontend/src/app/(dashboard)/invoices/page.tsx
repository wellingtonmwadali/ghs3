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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  carId: string;
  customerId: string;
  customerName: string;
  vehicleDetails: string;
  services: Array<{ name: string; price: number }>;
  laborCost: number;
  partsCost: number;
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  balance: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  paymentMethod?: string;
  issueDate: string;
  dueDate: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(response.data.data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    if (searchTerm) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((invoice) => invoice.paymentStatus === statusFilter);
    }

    setFilteredInvoices(filtered);
  };

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  const handlePrint = (invoice: Invoice) => {
    // Implement print functionality
    window.print();
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading invoices...</div>
      </div>
    );
  }

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const pendingPayments = invoices.reduce((sum, inv) => sum + inv.balance, 0);
  const paidInvoices = invoices.filter(inv => inv.paymentStatus === 'paid').length;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Invoice Management</h1>
        <p className="text-gray-600">Track and manage customer invoices</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Ksh {totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              Ksh {pendingPayments.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Paid Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidInvoices}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search invoices..."
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
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice._id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.customerName}</TableCell>
                  <TableCell>{invoice.vehicleDetails}</TableCell>
                  <TableCell>Ksh {invoice.total.toLocaleString()}</TableCell>
                  <TableCell>Ksh {invoice.amountPaid.toLocaleString()}</TableCell>
                  <TableCell>Ksh {invoice.balance.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusBadge(invoice.paymentStatus)}`}>
                      {invoice.paymentStatus}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleView(invoice)}>
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handlePrint(invoice)}>
                        Print
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No invoices found
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Invoice Number</Label>
                  <p className="font-medium">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Customer</Label>
                  <p className="font-medium">{selectedInvoice.customerName}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Vehicle</Label>
                  <p className="font-medium">{selectedInvoice.vehicleDetails}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Payment Status</Label>
                  <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusBadge(selectedInvoice.paymentStatus)}`}>
                    {selectedInvoice.paymentStatus}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-gray-600 mb-2 block">Services</Label>
                <div className="border rounded-md p-3 space-y-2">
                  {selectedInvoice.services.map((service, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{service.name}</span>
                      <span>Ksh {service.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Labor Cost:</span>
                    <span>Ksh {selectedInvoice.laborCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parts Cost:</span>
                    <span>Ksh {selectedInvoice.partsCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Ksh {selectedInvoice.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>Ksh {selectedInvoice.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>Ksh {selectedInvoice.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Amount Paid:</span>
                    <span>Ksh {selectedInvoice.amountPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-yellow-600 font-bold">
                    <span>Balance:</span>
                    <span>Ksh {selectedInvoice.balance.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <Label className="text-gray-600">Issue Date</Label>
                  <p className="font-medium">{new Date(selectedInvoice.issueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Due Date</Label>
                  <p className="font-medium">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                </div>
                {selectedInvoice.paymentMethod && (
                  <div>
                    <Label className="text-gray-600">Payment Method</Label>
                    <p className="font-medium">{selectedInvoice.paymentMethod}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => selectedInvoice && handlePrint(selectedInvoice)}>
              Print Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
