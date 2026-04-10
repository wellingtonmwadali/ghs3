'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { Plus, Trash2, Save, Settings as SettingsIcon, Upload, Building2, ChevronUp, ChevronDown, Check, Bell, Calendar, Megaphone, Wrench, ToggleLeft } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useNotify } from '@/hooks/useNotify';

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
  imageUrl?: string;
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
  autoAssignMechanics: boolean;
  promotionalDeliveryMethod: {
    email: boolean;
    whatsapp: boolean;
    senderEmail?: string;
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

const themedSelectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function SettingsPage() {
  const toast = useToast();
  const notify = useNotify();
  const [settings, setSettings] = useState<SettingsData>({
    serviceTypes: [],
    promotionalMessages: [],
    announcements: [],
    holidays: [],
    clockInEnabled: false,
    autoAssignMechanics: true,
    promotionalDeliveryMethod: {
      email: true,
      whatsapp: false,
      senderEmail: ''
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
  const [expandedPromoId, setExpandedPromoId] = useState<string | null>(null);
  const [isAddingPromo, setIsAddingPromo] = useState(false);

  useEffect(() => {
    fetchSettings();
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
        autoAssignMechanics: true,
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
        localStorage.setItem('companyLogo', base64String);
        window.dispatchEvent(new CustomEvent('logoUpdated', { detail: { logo: base64String } }));
        toast.success('Logo uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'company', label: 'Company Info', icon: Building2 },
    { id: 'services', label: 'Services', icon: Wrench },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'promotions', label: 'Promotions', icon: Megaphone },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'holidays', label: 'Holidays', icon: Calendar },
    { id: 'features', label: 'Features', icon: ToggleLeft },
  ];

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="h-full p-6 md:p-8">
      <PageHeader
        title="Settings"
        description="Configure your garage management system"
        action={
          <Button onClick={handleSaveSettings} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        }
      />

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
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
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="flex flex-col items-center gap-4">
                  {(logoPreview || settings.companyInfo?.logo) && (
                    <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-background">
                      <img
                        src={logoPreview || settings.companyInfo?.logo}
                        alt="Company Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="text-center">
                    <Label
                      htmlFor="logo-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Logo
                    </Label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground mt-2">PNG, JPG or SVG. Max 2MB.</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={settings.companyInfo?.name || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      companyInfo: {
                        ...settings.companyInfo!,
                        name: e.target.value
                      }
                    })}
                    placeholder="Your Company Name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={settings.companyInfo?.email || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      companyInfo: {
                        ...settings.companyInfo!,
                        email: e.target.value
                      }
                    })}
                    placeholder="company@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
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

                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea
                    value={settings.companyInfo?.address || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      companyInfo: {
                        ...settings.companyInfo!,
                        address: e.target.value
                      }
                    })}
                    placeholder="Enter company address"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Service Types</CardTitle>
                <CardDescription>
                  Manage the types of services your garage offers
                </CardDescription>
              </div>
              <Button onClick={addServiceType} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settings.serviceTypes.map((service, index) => (
                <div key={service.id} className="rounded-lg border bg-card p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Service #{index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeServiceType(service.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Service Name</Label>
                      <Input
                        value={service.name}
                        onChange={(e) => updateServiceType(service.id, 'name', e.target.value)}
                        placeholder="Service name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Base Price (KES)</Label>
                      <Input
                        type="number"
                        value={service.basePrice || ''}
                        onChange={(e) => updateServiceType(service.id, 'basePrice', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={service.description}
                      onChange={(e) => updateServiceType(service.id, 'description', e.target.value)}
                      placeholder="Service description"
                      rows={2}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Payment Terms</Label>
                      <select
                        value={service.paymentTerms || 'full_upfront'}
                        onChange={(e) => updateServiceType(service.id, 'paymentTerms', e.target.value)}
                        className={themedSelectClass}
                      >
                        <option value="full_upfront">Full Payment Upfront</option>
                        <option value="deposit">Deposit Required</option>
                        <option value="upon_completion">Upon Completion</option>
                        <option value="custom">Custom Terms</option>
                      </select>
                    </div>
                    {service.paymentTerms === 'deposit' && (
                      <div className="space-y-2">
                        <Label>Deposit Percentage (%)</Label>
                        <Input
                          type="number"
                          value={service.depositPercentage || ''}
                          onChange={(e) => updateServiceType(service.id, 'depositPercentage', parseFloat(e.target.value) || 0)}
                          placeholder="e.g., 50"
                          min="1"
                          max="100"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {settings.serviceTypes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Wrench className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  <p>No service types configured.</p>
                  <p className="text-sm">Click &quot;Add Service&quot; to get started.</p>
                </div>
              )}
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
              Configure how and when notifications are sent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Notification Channels */}
              <div className="rounded-lg border bg-card p-4">
                <h4 className="font-semibold mb-4">Notification Channels</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Send notifications via email</p>
                    </div>
                    <Switch
                      checked={settings.notifications?.emailEnabled || false}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications!,
                          emailEnabled: checked
                        }
                      })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">WhatsApp Notifications</p>
                      <p className="text-sm text-muted-foreground">Send notifications via WhatsApp</p>
                    </div>
                    <Switch
                      checked={settings.notifications?.whatsappEnabled || false}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications!,
                          whatsappEnabled: checked
                        }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Recipients */}
              <div className="rounded-lg border bg-card p-4">
                <h4 className="font-semibold mb-4">Recipients</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
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
                      className={themedSelectClass}
                    >
                      <option value="single">Single Recipient</option>
                      <option value="multiple">Multiple Recipients</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Email Recipients</Label>
                    <Input
                      value={settings.notifications?.recipients?.emails?.join(', ') || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications!,
                          recipients: {
                            ...settings.notifications!.recipients,
                            emails: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                          }
                        }
                      })}
                      placeholder="email@example.com, another@example.com"
                    />
                    <p className="text-xs text-muted-foreground">Separate multiple emails with commas</p>
                  </div>
                </div>
              </div>

              {/* Inventory Alerts */}
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Low Inventory Alerts</h4>
                  <Switch
                    checked={settings.notifications?.inventory?.enabled || false}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications!,
                        inventory: {
                          ...settings.notifications!.inventory,
                          enabled: checked
                        }
                      }
                    })}
                  />
                </div>
                
                {settings.notifications?.inventory?.enabled && (
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
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
                        className={themedSelectClass}
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
                        className="h-4 w-4 rounded border-input"
                      />
                      <Label htmlFor="minStockTrigger" className="cursor-pointer">
                        Alert when items reach minimum stock level
                      </Label>
                    </div>

                    <div className="space-y-2">
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
                      <p className="text-xs text-muted-foreground">Alert when inventory falls below this percentage</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Late Service Notifications */}
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Late Service Alerts</h4>
                  <Switch
                    checked={settings.notifications?.lateServices?.enabled || false}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications!,
                        lateServices: {
                          ...settings.notifications!.lateServices,
                          enabled: checked
                        }
                      }
                    })}
                  />
                </div>
                
                {settings.notifications?.lateServices?.enabled && (
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
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
                      <p className="text-xs text-muted-foreground">Send alert when service is X days past expected completion</p>
                    </div>

                    <div className="space-y-2">
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
                        className={themedSelectClass}
                      >
                        <option value="daily">Once Daily (9 AM)</option>
                        <option value="twice_daily">Twice Daily (9 AM &amp; 3 PM)</option>
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
                        className="h-4 w-4 rounded border-input"
                      />
                      <Label htmlFor="notifyCustomer" className="cursor-pointer">
                        Also notify customer about delays
                      </Label>
                    </div>
                  </div>
                )}
              </div>

              {/* General Notification Toggles */}
              <div className="rounded-lg border bg-card p-4">
                <h4 className="font-semibold mb-4">Other Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Invoice Created</p>
                      <p className="text-sm text-muted-foreground">Notify when new invoice is generated</p>
                    </div>
                    <Switch
                      checked={settings.notifications?.invoiceCreated || false}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications!,
                          invoiceCreated: checked
                        }
                      })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Payment Received</p>
                      <p className="text-sm text-muted-foreground">Notify when payment is recorded</p>
                    </div>
                    <Switch
                      checked={settings.notifications?.paymentReceived || false}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications!,
                          paymentReceived: checked
                        }
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Promotions Tab */}
      {activeTab === 'promotions' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Promotional Messages</CardTitle>
                <CardDescription>
                  Manage promotional messages to send to your customers
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  addPromotionalMessage();
                  setIsAddingPromo(true);
                }}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Promotion
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settings.promotionalMessages.map((promo, index) => (
                <div key={promo.id} className="rounded-lg border bg-card">
                  {/* Collapsed Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors"
                    onClick={() => setExpandedPromoId(expandedPromoId === promo.id ? null : promo.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Megaphone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{promo.title || 'Untitled Promotion'}</span>
                      <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground capitalize">{promo.target}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); removePromotionalMessage(promo.id); }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {expandedPromoId === promo.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedPromoId === promo.id && (
                    <div className="border-t p-4 space-y-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={promo.title}
                          onChange={(e) => updatePromotionalMessage(promo.id, 'title', e.target.value)}
                          placeholder="Promotion title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Message</Label>
                        <Textarea
                          value={promo.message}
                          onChange={(e) => updatePromotionalMessage(promo.id, 'message', e.target.value)}
                          placeholder="Write your promotional message..."
                          rows={4}
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Target Audience</Label>
                          <select
                            value={promo.target}
                            onChange={(e) => updatePromotionalMessage(promo.id, 'target', e.target.value)}
                            className={themedSelectClass}
                          >
                            <option value="all">All Customers</option>
                            <option value="recurring">Recurring Customers</option>
                            <option value="new">New Customers</option>
                            <option value="high_value">High Value Customers</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Image (Optional)</Label>
                          <Input
                            value={promo.imageUrl || ''}
                            onChange={(e) => updatePromotionalMessage(promo.id, 'imageUrl', e.target.value)}
                            placeholder="Image URL"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {settings.promotionalMessages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Megaphone className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  <p>No promotional messages yet.</p>
                  <p className="text-sm">Click &quot;Add Promotion&quot; to create one.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Announcements</CardTitle>
                <CardDescription>
                  Manage company announcements and notices
                </CardDescription>
              </div>
              <Button onClick={addAnnouncement} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Announcement
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settings.announcements.map((ann, index) => (
                <div key={ann.id} className="rounded-lg border bg-card p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Announcement #{index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAnnouncement(ann.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={ann.title}
                      onChange={(e) => updateAnnouncement(ann.id, 'title', e.target.value)}
                      placeholder="Announcement title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea
                      value={ann.content}
                      onChange={(e) => updateAnnouncement(ann.id, 'content', e.target.value)}
                      placeholder="Announcement content..."
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={ann.startDate ? ann.startDate.split('T')[0] : ''}
                        onChange={(e) => updateAnnouncement(ann.id, 'startDate', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={ann.endDate ? ann.endDate.split('T')[0] : ''}
                        onChange={(e) => updateAnnouncement(ann.id, 'endDate', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`ann-active-${ann.id}`}
                      checked={ann.active}
                      onChange={(e) => updateAnnouncement(ann.id, 'active', e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor={`ann-active-${ann.id}`} className="cursor-pointer">Active</Label>
                  </div>
                </div>
              ))}

              {settings.announcements.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Megaphone className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  <p>No announcements yet.</p>
                  <p className="text-sm">Click &quot;Add Announcement&quot; to create one.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Holidays Tab */}
      {activeTab === 'holidays' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Holidays</CardTitle>
                <CardDescription>
                  Manage business holidays and closures
                </CardDescription>
              </div>
              <Button onClick={addHoliday} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Holiday
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settings.holidays.map((hol, index) => (
                <div key={hol.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Holiday Name</Label>
                        <Input
                          value={hol.name}
                          onChange={(e) => updateHoliday(hol.id, 'name', e.target.value)}
                          placeholder="Holiday name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={hol.date ? hol.date.split('T')[0] : ''}
                          onChange={(e) => updateHoliday(hol.id, 'date', e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeHoliday(hol.id)}
                      className="text-destructive hover:text-destructive mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {settings.holidays.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  <p>No holidays configured.</p>
                  <p className="text-sm">Click &quot;Add Holiday&quot; to add one.</p>
                </div>
              )}
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
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border bg-card p-4">
                <div>
                  <h4 className="font-medium">Auto-Assign Mechanics</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically assign mechanics when adding a new car if no mechanic is selected
                  </p>
                </div>
                <Switch
                  checked={settings.autoAssignMechanics}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoAssignMechanics: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between rounded-lg border bg-card p-4">
                <div>
                  <h4 className="font-medium">Clock-In Feature</h4>
                  <p className="text-sm text-muted-foreground">
                    Allow mechanics to clock in and out to track working hours
                  </p>
                </div>
                <Switch
                  checked={settings.clockInEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, clockInEnabled: checked })}
                />
              </div>
              
              <div className="rounded-lg border bg-card p-4">
                <div>
                  <h4 className="font-medium mb-1">Promotional Delivery Method</h4>
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
                      className="h-4 w-4 rounded border-input accent-primary"
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
                      className="h-4 w-4 rounded border-input accent-primary"
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
