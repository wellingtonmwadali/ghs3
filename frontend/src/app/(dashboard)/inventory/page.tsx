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
import { useToast } from '@/components/ui/toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface InventoryItem {
  _id: string;
  itemName: string;
  sku: string;
  category: string;
  quantity: number;
  minStockLevel: number;
  costPerUnit: number;
  supplier: string;
  lastRestocked?: string;
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
    category: 'paint',
    quantity: '',
    minStockLevel: '',
    costPerUnit: '',
    supplier: ''
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
          item.sku.toLowerCase().includes(searchTerm.toLowerCase())
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
      category: 'paint',
      quantity: '',
      minStockLevel: '',
      costPerUnit: '',
      supplier: ''
    });
    setIsAddEditDialogOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setIsEditMode(true);
    setSelectedItem(item);
    setFormData({
      itemName: item.itemName,
      sku: item.sku,
      category: item.category,
      quantity: item.quantity.toString(),
      minStockLevel: item.minStockLevel.toString(),
      costPerUnit: item.costPerUnit.toString(),
      supplier: item.supplier
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
      sku: formData.sku,
      category: formData.category,
      quantity: parseInt(formData.quantity),
      minStockLevel: parseInt(formData.minStockLevel),
      costPerUnit: parseFloat(formData.costPerUnit),
      supplier: formData.supplier,
      unit: 'units',
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

  const getStockBadge = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return 'bg-red-100 text-red-800';
    } else if (item.quantity <= item.minStockLevel) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-green-100 text-green-800';
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return 'Out of Stock';
    if (item.quantity <= item.minStockLevel) return 'Low Stock';
    return 'In Stock';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" text="Loading inventory..." />
      </div>
    );
  }

  const lowStockCount = items.filter(item => item.quantity <= item.minStockLevel).length;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Inventory Management</h1>
        <p className="text-gray-600">Track stock levels and manage supplies</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Ksh {items.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="">All Categories</option>
              <option value="paint">Paint</option>
              <option value="coating">Coating</option>
              <option value="film">Film</option>
              <option value="wrap">Wrap</option>
              <option value="detailing">Detailing</option>
            </select>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
              />
              <span>Low Stock Only</span>
            </label>
            <Button onClick={handleAdd} className="ml-auto">
              Add Item
            </Button>
          </div>

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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item._id}>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell className="capitalize">{item.category}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.minStockLevel}</TableCell>
                  <TableCell>Ksh {item.costPerUnit.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStockBadge(item)}`}>
                      {getStockStatus(item)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
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

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No items found
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Item Name</Label>
                  <p className="font-medium">{selectedItem.itemName}</p>
                </div>
                <div>
                  <Label className="text-gray-600">SKU</Label>
                  <p className="font-medium">{selectedItem.sku}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Category</Label>
                  <p className="font-medium capitalize">{selectedItem.category}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Supplier</Label>
                  <p className="font-medium">{selectedItem.supplier}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Quantity in Stock</Label>
                  <p className="font-medium text-2xl">{selectedItem.quantity}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Reorder Level</Label>
                  <p className="font-medium text-2xl">{selectedItem.minStockLevel}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Unit Price</Label>
                  <p className="font-medium">Ksh {selectedItem.costPerUnit.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Total Value</Label>
                  <p className="font-medium">Ksh {(selectedItem.quantity * selectedItem.costPerUnit).toLocaleString()}</p>
                </div>
                {selectedItem.lastRestocked && (
                  <div className="col-span-2">
                    <Label className="text-gray-600">Last Restocked</Label>
                    <p className="font-medium">{new Date(selectedItem.lastRestocked).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddEditDialogOpen} onOpenChange={setIsAddEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update item information' : 'Add a new item to inventory'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="itemName">Item Name</Label>
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
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  >
                    <option value="paint">Paint</option>
                    <option value="coating">Coating</option>
                    <option value="film">Film</option>
                    <option value="wrap">Wrap</option>
                    <option value="detailing">Detailing</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity in Stock</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="minStockLevel">Reorder Level</Label>
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
                <Label htmlFor="costPerUnit">Unit Price (Ksh)</Label>
                <Input
                  id="costPerUnit"
                  type="number"
                  step="0.01"
                  value={formData.costPerUnit}
                  onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{isEditMode ? 'Update' : 'Add'} Item</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
