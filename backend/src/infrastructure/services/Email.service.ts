import nodemailer from 'nodemailer';
import { SettingsModel } from '../models/Settings.model';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  
  async initialize() {
    try {
      const settings = await SettingsModel.findOne();
      
      if (!settings?.emailConfig?.enabled) {
        console.log('Email service is disabled in settings');
        return;
      }
      
      this.transporter = nodemailer.createTransport({
        service: settings.emailConfig.service,
        host: settings.emailConfig.host,
        port: settings.emailConfig.port,
        secure: settings.emailConfig.secure,
        auth: {
          user: settings.emailConfig.user,
          pass: settings.emailConfig.password
        }
      });
      
      // Verify transporter
      await this.transporter.verify();
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.transporter = null;
    }
  }
  
  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<boolean> {
    try {
      if (!this.transporter) {
        await this.initialize();
      }
      
      if (!this.transporter) {
        console.error('Email transporter not available');
        return false;
      }
      
      const settings = await SettingsModel.findOne();
      const from = settings?.companyInfo?.email || 'noreply@ghs3.com';
      
      await this.transporter.sendMail({
        from: `${settings?.companyInfo?.name || 'GHS3'} <${from}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      });
      
      console.log(`✅ Email sent to ${options.to}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }
  
  async sendInvoiceEmail(invoice: any, customerEmail: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .invoice-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Invoice #${invoice.invoiceNumber}</h1>
          </div>
          <div class="content">
            <p>Dear Valued Customer,</p>
            <p>Thank you for choosing our services. Please find your invoice details below:</p>
            
            <div class="invoice-details">
              <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
              <p><strong>Issue Date:</strong> ${new Date(invoice.issuedDate).toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
              <p><strong>Total Amount:</strong> Ksh ${invoice.total.toLocaleString()}</p>
              <p><strong>Balance Due:</strong> Ksh ${invoice.balance.toLocaleString()}</p>
            </div>
            
            <p>You can make payment through:</p>
            <ul>
              <li>Cash at our office</li>
              <li>Bank Transfer</li>
              <li>M-Pesa</li>
              <li>Card Payment</li>
            </ul>
            
            <p><em>Note: Our system will soon be integrated with payment platforms for direct payment updates.</em></p>
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply directly.</p>
            <p>&copy; ${new Date().getFullYear()} GHS3 Garage Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return this.sendEmail({
      to: customerEmail,
      subject: `Invoice #${invoice.invoiceNumber} - Payment Due`,
      html,
      text: `Invoice #${invoice.invoiceNumber} - Total: Ksh ${invoice.total.toLocaleString()}, Due: ${new Date(invoice.dueDate).toLocaleDateString()}`
    });
  }
  
  async sendLowInventoryAlert(item: any, adminEmail: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #DC2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .alert-box { background: #FEE2E2; border-left: 4px solid #DC2626; padding: 15px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Low Inventory Alert</h1>
          </div>
          <div class="content">
            <div class="alert-box">
              <h3>Inventory Item Low in Stock</h3>
              <p><strong>Item:</strong> ${item.itemName}</p>
              <p><strong>SKU:</strong> ${item.sku || 'N/A'}</p>
              <p><strong>Category:</strong> ${item.category}</p>
              <p><strong>Current Quantity:</strong> ${item.quantity} ${item.unit}</p>
              <p><strong>Minimum Stock Level:</strong> ${item.minStockLevel} ${item.unit}</p>
            </div>
            
            <p>This item has reached or fallen below the minimum stock level. Please restock as soon as possible.</p>
            
            ${item.supplier ? `
              <h4>Supplier Information:</h4>
              <p><strong>Name:</strong> ${item.supplier.name}</p>
              <p><strong>Contact:</strong> ${item.supplier.contact}</p>
              ${item.supplier.email ? `<p><strong>Email:</strong> ${item.supplier.email}</p>` : ''}
            ` : ''}
          </div>
          <div class="footer">
            <p>This is an automated alert from GHS3 Inventory Management</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return this.sendEmail({
      to: adminEmail,
      subject: `🚨 Low Inventory Alert: ${item.itemName}`,
      html
    });
  }
  
  async sendPaymentConfirmation(invoice: any, customerEmail: string, paymentAmount: number): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .success-box { background: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Received</h1>
          </div>
          <div class="content">
            <p>Dear Valued Customer,</p>
            <p>Thank you! We have received your payment.</p>
            
            <div class="success-box">
              <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
              <p><strong>Payment Received:</strong> Ksh ${paymentAmount.toLocaleString()}</p>
              <p><strong>Remaining Balance:</strong> Ksh ${invoice.balance.toLocaleString()}</p>
              <p><strong>Payment Status:</strong> <span style="color: #10B981; font-weight: bold;">${invoice.paymentStatus.toUpperCase()}</span></p>
            </div>
            
            <p>Thank you for your business!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} GHS3 Garage Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return this.sendEmail({
      to: customerEmail,
      subject: `Payment Confirmation - Invoice #${invoice.invoiceNumber}`,
      html
    });
  }
}

export const emailService = new EmailService();
