'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Search, Wrench, Star } from 'lucide-react';
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
    customerRating: number;
  };
  laborHoursLogged: number;
  salary: number;
  hireDate: string;
  birthday?: string;
  userId?: string;
  isActive?: boolean;
}

export default function MechanicsPage() {
  const toast = useToast();
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [users, setUsers] = useState<any[]>([]);
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
    fetchUsers();
  }, []);

  useEffect(() => {
    filterMechanics();
  }, [mechanics, searchTerm, specializationFilter]);

  const fetchMechanics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/mechanics');
      setMechanics(response.data.data.items || response.data.data || []);
    } catch (error) {
      console.error('Error fetching mechanics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data.data.users || response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
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
      await api.delete(`/mechanics/${id}`);
      fetchMechanics();
    } catch (error) {
      console.error('Error deleting mechanic:', error);
    }
  };

  const getUserForMechanic = (mechanic: Mechanic) => {
    return users.find(u => u.mechanicId === mechanic._id);
  };

  const handleToggleActive = async (mechanic: Mechanic) => {
    const user = getUserForMechanic(mechanic);
    if (!user) {
      toast.error('No user account found for this mechanic');
      return;
    }

    try {
      await api.patch(`/auth/users/${user.id}/toggle-active`);
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      toast.error(error.response?.data?.message || 'Failed to update user status');
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
      if (isEditMode && selectedMechanic) {
        await api.put(`/mechanics/${selectedMechanic._id}`, payload);
      } else {
        await api.post('/mechanics', payload);
      }
      setIsAddEditDialogOpen(false);
      fetchMechanics();
    } catch (error) {
      console.error('Error saving mechanic:', error);
    }
  };

  const getAvailabilityVariant = (status: string): 'success' | 'warning' | 'destructive' | 'secondary' => {
    const map: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
      available: 'success',
      busy: 'warning',
      off: 'destructive'
    };
    return map[status] || 'secondary';
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Mechanics Management"
        description="Manage your garage mechanics and track their performance"
        action={
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Mechanic
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search mechanics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={specializationFilter}
              onChange={(e) => setSpecializationFilter(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All Specializations</option>
              <option value="painter">Painter</option>
              <option value="detailer">Detailer</option>
              <option value="installer">Installer</option>
              <option value="technician">Technician</option>
              <option value="all">All</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                      <Badge variant="secondary" className="capitalize">
                        {mechanic.specialization}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getAvailabilityVariant(mechanic.availability)} className="capitalize">
                        {mechanic.availability}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                        {mechanic.performance.customerRating.toFixed(1)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const user = getUserForMechanic(mechanic);
                        if (!user) return <span className="text-xs text-muted-foreground">No account</span>;
                        return (
                          <Badge variant={user.isActive ? 'success' : 'destructive'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleView(mechanic)}>
                          View
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(mechanic)}>
                          Edit
                        </Button>
                        {getUserForMechanic(mechanic) && (
                          <Button
                            size="sm"
                            variant={getUserForMechanic(mechanic)!.isActive ? "secondary" : "default"}
                            onClick={() => handleToggleActive(mechanic)}
                          >
                            {getUserForMechanic(mechanic)!.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(mechanic._id)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredMechanics.length === 0 && (
            <EmptyState icon={Wrench} title="No mechanics found" description="Try adjusting your search or filters" />
          )}
        </CardContent>
      </Card>

      {/* View Mechanic Sheet */}
      <Sheet open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Mechanic Details</SheetTitle>
          </SheetHeader>
          <Separator className="my-4" />
          {selectedMechanic && (
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-6 pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <p className="font-medium">{selectedMechanic.firstName} {selectedMechanic.lastName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedMechanic.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Phone</Label>
                    <p className="font-medium">{selectedMechanic.phone}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Specialization</Label>
                    <div className="mt-1">
                      <Badge variant="secondary" className="capitalize">{selectedMechanic.specialization}</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Skills</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedMechanic.skills.map((skill, index) => (
                      <Badge key={index} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </div>

                <Separator />
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{selectedMechanic.performance.totalJobsCompleted}</p>
                    <p className="text-xs text-muted-foreground">Jobs Done</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{selectedMechanic.performance.averageTurnaroundTime}</p>
                    <p className="text-xs text-muted-foreground">Avg Hours</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span className="text-2xl font-bold">{selectedMechanic.performance.customerRating.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                </div>

                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Labor Hours Logged</Label>
                    <p className="font-medium">{selectedMechanic.laborHoursLogged} hrs</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Salary</Label>
                    <p className="font-medium">Ksh {(selectedMechanic.salary || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Hire Date</Label>
                    <p className="font-medium">{new Date(selectedMechanic.hireDate).toLocaleDateString()}</p>
                  </div>
                  {selectedMechanic.birthday && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Birthday</Label>
                      <p className="font-medium">{new Date(selectedMechanic.birthday).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
          <Separator className="my-4" />
          <SheetFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Add/Edit Mechanic Sheet */}
      <Sheet open={isAddEditDialogOpen} onOpenChange={setIsAddEditDialogOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{isEditMode ? 'Edit Mechanic' : 'Add New Mechanic'}</SheetTitle>
          </SheetHeader>
          <Separator className="my-4" />
          <form onSubmit={handleSubmit}>
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="space-y-4 pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
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
                  <Label htmlFor="specialization">Specialization *</Label>
                  <select
                    id="specialization"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  <Label htmlFor="salary">Salary (Ksh) *</Label>
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
            </ScrollArea>
            <Separator className="my-4" />
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{isEditMode ? 'Update' : 'Add'} Mechanic</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
