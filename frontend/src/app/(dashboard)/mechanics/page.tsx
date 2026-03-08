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

interface Mechanic {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  skills: string[];
  availability: string;
  performance: {
    totalJobsCompleted: number;
    averageTurnaroundTime: number;
    efficiencyScore: number;
    customerRating: number;
  };
  laborHoursLogged: number;
  salary: number;
  hireDate: string;
  birthday?: string;
}

export default function MechanicsPage() {
  const toast = useToast();
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [filteredMechanics, setFilteredMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialization: 'technician',
    skills: '',
    salary: '',
    birthday: ''
  });

  useEffect(() => {
    fetchMechanics();
  }, []);

  useEffect(() => {
    filterMechanics();
  }, [mechanics, searchTerm, specializationFilter]);

  const fetchMechanics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/mechanics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMechanics(response.data.data.items || response.data.data || []);
    } catch (error) {
      console.error('Error fetching mechanics:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMechanics = () => {
    let filtered = [...mechanics];

    if (searchTerm) {
      filtered = filtered.filter(
        (mechanic) =>
          `${mechanic.firstName} ${mechanic.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mechanic.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (specializationFilter) {
      filtered = filtered.filter((mechanic) => mechanic.specialization === specializationFilter);
    }

    setFilteredMechanics(filtered);
  };

  const handleView = (mechanic: Mechanic) => {
    setSelectedMechanic(mechanic);
    setIsViewDialogOpen(true);
  };

  const handleAdd = () => {
    setIsEditMode(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      specialization: 'technician',
      skills: '',
      salary: '',
      birthday: ''
    });
    setIsAddEditDialogOpen(true);
  };

  const handleEdit = (mechanic: Mechanic) => {
    setIsEditMode(true);
    setSelectedMechanic(mechanic);
    setFormData({
      firstName: mechanic.firstName,
      lastName: mechanic.lastName,
      email: mechanic.email,
      phone: mechanic.phone,
      specialization: mechanic.specialization,
      skills: mechanic.skills.join(', '),
      salary: mechanic.salary.toString(),
      birthday: mechanic.birthday ? new Date(mechanic.birthday).toISOString().split('T')[0] : ''
    });
    setIsAddEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this mechanic?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/mechanics/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMechanics();
    } catch (error) {
      console.error('Error deleting mechanic:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      specialization: formData.specialization,
      skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
      salary: parseFloat(formData.salary),
      birthday: formData.birthday || undefined
    };

    try {
      const token = localStorage.getItem('token');
      if (isEditMode && selectedMechanic) {
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/mechanics/${selectedMechanic._id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/mechanics`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsAddEditDialogOpen(false);
      fetchMechanics();
    } catch (error) {
      console.error('Error saving mechanic:', error);
    }
  };

  const getSpecializationBadge = (spec: string) => {
    const colors: Record<string, string> = {
      painter: 'bg-blue-100 text-blue-800',
      detailer: 'bg-green-100 text-green-800',
      installer: 'bg-purple-100 text-purple-800',
      technician: 'bg-orange-100 text-orange-800',
      all: 'bg-gray-100 text-gray-800'
    };
    return colors[spec] || 'bg-gray-100 text-gray-800';
  };

  const getAvailabilityBadge = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-100 text-green-800',
      busy: 'bg-yellow-100 text-yellow-800',
      off: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" text="Loading mechanics..." />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mechanics Management</h1>
        <p className="text-gray-600">Manage your garage mechanics and track their performance</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Mechanics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search mechanics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <select
              value={specializationFilter}
              onChange={(e) => setSpecializationFilter(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="">All Specializations</option>
              <option value="painter">Painter</option>
              <option value="detailer">Detailer</option>
              <option value="installer">Installer</option>
              <option value="technician">Technician</option>
              <option value="all">All</option>
            </select>
            <Button onClick={handleAdd} className="ml-auto">
              Add Mechanic
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Efficiency</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMechanics.map((mechanic) => (
                <TableRow key={mechanic._id}>
                  <TableCell className="font-medium">
                    {mechanic.firstName} {mechanic.lastName}
                  </TableCell>
                  <TableCell>{mechanic.email}</TableCell>
                  <TableCell>{mechanic.phone}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${getSpecializationBadge(mechanic.specialization)}`}>
                      {mechanic.specialization}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${getAvailabilityBadge(mechanic.availability)}`}>
                      {mechanic.availability}
                    </span>
                  </TableCell>
                  <TableCell>⭐ {mechanic.performance.customerRating.toFixed(1)}</TableCell>
                  <TableCell>{mechanic.performance.efficiencyScore}%</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleView(mechanic)}>
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(mechanic)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(mechanic._id)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredMechanics.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No mechanics found
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mechanic Details</DialogTitle>
          </DialogHeader>
          {selectedMechanic && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Name</Label>
                  <p className="font-medium">{selectedMechanic.firstName} {selectedMechanic.lastName}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Email</Label>
                  <p className="font-medium">{selectedMechanic.email}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Phone</Label>
                  <p className="font-medium">{selectedMechanic.phone}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Specialization</Label>
                  <p className="font-medium capitalize">{selectedMechanic.specialization}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-gray-600">Skills</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedMechanic.skills.map((skill, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Jobs Completed</Label>
                  <p className="font-medium text-2xl">{selectedMechanic.performance.totalJobsCompleted}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Avg Turnaround (hrs)</Label>
                  <p className="font-medium text-2xl">{selectedMechanic.performance.averageTurnaroundTime}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Efficiency Score</Label>
                  <p className="font-medium text-2xl">{selectedMechanic.performance.efficiencyScore}%</p>
                </div>
                <div>
                  <Label className="text-gray-600">Customer Rating</Label>
                  <p className="font-medium text-2xl">⭐ {selectedMechanic.performance.customerRating.toFixed(1)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Labor Hours Logged</Label>
                  <p className="font-medium">{selectedMechanic.laborHoursLogged} hrs</p>
                </div>
                <div>
                  <Label className="text-gray-600">Salary</Label>
                  <p className="font-medium">Ksh {selectedMechanic.salary.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Hire Date</Label>
                  <p className="font-medium">{new Date(selectedMechanic.hireDate).toLocaleDateString()}</p>
                </div>
                {selectedMechanic.birthday && (
                  <div>
                    <Label className="text-gray-600">Birthday</Label>
                    <p className="font-medium">{new Date(selectedMechanic.birthday).toLocaleDateString()}</p>
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
            <DialogTitle>{isEditMode ? 'Edit Mechanic' : 'Add New Mechanic'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update mechanic information' : 'Add a new mechanic to your garage'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="specialization">Specialization</Label>
                <select
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  required
                >
                  <option value="painter">Painter</option>
                  <option value="detailer">Detailer</option>
                  <option value="installer">Installer</option>
                  <option value="technician">Technician</option>
                  <option value="all">All</option>
                </select>
              </div>
              <div>
                <Label htmlFor="skills">Skills (comma separated)</Label>
                <Input
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="Spray Painting, Body Repair, etc."
                />
              </div>
              <div>
                <Label htmlFor="salary">Salary (Ksh)</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="birthday">Birthday</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{isEditMode ? 'Update' : 'Add'} Mechanic</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
