'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Package, AlertTriangle, DollarSign } from 'lucide-react';
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
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { KPICard } from '@/components/shared/KPICard';

interface InventoryItem {
  _id: string;
  itemName: string;
  category: 'paint' | 'chemical' | 'film' | 'tool' | 'other';
  sku?: string;
  brand?: string;
  quantity: number;
  unit: string;
  minStockLevel: number;
  costPerUnit: number;
  supplier?: {
    name: string;
    contact: string;
    email?: string;
  };
  lastRestocked?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function InventoryPage() {
  const toast = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    itemName: '',
    sku: '',
    brand: '',
    category: 'paint',
    quantity: '',
    unit: 'liters',
    minStockLevel: '',
    costPerUnit: '',
    supplierName: '',
    supplierContact: '',
    supplierEmail: ''
  });

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, categoryFilter, lowStockOnly]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(response.data.data.items || response.data.data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...items];

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    if (lowStockOnly) {
      filtered = filtered.filter((item) => item.quantity <= item.minStockLevel);
    }

    setFilteredItems(filtered);
  };

  const handleView = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
  };

  const handleAdd = () => {
    setIsEditMode(false);
    setFormData({
      itemName: '',
      sku: '',
      brand: '',
      category: 'paint',
      quantity: '',
      unit: 'liters',
      minStockLevel: '',
      costPerUnit: '',
      supplierName: '',
      supplierContact: '',
      supplierEmail: ''
    });
    setIsAddEditDialogOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setIsEditMode(true);
    setSelectedItem(item);
    setFormData({
      itemName: item.itemName,
      sku: item.sku || '',
      brand: item.brand || '',
      category: item.category,
      quantity: item.quantity.toString(),
      unit: item.unit || 'liters',
      minStockLevel: item.minStockLevel.toString(),
      costPerUnit: item.costPerUnit.toString(),
      supplierName: item.supplier?.name || '',
      supplierContact: item.supplier?.contact || '',
      supplierEmail: item.supplier?.email || ''
    });
    setIsAddEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/inventory/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      itemName: formData.itemName,
      sku: formData.sku || undefined,
      brand: formData.brand || undefined,
      category: formData.category,
      quantity: parseInt(formData.quantity),
      unit: formData.unit,
      minStockLevel: parseInt(formData.minStockLevel),
      costPerUnit: parseFloat(formData.costPerUnit),
      supplier: formData.supplierName ? {
        name: formData.supplierName,
        contact: formData.supplierContact,
        email: formData.supplierEmail || undefined
      } : undefined,
      isActive: true
    };

    try {
      const token = localStorage.getItem('token');
      if (isEditMode && selectedItem) {
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/inventory/${selectedItem._id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/inventory`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsAddEditDialogOpen(false);
      fetchItems();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const getStockVariant = (item: InventoryItem): 'destructive' | 'warning' | 'success' => {
    if (item.quantity === 0) return 'destructive';
    if (item.quantity <= item.minStockLevel) return 'warning';
    return 'success';
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return 'Out of Stock';
    if (item.quantity <= item.minStockLevel) return 'Low Stock';
    return 'In Stock';
  };

  if (loading) {
    return <PageSkeleton />;
  }

  const lowStockCount = items.filter(item => item.quantity <= item.minStockLevel).length;
  const totalValue = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.costPerUnit || 0)), 0);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Inventory Management"
        description="Track stock levels and manage supplies"
        action={
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard title="Total Items" value={items.length} icon={Package} iconColor="text-primary" iconBg="bg-primary/10" />
        <KPICard title="Low Stock Items" value={lowStockCount} icon={AlertTriangle} iconColor="text-warning" iconBg="bg-warning/10" />
        <KPICard title="Total Value" value={`Ksh ${totalValue.toLocaleString()}`} icon={DollarSign} iconColor="text-success" iconBg="bg-success/10" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All Categories</option>
              <option value="paint">Paint</option>
              <option value="coating">Coating</option>
              <option value="film">Film</option>
              <option value="wrap">Wrap</option>
              <option value="detailing">Detailing</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              Low Stock Only
            </label>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reorder Level</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">{item.itemName}</TableCell>
                    <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                    <TableCell className="capitalize">{item.category}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.minStockLevel}</TableCell>
                    <TableCell>Ksh {(item.costPerUnit || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={getStockVariant(item)}>
                        {getStockStatus(item)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleView(item)}>
                          View
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(item._id)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredItems.length === 0 && (
            <EmptyState icon={Package} title="No items found" description="Try adjusting your search or filters" />
          )}
        </CardContent>
      </Card>

      {/* View Item Sheet */}
      <Sheet open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Item Details</SheetTitle>
          </SheetHeader>
          <Separator className="my-4" />
          {selectedItem && (
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-6 pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Item Name</Label>
                    <p className="font-medium">{selectedItem.itemName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">SKU</Label>
                    <p className="font-medium">{selectedItem.sku || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Brand</Label>
                    <p className="font-medium">{selectedItem.brand || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Category</Label>
                    <p className="font-medium capitalize">{selectedItem.category}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Unit</Label>
                    <p className="font-medium">{selectedItem.unit}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge variant={getStockVariant(selectedItem)}>{getStockStatus(selectedItem)}</Badge>
                    </div>
                  </div>
                </div>

                {selectedItem.supplier && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-xs text-muted-foreground">Supplier</Label>
                      <div className="mt-1">
                        <p className="font-medium">{selectedItem.supplier.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedItem.supplier.contact}</p>
                        {selectedItem.supplier.email && <p className="text-sm text-muted-foreground">{selectedItem.supplier.email}</p>}
                      </div>
                    </div>
                  </>
                )}

                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{selectedItem.quantity}</p>
                    <p className="text-xs text-muted-foreground">In Stock</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{selectedItem.minStockLevel}</p>
                    <p className="text-xs text-muted-foreground">Reorder Level</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Unit Price</Label>
                    <p className="font-medium">Ksh {(selectedItem.costPerUnit || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Total Value</Label>
                    <p className="font-medium">Ksh {((selectedItem.quantity || 0) * (selectedItem.costPerUnit || 0)).toLocaleString()}</p>
                  </div>
                </div>

                {selectedItem.lastRestocked && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Last Restocked</Label>
                    <p className="font-medium">{new Date(selectedItem.lastRestocked).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
          <Separator className="my-4" />
          <SheetFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Add/Edit Item Sheet */}
      <Sheet open={isAddEditDialogOpen} onOpenChange={setIsAddEditDialogOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{isEditMode ? 'Edit Item' : 'Add New Item'}</SheetTitle>
          </SheetHeader>
          <Separator className="my-4" />
          <form onSubmit={handleSubmit}>
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="space-y-4 pr-2">
                <div>
                  <Label htmlFor="itemName">Item Name *</Label>
                  <Input
                    id="itemName"
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    >
                      <option value="paint">Paint</option>
                      <option value="chemical">Chemical</option>
                      <option value="film">Film</option>
                      <option value="tool">Tool</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit *</Label>
                    <select
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    >
                      <option value="liters">Liters</option>
                      <option value="gallons">Gallons</option>
                      <option value="kg">Kilograms</option>
                      <option value="pieces">Pieces</option>
                      <option value="rolls">Rolls</option>
                      <option value="bottles">Bottles</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="minStockLevel">Reorder Level *</Label>
                    <Input
                      id="minStockLevel"
                      type="number"
                      value={formData.minStockLevel}
                      onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="costPerUnit">Unit Price (Ksh) *</Label>
                  <Input
                    id="costPerUnit"
                    type="number"
                    step="0.01"
                    value={formData.costPerUnit}
                    onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                    required
                  />
                </div>
                <Separator />
                <p className="text-sm font-medium">Supplier Information</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplierName">Supplier Name</Label>
                    <Input
                      id="supplierName"
                      value={formData.supplierName}
                      onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplierContact">Contact</Label>
                    <Input
                      id="supplierContact"
                      value={formData.supplierContact}
                      onChange={(e) => setFormData({ ...formData, supplierContact: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="supplierEmail">Email</Label>
                  <Input
                    id="supplierEmail"
                    type="email"
                    value={formData.supplierEmail}
                    onChange={(e) => setFormData({ ...formData, supplierEmail: e.target.value })}
                  />
                </div>
              </div>
            </ScrollArea>
            <Separator className="my-4" />
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{isEditMode ? 'Update' : 'Add'} Item</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
