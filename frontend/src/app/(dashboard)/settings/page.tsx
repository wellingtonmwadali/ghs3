'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Save, Settings as SettingsIcon, Upload, Building2 } from 'lucide-react';
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

interface CompanyInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  logo?: string;
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
  companyInfo?: CompanyInfo;
  notifications?: {
    lowInventoryAlert: boolean;
    invoiceCreated: boolean;
    paymentReceived: boolean;
    emailEnabled: boolean;
    whatsappEnabled: boolean;
    recipients: {
      type: 'single' | 'multiple';
      emails: string[];
      userIds?: string[];
    };
    inventory: {
      enabled: boolean;
      checkFrequency: 'hourly' | 'daily' | 'weekly';
      minStockLevelTrigger: boolean;
      customThreshold?: number;
    };
    lateServices: {
      enabled: boolean;
      daysOverdue: number;
      checkFrequency: 'daily' | 'twice_daily';
      notifyCustomer: boolean;
    };
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
    },
    companyInfo: {
      name: '',
      email: '',
      phone: '',
      address: '',
      logo: ''
    },
    notifications: {
      lowInventoryAlert: true,
      invoiceCreated: true,
      paymentReceived: true,
      emailEnabled: true,
      whatsappEnabled: false,
      recipients: {
        type: 'single',
        emails: [],
        userIds: []
      },
      inventory: {
        enabled: true,
        checkFrequency: 'daily',
        minStockLevelTrigger: true,
        customThreshold: undefined
      },
      lateServices: {
        enabled: true,
        daysOverdue: 2,
        checkFrequency: 'daily',
        notifyCustomer: false
      }
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'services' | 'promotions' | 'announcements' | 'holidays' | 'features' | 'notifications'>('company');
  const [logoPreview, setLogoPreview] = useState<string>('');

  useEffect(() => {
    fetchSettings();
    // Load logo from localStorage if exists
    const savedLogo = localStorage.getItem('companyLogo');
    if (savedLogo) {
      setLogoPreview(savedLogo);
    }
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
        },
        companyInfo: {
          name: 'GHS3 Garage',
          email: 'info@ghs3.com',
          phone: '+254 700 000 000',
          address: 'Nairobi, Kenya',
          logo: ''
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo file size must be less than 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        setSettings({
          ...settings,
          companyInfo: {
            ...settings.companyInfo!,
            logo: base64String
          }
        });
        // Save to localStorage for sidebar access
        localStorage.setItem('companyLogo', base64String);
        // Dispatch custom event to update sidebar in real-time
        window.dispatchEvent(new CustomEvent('logoUpdated', { detail: { logo: base64String } }));
        toast.success('Logo uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'company', label: 'Company Information', icon: Building2 },
    { id: 'services', label: 'Service Types', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: SettingsIcon },
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

      {/* Company Information Tab */}
      {activeTab === 'company' && (
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Configure your company details and logo. The logo will be displayed in the sidebar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Logo Upload Section */}
              <div className="border-2 border-dashed rounded-lg p-6">
                <div className="flex flex-col items-center gap-4">
                  {(logoPreview || settings.companyInfo?.logo) && (
                    <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-white">
                      <img
                        src={logoPreview || settings.companyInfo?.logo}
                        alt="Company Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}  <div className="text-center">
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        <Upload className="h-4 w-4" />
                        {logoPreview || settings.companyInfo?.logo ? 'Change Logo' : 'Upload Logo'}
                      </div>
                    </Label>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    {(logoPreview || settings.companyInfo?.logo) && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setLogoPreview('');
                          setSettings({
                            ...settings,
                            companyInfo: { ...settings.companyInfo!, logo: '' }
                          });
                          localStorage.removeItem('companyLogo');
                          window.dispatchEvent(new CustomEvent('logoUpdated', { detail: { logo: '' } }));
                          toast.success('Logo deleted successfully!');
                        }}
                        className="mt-2"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Logo
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Recommended: Square image, max 2MB (PNG, JPG, SVG)
                    </p>
                  </div>
                </div>
              </div>

              {/* Company Details */}
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={settings.companyInfo?.name || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      companyInfo: {
                        ...settings.companyInfo!,
                        name: e.target.value
                      }
                    })}
                    placeholder="Enter company name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company-email">Email Address</Label>
                    <Input
                      id="company-email"
                      type="email"
                      value={settings.companyInfo?.email || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        companyInfo: {
                          ...settings.companyInfo!,
                          email: e.target.value
                        }
                      })}
                      placeholder="info@company.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="company-phone">Phone Number</Label>
                    <Input
                      id="company-phone"
                      type="tel"
                      value={settings.companyInfo?.phone || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        companyInfo: {
                          ...settings.companyInfo!,
                          phone: e.target.value
                        }
                      })}
                      placeholder="+254 700 000 000"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="company-address">Physical Address</Label>
                  <textarea
                    id="company-address"
                    value={settings.companyInfo?.address || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      companyInfo: {
                        ...settings.companyInfo!,
                        address: e.target.value
                      }
                    })}
                    className="w-full border rounded-md px-3 py-2 min-h-[80px]"
                    placeholder="Enter your company address"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              {settings.promotionalMessages.map((promo, index) => (
                <div key={promo.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <Input
                        value={promo.title}
                        onChange={(e) => updatePromotionalMessage(promo.id, 'title', e.target.value)}
                        placeholder="e.g., Spring Special Offer"
                        className="font-medium"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePromotionalMessage(promo.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
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

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Configure who receives notifications and what triggers alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              
              {/* Notification Recipients */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-4">Notification Recipients</h4>
                <div className="space-y-4">
                  <div>
                    <Label>Recipient Type</Label>
                    <select
                      value={settings.notifications?.recipients?.type || 'single'}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications!,
                          recipients: {
                            ...settings.notifications!.recipients,
                            type: e.target.value as 'single' | 'multiple'
                          }
                        }
                      })}
                      className="w-full mt-1 border rounded-md px-3 py-2"
                    >
                      <option value="single">Single Recipient (Admin/Owner)</option>
                      <option value="multiple">Multiple Recipients (Team)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Choose who should receive system notifications</p>
                  </div>

                  <div>
                    <Label>Email Addresses</Label>
                    <div className="space-y-2 mt-2">
                      {settings.notifications?.recipients?.emails?.map((email, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            type="email"
                            value={email}
                            onChange={(e) => {
                              const newEmails = [...(settings.notifications?.recipients?.emails || [])];
                              newEmails[index] = e.target.value;
                              setSettings({
                                ...settings,
                                notifications: {
                                  ...settings.notifications!,
                                  recipients: {
                                    ...settings.notifications!.recipients,
                                    emails: newEmails
                                  }
                                }
                              });
                            }}
                            placeholder="admin@garage.com"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newEmails = settings.notifications?.recipients?.emails?.filter((_, i) => i !== index) || [];
                              setSettings({
                                ...settings,
                                notifications: {
                                  ...settings.notifications!,
                                  recipients: {
                                    ...settings.notifications!.recipients,
                                    emails: newEmails
                                  }
                                }
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSettings({
                            ...settings,
                            notifications: {
                              ...settings.notifications!,
                              recipients: {
                                ...settings.notifications!.recipients,
                                emails: [...(settings.notifications?.recipients?.emails || []), '']
                              }
                            }
                          });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Email
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Low Inventory Notifications */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Low Inventory Alerts</h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications?.inventory?.enabled || false}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications!,
                          inventory: {
                            ...settings.notifications!.inventory,
                            enabled: e.target.checked
                          }
                        }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                {settings.notifications?.inventory?.enabled && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Check Frequency</Label>
                      <select
                        value={settings.notifications?.inventory?.checkFrequency || 'daily'}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications!,
                            inventory: {
                              ...settings.notifications!.inventory,
                              checkFrequency: e.target.value as 'hourly' | 'daily' | 'weekly'
                            }
                          }
                        })}
                        className="w-full mt-1 border rounded-md px-3 py-2"
                      >
                        <option value="hourly">Every Hour</option>
                        <option value="daily">Once Daily</option>
                        <option value="weekly">Once Weekly</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="minStockTrigger"
                        checked={settings.notifications?.inventory?.minStockLevelTrigger || false}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications!,
                            inventory: {
                              ...settings.notifications!.inventory,
                              minStockLevelTrigger: e.target.checked
                            }
                          }
                        })}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="minStockTrigger" className="cursor-pointer">
                        Alert when items reach minimum stock level
                      </Label>
                    </div>

                    <div>
                      <Label>Custom Threshold (Optional %)</Label>
                      <Input
                        type="number"
                        value={settings.notifications?.inventory?.customThreshold || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications!,
                            inventory: {
                              ...settings.notifications!.inventory,
                              customThreshold: e.target.value ? parseInt(e.target.value) : undefined
                            }
                          }
                        })}
                        placeholder="e.g., 20 for 20% of stock"
                        min="1"
                        max="100"
                      />
                      <p className="text-xs text-gray-500 mt-1">Alert when inventory falls below this percentage</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Late Service Notifications */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Late Service Alerts</h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications?.lateServices?.enabled || false}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications!,
                          lateServices: {
                            ...settings.notifications!.lateServices,
                            enabled: e.target.checked
                          }
                        }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                {settings.notifications?.lateServices?.enabled && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Days Overdue Before Alert</Label>
                      <Input
                        type="number"
                        value={settings.notifications?.lateServices?.daysOverdue || 2}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications!,
                            lateServices: {
                              ...settings.notifications!.lateServices,
                              daysOverdue: parseInt(e.target.value) || 2
                            }
                          }
                        })}
                        min="1"
                        max="30"
                      />
                      <p className="text-xs text-gray-500 mt-1">Send alert when service is X days past expected completion</p>
                    </div>

                    <div>
                      <Label>Check Frequency</Label>
                      <select
                        value={settings.notifications?.lateServices?.checkFrequency || 'daily'}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications!,
                            lateServices: {
                              ...settings.notifications!.lateServices,
                              checkFrequency: e.target.value as 'daily' | 'twice_daily'
                            }
                          }
                        })}
                        className="w-full mt-1 border rounded-md px-3 py-2"
                      >
                        <option value="daily">Once Daily (9 AM)</option>
                        <option value="twice_daily">Twice Daily (9 AM & 3 PM)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="notifyCustomer"
                        checked={settings.notifications?.lateServices?.notifyCustomer || false}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications!,
                            lateServices: {
                              ...settings.notifications!.lateServices,
                              notifyCustomer: e.target.checked
                            }
                          }
                        })}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="notifyCustomer" className="cursor-pointer">
                        Also notify customer about delays
                      </Label>
                    </div>
                  </div>
                )}
              </div>

              {/* General Notification Toggles */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-4">Other Notifications</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Invoice Created</p>
                      <p className="text-sm text-gray-500">Notify when new invoice is generated</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications?.invoiceCreated || false}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications!,
                            invoiceCreated: e.target.checked
                          }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Payment Received</p>
                      <p className="text-sm text-gray-500">Notify when payment is recorded</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications?.paymentReceived || false}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications!,
                            paymentReceived: e.target.checked
                          }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
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
