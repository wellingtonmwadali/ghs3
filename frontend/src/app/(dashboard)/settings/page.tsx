'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Save, Settings as SettingsIcon } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ServiceType {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  paymentTerms?: 'full_upfront' | 'deposit' | 'upon_completion' | 'custom';
  depositPercentage?: number;
}

interface PromotionalMessage {
  id: string;
  title: string;
  message: string;
  target: 'all' | 'recurring' | 'new' | 'high_value';
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
}

interface SettingsData {
  serviceTypes: ServiceType[];
  promotionalMessages: PromotionalMessage[];
  announcements: Announcement[];
  holidays: Holiday[];
  clockInEnabled: boolean;
  promotionalDeliveryMethod: {
    email: boolean;
    whatsapp: boolean;
  };
}

export default function SettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<SettingsData>({
    serviceTypes: [],
    promotionalMessages: [],
    announcements: [],
    holidays: [],
    clockInEnabled: false,
    promotionalDeliveryMethod: {
      email: true,
      whatsapp: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'promotions' | 'announcements' | 'holidays' | 'features'>('services');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(response.data.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      // Initialize with defaults if settings don't exist
      setSettings({
        serviceTypes: [
          { id: '1', name: 'Colour Repair', description: 'Professional paint repair and color matching', basePrice: 50000, paymentTerms: 'deposit', depositPercentage: 50 },
          { id: '2', name: 'Clean & Shine', description: 'Complete detailing and cleaning service', basePrice: 15000, paymentTerms: 'full_upfront' },
          { id: '3', name: 'Coat & Guard', description: 'Protective coating and sealant application', basePrice: 35000, paymentTerms: 'deposit', depositPercentage: 30 }
        ],
        promotionalMessages: [],
        announcements: [],
        holidays: [],
        clockInEnabled: true,
        promotionalDeliveryMethod: {
          email: true,
          whatsapp: false
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Clean and validate data before sending
      const cleanedSettings = {
        serviceTypes: settings.serviceTypes.filter(st => 
          st.name.trim() !== '' && st.description.trim() !== '' && st.basePrice > 0
        ),
        promotionalMessages: settings.promotionalMessages.filter(pm => 
          pm.title.trim() !== '' && pm.message.trim() !== ''
        ),
        announcements: settings.announcements.filter(ann => 
          ann.title.trim() !== '' && ann.content.trim() !== '' && ann.startDate && ann.endDate
        ).map(ann => ({
          ...ann,
          startDate: new Date(ann.startDate).toISOString(),
          endDate: new Date(ann.endDate).toISOString()
        })),
        holidays: settings.holidays.filter(hol => 
          hol.name.trim() !== '' && hol.date
        ).map(hol => ({
          ...hol,
          date: new Date(hol.date).toISOString()
        })),
        clockInEnabled: settings.clockInEnabled
      };

      await api.post('/settings', cleanedSettings);
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings. Please check your data and try again.');
    } finally {
      setSaving(false);
    }
  };

  // Service Types Functions
  const addServiceType = () => {
    setSettings({
      ...settings,
      serviceTypes: [
        ...settings.serviceTypes,
        { 
          id: Date.now().toString(), 
          name: '', 
          description: '', 
          basePrice: 0,
          paymentTerms: 'full_upfront',
          depositPercentage: 0
        }
      ]
    });
  };

  const updateServiceType = (id: string, field: keyof ServiceType, value: any) => {
    setSettings({
      ...settings,
      serviceTypes: settings.serviceTypes.map(st =>
        st.id === id ? { ...st, [field]: value } : st
      )
    });
  };

  const removeServiceType = (id: string) => {
    setSettings({
      ...settings,
      serviceTypes: settings.serviceTypes.filter(st => st.id !== id)
    });
  };

  // Promotional Messages Functions
  const addPromotionalMessage = () => {
    setSettings({
      ...settings,
      promotionalMessages: [
        ...settings.promotionalMessages,
        { id: Date.now().toString(), title: '', message: '', target: 'all' }
      ]
    });
  };

  const updatePromotionalMessage = (id: string, field: keyof PromotionalMessage, value: any) => {
    setSettings({
      ...settings,
      promotionalMessages: settings.promotionalMessages.map(pm =>
        pm.id === id ? { ...pm, [field]: value } : pm
      )
    });
  };

  const removePromotionalMessage = (id: string) => {
    setSettings({
      ...settings,
      promotionalMessages: settings.promotionalMessages.filter(pm => pm.id !== id)
    });
  };

  // Announcements Functions
  const addAnnouncement = () => {
    const today = new Date().toISOString().split('T')[0];
    setSettings({
      ...settings,
      announcements: [
        ...settings.announcements,
        { id: Date.now().toString(), title: '', content: '', startDate: today, endDate: today, active: true }
      ]
    });
  };

  const updateAnnouncement = (id: string, field: keyof Announcement, value: any) => {
    setSettings({
      ...settings,
      announcements: settings.announcements.map(ann =>
        ann.id === id ? { ...ann, [field]: value } : ann
      )
    });
  };

  const removeAnnouncement = (id: string) => {
    setSettings({
      ...settings,
      announcements: settings.announcements.filter(ann => ann.id !== id)
    });
  };

  // Holidays Functions
  const addHoliday = () => {
    setSettings({
      ...settings,
      holidays: [
        ...settings.holidays,
        { id: Date.now().toString(), name: '', date: '' }
      ]
    });
  };

  const updateHoliday = (id: string, field: keyof Holiday, value: any) => {
    setSettings({
      ...settings,
      holidays: settings.holidays.map(hol =>
        hol.id === id ? { ...hol, [field]: value } : hol
      )
    });
  };

  const removeHoliday = (id: string) => {
    setSettings({
      ...settings,
      holidays: settings.holidays.filter(hol => hol.id !== id)
    });
  };

  const tabs = [
    { id: 'services', label: 'Service Types', icon: SettingsIcon },
    { id: 'promotions', label: 'Promotional Messages', icon: SettingsIcon },
    { id: 'announcements', label: 'Announcements', icon: SettingsIcon },
    { id: 'holidays', label: 'Holidays', icon: SettingsIcon },
    { id: 'features', label: 'Features', icon: SettingsIcon },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" text="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="h-full p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-2 text-muted-foreground">
            Configure your garage management system
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Service Types Tab */}
      {activeTab === 'services' && (
        <Card>
          <CardHeader>
            <CardTitle>Service Types</CardTitle>
            <CardDescription>
              Define the types of services your garage offers. These will be available when creating new car entries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settings.serviceTypes.map((serviceType) => (
                <div key={serviceType.id} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Service Name</Label>
                        <Input
                          value={serviceType.name}
                          onChange={(e) => updateServiceType(serviceType.id, 'name', e.target.value)}
                          placeholder="e.g., Colour Repair"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Input
                          value={serviceType.description}
                          onChange={(e) => updateServiceType(serviceType.id, 'description', e.target.value)}
                          placeholder="Brief description"
                        />
                      </div>
                      <div>
                        <Label>Base Price (Ksh)</Label>
                        <Input
                          type="number"
                          value={serviceType.basePrice}
                          onChange={(e) => updateServiceType(serviceType.id, 'basePrice', parseFloat(e.target.value))}
                          placeholder="50000"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Payment Terms</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={serviceType.paymentTerms || 'full_upfront'}
                          onChange={(e) => updateServiceType(serviceType.id, 'paymentTerms', e.target.value)}
                        >
                          <option value="full_upfront">Full Payment Upfront</option>
                          <option value="deposit">Deposit Required</option>
                          <option value="upon_completion">Payment Upon Completion</option>
                          <option value="custom">Custom Terms</option>
                        </select>
                      </div>
                      {(serviceType.paymentTerms === 'deposit' || serviceType.paymentTerms === 'custom') && (
                        <div>
                          <Label>Deposit Percentage (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={serviceType.depositPercentage || 0}
                            onChange={(e) => updateServiceType(serviceType.id, 'depositPercentage', parseFloat(e.target.value))}
                            placeholder="50"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeServiceType(serviceType.id)}
                    className="mt-6"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button onClick={addServiceType} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Service Type
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Promotional Messages Tab */}
      {activeTab === 'promotions' && (
        <Card>
          <CardHeader>
            <CardTitle>Promotional Messages</CardTitle>
            <CardDescription>
              Create promotional message templates to send to customers. These can be sent from the Customers page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settings.promotionalMessages.map((promo) => (
                <div key={promo.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex gap-4 items-start">
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Message Title</Label>
                          <Input
                            value={promo.title}
                            onChange={(e) => updatePromotionalMessage(promo.id, 'title', e.target.value)}
                            placeholder="e.g., Spring Special Offer"
                          />
                        </div>
                        <div>
                          <Label>Target Audience</Label>
                          <select
                            value={promo.target}
                            onChange={(e) => updatePromotionalMessage(promo.id, 'target', e.target.value)}
                            className="w-full border rounded-md px-3 py-2"
                          >
                            <option value="all">All Customers</option>
                            <option value="recurring">Recurring Customers</option>
                            <option value="new">New Customers</option>
                            <option value="high_value">High Value Customers</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label>Message Content</Label>
                        <textarea
                          value={promo.message}
                          onChange={(e) => updatePromotionalMessage(promo.id, 'message', e.target.value)}
                          className="w-full border rounded-md px-3 py-2 min-h-[100px]"
                          placeholder="Enter your promotional message here..."
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePromotionalMessage(promo.id)}
                      className="mt-6"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button onClick={addPromotionalMessage} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Promotional Message
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <Card>
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
            <CardDescription>
              Create system-wide announcements that will be displayed to users. Set date ranges for when they should appear.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settings.announcements.map((announcement) => (
                <div key={announcement.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex gap-4 items-start">
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={announcement.title}
                            onChange={(e) => updateAnnouncement(announcement.id, 'title', e.target.value)}
                            placeholder="Announcement title"
                          />
                        </div>
                        <div>
                          <Label>Start Date</Label>
                          <Input
                            type="date"
                            value={announcement.startDate}
                            onChange={(e) => updateAnnouncement(announcement.id, 'startDate', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            value={announcement.endDate}
                            onChange={(e) => updateAnnouncement(announcement.id, 'endDate', e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Content</Label>
                        <textarea
                          value={announcement.content}
                          onChange={(e) => updateAnnouncement(announcement.id, 'content', e.target.value)}
                          className="w-full border rounded-md px-3 py-2 min-h-[80px]"
                          placeholder="Announcement content"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={announcement.active}
                          onChange={(e) => updateAnnouncement(announcement.id, 'active', e.target.checked)}
                          className="rounded"
                        />
                        <Label>Active</Label>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAnnouncement(announcement.id)}
                      className="mt-6"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button onClick={addAnnouncement} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Announcement
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Holidays Tab */}
      {activeTab === 'holidays' && (
        <Card>
          <CardHeader>
            <CardTitle>Holidays</CardTitle>
            <CardDescription>
              Define company holidays when the garage will be closed. These dates will be marked in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settings.holidays.map((holiday) => (
                <div key={holiday.id} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <Label>Holiday Name</Label>
                      <Input
                        value={holiday.name}
                        onChange={(e) => updateHoliday(holiday.id, 'name', e.target.value)}
                        placeholder="e.g., New Year's Day"
                      />
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={holiday.date}
                        onChange={(e) => updateHoliday(holiday.id, 'date', e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeHoliday(holiday.id)}
                    className="mt-6"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button onClick={addHoliday} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Holiday
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features Tab */}
      {activeTab === 'features' && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Toggles</CardTitle>
            <CardDescription>
              Enable or disable specific features in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">Clock-In Feature</h4>
                  <p className="text-sm text-muted-foreground">
                    Allow mechanics to clock in and out to track working hours
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.clockInEnabled}
                    onChange={(e) => setSettings({ ...settings, clockInEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium mb-3">Promotional Delivery Method</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select how promotional messages should be delivered to customers
                  </p>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.promotionalDeliveryMethod.email}
                      onChange={(e) => setSettings({
                        ...settings,
                        promotionalDeliveryMethod: {
                          ...settings.promotionalDeliveryMethod,
                          email: e.target.checked
                        }
                      })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">Email</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.promotionalDeliveryMethod.whatsapp}
                      onChange={(e) => setSettings({
                        ...settings,
                        promotionalDeliveryMethod: {
                          ...settings.promotionalDeliveryMethod,
                          whatsapp: e.target.checked
                        }
                      })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">WhatsApp</span>
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
