'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
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
  carId: {
    _id: string;
    vehicleModel: string;
    vehiclePlate: string;
  } | string;
  customerId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  } | string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  taxRate: number;
  discount?: number;
  total: number;
  paidAmount: number;
  balance: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  payments: Array<{
    amount: number;
    method: string;
    reference?: string;
    paymentPID?: string;
    paidAt: string;
  }>;
  issuedDate: string;
  dueDate: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function InvoicesPage() {
  const toast = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'cash',
    paymentPID: '',
    reference: ''
  });

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
          (typeof invoice.customerId === 'object' && invoice.customerId.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (typeof invoice.carId === 'object' && invoice.carId.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const handleDelete = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Invoice deleted successfully');
      fetchInvoices();
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      toast.error(error.response?.data?.message || 'Failed to delete invoice');
    }
  };

  const handlePrint = (invoice: Invoice) => {
    // Implement print functionality
    window.print();
  };

  const handleRecordPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      amount: invoice.balance.toString(),
      method: 'cash',
      paymentPID: '',
      reference: ''
    });
    setIsPaymentDialogOpen(true);
  };

  const submitPayment = async () => {
    if (!selectedInvoice) return;
    
    try {
      const token = localStorage.getItem('token');
      const amount = parseFloat(paymentData.amount);
      
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid payment amount');
        return;
      }
      
      if (amount > selectedInvoice.balance) {
        toast.error('Payment amount cannot exceed balance');
        return;
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/invoices/${selectedInvoice._id}/payment`,
        {
          amount,
          method: paymentData.method,
          paymentPID: paymentData.paymentPID || undefined,
          reference: paymentData.reference || undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Payment recorded successfully');
      setIsPaymentDialogOpen(false);
      fetchInvoices();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
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
        <LoadingSpinner size="lg" text="Loading invoices..." />
      </div>
    );
  }

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const pendingPayments = invoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);
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
                  <TableCell>{typeof invoice.customerId === 'object' ? invoice.customerId?.name : 'N/A'}</TableCell>
                  <TableCell>{typeof invoice.carId === 'object' && invoice.carId ? `${invoice.carId.vehicleModel} (${invoice.carId.vehiclePlate})` : 'N/A'}</TableCell>
                  <TableCell>Ksh {(invoice.total || 0).toLocaleString()}</TableCell>
                  <TableCell>Ksh {(invoice.paidAmount || 0).toLocaleString()}</TableCell>
                  <TableCell>Ksh {(invoice.balance || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusBadge(invoice.paymentStatus)}`}>
                      {invoice.paymentStatus}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(invoice.issuedDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleView(invoice)}>
                        View
                      </Button>
                      {invoice.paymentStatus !== 'paid' && (
                        <Button size="sm" onClick={() => handleRecordPayment(invoice)}>
                          Record Payment
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handlePrint(invoice)}>
                        Print
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(invoice._id)}>
                        Delete
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
                  <p className="font-medium">{typeof selectedInvoice.customerId === 'object' ? selectedInvoice.customerId.name : 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Vehicle</Label>
                  <p className="font-medium">{typeof selectedInvoice.carId === 'object' ? `${selectedInvoice.carId.vehicleModel} (${selectedInvoice.carId.vehiclePlate})` : 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Payment Status</Label>
                  <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusBadge(selectedInvoice.paymentStatus)}`}>
                    {selectedInvoice.paymentStatus}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-gray-600 mb-2 block">Items</Label>
                <div className="border rounded-md p-3 space-y-2">
                  {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                    selectedInvoice.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className="text-sm">{item.description}</span>
                          <span className="text-xs text-gray-500 ml-2">(Qty: {item.quantity})</span>
                        </div>
                        <span className="font-medium">Ksh {item.total.toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No items</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Ksh {(selectedInvoice.subtotal || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({selectedInvoice.taxRate || 0}%):</span>
                    <span>Ksh {(selectedInvoice.tax || 0).toLocaleString()}</span>
                  </div>
                  {selectedInvoice.discount && selectedInvoice.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>- Ksh {selectedInvoice.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>Ksh {(selectedInvoice.total || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Amount Paid:</span>
                    <span>Ksh {(selectedInvoice.paidAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-yellow-600 font-bold">
                    <span>Balance:</span>
                    <span>Ksh {(selectedInvoice.balance || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <Label className="text-gray-600">Issue Date</Label>
                  <p className="font-medium">{new Date(selectedInvoice.issuedDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Due Date</Label>
                  <p className="font-medium">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                </div>
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

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-md">
                <div>
                  <Label className="text-xs text-gray-600">Invoice #</Label>
                  <p className="font-medium">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Customer</Label>
                  <p className="font-medium">{typeof selectedInvoice.customerId === 'object' ? selectedInvoice.customerId.name : 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Total Amount</Label>
                  <p className="font-medium">Ksh {(selectedInvoice.total || 0).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Balance Due</Label>
                  <p className="font-bold text-yellow-600">Ksh {(selectedInvoice.balance || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payment-amount">Payment Amount *</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  step="0.01"
                  min="0"
                  max={selectedInvoice.balance}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payment-method">Payment Method *</Label>
                <select
                  id="payment-method"
                  value={paymentData.method}
                  onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                  className="border rounded-md px-3 py-2"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="transfer">Bank Transfer</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="insurance">Insurance</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payment-pid">Payment Transaction ID (PID)</Label>
                <Input
                  id="payment-pid"
                  type="text"
                  placeholder="e.g., M-Pesa code, transaction reference"
                  value={paymentData.paymentPID}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentPID: e.target.value })}
                />
                <p className="text-xs text-gray-500">Enter M-Pesa code, bank reference, or transaction ID</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payment-reference">Additional Reference/Notes</Label>
                <Input
                  id="payment-reference"
                  type="text"
                  placeholder="Optional notes"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                />
              </div>

              {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                <div className="border-t pt-3">
                  <Label className="text-sm font-medium mb-2 block">Payment History</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedInvoice.payments.map((payment, idx) => (
                      <div key={idx} className="text-xs p-2 bg-gray-50 rounded">
                        <div className="flex justify-between">
                          <span className="font-medium">Ksh {payment.amount.toLocaleString()}</span>
                          <span className="text-gray-600">{new Date(payment.paidAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-gray-600 capitalize">{payment.method}</span>
                          {payment.paymentPID && (
                            <span className="text-blue-600 font-mono">{payment.paymentPID}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitPayment}>
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
