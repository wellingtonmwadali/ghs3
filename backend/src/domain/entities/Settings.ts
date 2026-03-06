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
  createdAt?: Date;
  updatedAt?: Date;
}
