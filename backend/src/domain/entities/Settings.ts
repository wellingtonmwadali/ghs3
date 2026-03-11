// Domain Entity: Settings
export interface ISettings {
  _id?: string;
  serviceTypes: {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    paymentTerms?: 'full_upfront' | 'deposit' | 'upon_completion' | 'custom';
    depositPercentage?: number;
  }[];
  promotionalMessages: {
    id: string;
    title: string;
    message: string;
    target: 'all' | 'recurring' | 'new' | 'high_value';
  }[];
  announcements: {
    id: string;
    title: string;
    content: string;
    startDate: Date;
    endDate: Date;
    active: boolean;
  }[];
  holidays: {
    id: string;
    name: string;
    date: Date;
  }[];
  clockInEnabled: boolean;
  promotionalDeliveryMethod: {
    email: boolean;
    whatsapp: boolean;
  };
  companyInfo?: {
    name: string;
    email: string;
    phone: string;
    address: string;
    logo?: string;
  };
  emailConfig?: {
    enabled: boolean;
    service: string; // 'gmail', 'smtp', etc.
    host?: string;
    port?: number;
    secure?: boolean;
    user: string;
    password: string;
  };
  notifications?: {
    lowInventoryAlert: boolean;
    invoiceCreated: boolean;
    paymentReceived: boolean;
    emailEnabled: boolean;
    whatsappEnabled: boolean;
    recipients: {
      type: 'single' | 'multiple';
      emails: string[]; // Email addresses to receive notifications
      userIds?: string[]; // User IDs for in-app notifications
    };
    inventory: {
      enabled: boolean;
      checkFrequency: 'hourly' | 'daily' | 'weekly'; // How often to check
      minStockLevelTrigger: boolean; // Alert when below minStockLevel
      customThreshold?: number; // Optional custom threshold percentage
    };
    lateServices: {
      enabled: boolean;
      daysOverdue: number; // Alert when X days past expected completion
      checkFrequency: 'daily' | 'twice_daily';
      notifyCustomer: boolean; // Also notify customer
    };
  };
  rolePermissions?: {
    owner: string[];
    manager: string[];
    receptionist: string[];
    mechanic: string[];
  };
  createdAt?: Date;
  updatedAt?: Date;
}
