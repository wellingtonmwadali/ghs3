import { SettingsRepository } from '../../infrastructure/repositories/Settings.repository';
import { InventoryRepository } from '../../infrastructure/repositories/Inventory.repository';
import { CarRepository } from '../../infrastructure/repositories/Car.repository';
import { CarModel } from '../../infrastructure/models/Car.model';
import { AppError } from '../../presentation/middlewares/error.middleware';

interface NotificationPayload {
  type: 'low_inventory' | 'late_service' | 'invoice_created' | 'payment_received';
  title: string;
  message: string;
  recipients: string[];
  data?: any;
}

export class NotificationService {
  private settingsRepository: SettingsRepository;
  private inventoryRepository: InventoryRepository;
  private carRepository: CarRepository;

  constructor() {
    this.settingsRepository = new SettingsRepository();
    this.inventoryRepository = new InventoryRepository();
    this.carRepository = new CarRepository();
  }

  /**
   * Check for low inventory items and send notifications
   */
  async checkLowInventory(): Promise<void> {
    try {
      const settings = await this.settingsRepository.getSettings();
      
      if (!settings?.notifications?.inventory?.enabled) {
        return; // Inventory notifications disabled
      }

      const inventoryItems = await this.inventoryRepository.findAll();
      const lowStockItems = inventoryItems.filter(item => {
        // Check against minimum stock level
        if (settings.notifications?.inventory?.minStockLevelTrigger) {
          if (item.quantity <= item.minStockLevel) {
            return true;
          }
        }
        
        // Check against custom threshold if set
        if (settings.notifications?.inventory?.customThreshold) {
          const threshold = settings.notifications.inventory.customThreshold;
          const percentageRemaining = (item.quantity / item.minStockLevel) * 100;
          if (percentageRemaining <= threshold) {
            return true;
          }
        }
        
        return false;
      });

      if (lowStockItems.length > 0) {
        const itemsList = lowStockItems
          .map(item => `- ${item.itemName}: ${item.quantity} units remaining (min: ${item.minStockLevel})`)
          .join('\n');

        const notification: NotificationPayload = {
          type: 'low_inventory',
          title: `Low Inventory Alert: ${lowStockItems.length} items`,
          message: `The following items are running low:\n\n${itemsList}\n\nPlease restock soon.`,
          recipients: settings.notifications.recipients.emails,
          data: { lowStockItems }
        };

        await this.sendNotification(notification);
      }
    } catch (error) {
      console.error('Error checking low inventory:', error);
      throw error;
    }
  }

  /**
   * Check for late services and send notifications
   */
  async checkLateServices(): Promise<void> {
    try {
      const settings = await this.settingsRepository.getSettings();
      
      if (!settings?.notifications?.lateServices?.enabled) {
        return; // Late service notifications disabled
      }

      const daysOverdue = settings.notifications?.lateServices?.daysOverdue || 2;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all cars not completed that are past expected completion date
      const cars = await CarModel.find({
        stage: { $ne: 'completed' }
      });

      const lateCars = cars.filter(car => {
        const expectedDate = new Date(car.expectedCompletionDate);
        expectedDate.setHours(0, 0, 0, 0);
        const diffTime = today.getTime() - expectedDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= daysOverdue;
      });

      if (lateCars.length > 0) {
        const carsList = lateCars
          .map(car => {
            const expectedDate = new Date(car.expectedCompletionDate);
            const diffTime = today.getTime() - expectedDate.getTime();
            const daysLate = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            return `- ${car.vehicleModel} (${car.vehiclePlate}): ${daysLate} days overdue - Customer: ${car.customerName}`;
          })
          .join('\n');

        const notification: NotificationPayload = {
          type: 'late_service',
          title: `Late Service Alert: ${lateCars.length} vehicles`,
          message: `The following vehicles are past their expected completion date:\n\n${carsList}\n\nPlease review and update customers.`,
          recipients: settings.notifications.recipients.emails,
          data: { lateCars }
        };

        await this.sendNotification(notification);

        // Optionally notify customers if enabled
        if (settings.notifications?.lateServices?.notifyCustomer) {
          for (const car of lateCars) {
            // TODO: Implement customer notification logic
            console.log(`Would notify customer for car: ${car.vehiclePlate}`);
          }
        }
      }
    } catch (error) {
      console.error('Error checking late services:', error);
      throw error;
    }
  }

  /**
   * Send notification via configured channels
   */
  private async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      const settings = await this.settingsRepository.getSettings();
      
      // TODO: Implement actual email sending using emailConfig from settings
      // For now, just log the notification
      console.log('='.repeat(60));
      console.log(`📧 ${payload.type.toUpperCase()} NOTIFICATION`);
      console.log('='.repeat(60));
      console.log(`To: ${payload.recipients.join(', ')}`);
      console.log(`Subject: ${payload.title}`);
      console.log(`Message:\n${payload.message}`);
      console.log('='.repeat(60));

      // In production, you would:
      // 1. Check if emailEnabled in settings
      // 2. Use nodemailer or similar to send actual emails
      // 3. Store notification in database for in-app notifications
      // 4. Send WhatsApp messages if whatsappEnabled

      /*
      Example email implementation:
      
      if (settings?.notifications?.emailEnabled && settings?.emailConfig?.enabled) {
        const transporter = nodemailer.createTransporter({
          host: settings.emailConfig.host,
          port: settings.emailConfig.port,
          secure: settings.emailConfig.secure,
          auth: {
            user: settings.emailConfig.user,
            pass: settings.emailConfig.password
          }
        });

        await transporter.sendMail({
          from: settings.companyInfo?.email || settings.emailConfig.user,
          to: payload.recipients.join(','),
          subject: payload.title,
          text: payload.message,
          html: `<pre>${payload.message}</pre>`
        });
      }
      */
    } catch (error) {
      console.error('Error sending notification:', error);
      // Don't throw - notifications are non-critical
    }
  }

  /**
   * Manual trigger for low inventory check (can be called from API endpoint)
   */
  async triggerLowInventoryCheck(): Promise<{ message: string; itemsFound: number }> {
    const settings = await this.settingsRepository.getSettings();
    
    if (!settings?.notifications?.inventory?.enabled) {
      throw new AppError('Inventory notifications are disabled in settings', 400);
    }

    const inventoryItems = await this.inventoryRepository.findAll();
    const lowStockItems = inventoryItems.filter(item => {
      if (settings.notifications?.inventory?.minStockLevelTrigger) {
        if (item.quantity <= item.minStockLevel) {
          return true;
        }
      }
      
      if (settings.notifications?.inventory?.customThreshold) {
        const threshold = settings.notifications.inventory.customThreshold;
        const percentageRemaining = (item.quantity / item.minStockLevel) * 100;
        if (percentageRemaining <= threshold) {
          return true;
        }
      }
      
      return false;
    });

    if (lowStockItems.length > 0) {
      await this.checkLowInventory();
    }

    return {
      message: lowStockItems.length > 0 
        ? `Found ${lowStockItems.length} low stock items, notifications sent` 
        : 'No low stock items found',
      itemsFound: lowStockItems.length
    };
  }

  /**
   * Manual trigger for late service check (can be called from API endpoint)
   */
  async triggerLateServiceCheck(): Promise<{ message: string; carsFound: number }> {
    const settings = await this.settingsRepository.getSettings();
    
    if (!settings?.notifications?.lateServices?.enabled) {
      throw new AppError('Late service notifications are disabled in settings', 400);
    }

    const daysOverdue = settings.notifications?.lateServices?.daysOverdue || 2;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cars = await CarModel.find({
      stage: { $ne: 'completed' }
    });

    const lateCars = cars.filter(car => {
      const expectedDate = new Date(car.expectedCompletionDate);
      expectedDate.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - expectedDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= daysOverdue;
    });

    if (lateCars.length > 0) {
      await this.checkLateServices();
    }

    return {
      message: lateCars.length > 0 
        ? `Found ${lateCars.length} late services, notifications sent` 
        : 'No late services found',
      carsFound: lateCars.length
    };
  }
}
