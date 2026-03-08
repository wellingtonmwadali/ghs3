import cron from 'node-cron';
import { InventoryModel } from '../models/Inventory.model';
import { SettingsModel } from '../models/Settings.model';
import { EmailService } from './Email.service';

export class CronJobService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  async initialize() {
    console.log('🕐 Initializing cron jobs...');
    
    // Daily low inventory check at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('🔍 Running daily low inventory check...');
      await this.checkLowInventory();
    }, {
      timezone: 'Africa/Nairobi' // Adjust to your timezone
    });

    // Optional: Run check immediately on startup for testing
    // Uncomment the line below if you want to test immediately
    // await this.checkLowInventory();

    console.log('✅ Cron jobs initialized successfully');
  }

  private async checkLowInventory() {
    try {
      const settings = await SettingsModel.findOne();
      
      if (!settings?.notifications?.lowInventoryAlert) {
        console.log('⏭️ Low inventory alerts are disabled in settings');
        return;
      }

      if (!settings?.companyInfo?.email) {
        console.log('⚠️ No admin email configured in settings');
        return;
      }

      // Find items below minimum stock level
      const lowStockItems = await InventoryModel.aggregate([
        {
          $match: {
            isActive: true,
            $expr: { $lte: ['$quantity', '$minStockLevel'] }
          }
        },
        {
          $sort: { quantity: 1 } // Sort by lowest quantity first
        }
      ]);

      if (lowStockItems.length === 0) {
        console.log('✅ All inventory items are above minimum stock levels');
        return;
      }

      console.log(`📦 Found ${lowStockItems.length} low stock item(s)`);

      // Initialize email service
      await this.emailService.initialize();

      // Send individual alerts for each low stock item
      for (const item of lowStockItems) {
        await this.emailService.sendLowInventoryAlert(item, settings.companyInfo.email);
        console.log(`📧 Low stock alert sent for: ${item.itemName}`);
      }

      // Additionally, send a summary email with all low stock items
      if (lowStockItems.length > 1) {
        await this.sendLowStockSummaryEmail(lowStockItems, settings.companyInfo.email);
      }

      console.log(`✅ Low inventory check completed - ${lowStockItems.length} alert(s) sent`);
    } catch (error) {
      console.error('❌ Error during low inventory check:', error);
    }
  }

  private async sendLowStockSummaryEmail(items: any[], adminEmail: string) {
    try {
      const settings = await SettingsModel.findOne();

      const itemsHtml = items.map((item, index) => `
        <tr style="${index % 2 === 0 ? 'background: #f9fafb;' : ''}">
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.itemName}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.sku || 'N/A'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            <span style="color: #dc2626; font-weight: 600;">${item.quantity} ${item.unit}</span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.minStockLevel} ${item.unit}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.supplier?.name || 'N/A'}</td>
        </tr>
      `).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">⚠️ Daily Low Inventory Report</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 14px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
              <p style="margin: 0; font-size: 16px; color: #92400e;">
                <strong>${items.length} item(s)</strong> are currently at or below minimum stock levels and require immediate attention.
              </p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background: #374151; color: white;">
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Item Name</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">SKU</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600;">Current Stock</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600;">Min. Level</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Supplier</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div style="margin-top: 30px; padding: 20px; background: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 4px;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #1e40af;">
                <strong>💡 Recommendation:</strong> Review and place orders with suppliers to maintain optimal stock levels.
              </p>
              <p style="margin: 0; font-size: 12px; color: #1e40af;">
                This automated report is generated daily at 9:00 AM. You can adjust inventory alert settings in the system configuration.
              </p>
            </div>
          </div>
          
          <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p>${settings?.companyInfo?.name || 'GHS3'} - Inventory Management System</p>
            <p>${settings?.companyInfo?.address || ''}</p>
            <p style="margin-top: 10px;">This is an automated email. Please do not reply.</p>
          </div>
        </body>
        </html>
      `;

      await this.emailService.sendEmail({
        to: adminEmail,
        subject: `📦 Daily Low Inventory Report - ${items.length} Item(s) Need Restocking`,
        html
      });

      console.log('📧 Low stock summary email sent successfully');
    } catch (error) {
      console.error('❌ Error sending low stock summary email:', error);
    }
  }

  // Manual trigger for testing purposes
  async runLowInventoryCheck() {
    console.log('🔧 Manually triggered low inventory check');
    await this.checkLowInventory();
  }
}
