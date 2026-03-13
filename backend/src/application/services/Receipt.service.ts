import { emailService } from '../../infrastructure/services/Email.service';
import { SettingsRepository } from '../../infrastructure/repositories/Settings.repository';

export interface Receipt {
  receiptNumber: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: string;
  paymentReference?: string;
  vehiclePlate: string;
  vehicleModel: string;
  serviceType: string;
}

export class ReceiptService {
  private settingsRepository: SettingsRepository;

  constructor() {
    this.settingsRepository = new SettingsRepository();
  }

  async generateReceipt(receiptData: Receipt): Promise<string> {
    const settings = await this.settingsRepository.getSettings();
    const companyInfo = settings?.companyInfo || {
      name: 'GHS3 Garage',
      email: 'info@ghs3garage.com',
      phone: '+254 700 000 000',
      address: 'Nairobi, Kenya'
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Receipt - ${receiptData.receiptNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; padding: 20px; }
          .container { max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
          .header h1 { font-size: 32px; margin-bottom: 10px; }
          .header p { opacity: 0.9; font-size: 18px; }
          .receipt-number { background: rgba(255,255,255,0.2); display: inline-block; padding: 10px 20px; border-radius: 5px; margin-top: 15px; font-weight: bold; letter-spacing: 1px; }
          .content { padding: 40px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 14px; text-transform: uppercase; color: #888; margin-bottom: 10px; font-weight: 600; letter-spacing: 0.5px; }
          .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
          .info-label { color: #666; font-weight: 500; }
          .info-value { font-weight: 600; color: #333; text-align: right; }
          .amount-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; }
          .amount-box .label { font-size: 14px; color: #666; margin-bottom: 5px; }
          .amount-box .amount { font-size: 36px; font-weight: bold; color: #667eea; }
          .payment-info { background: #e8f5e9; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .payment-info .success-icon { color: #4caf50; font-size: 48px; text-align: center; margin-bottom: 15px; }
          .vehicle-details { background: #fff3e0; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 2px solid #eee; }
          .footer .company-name { font-weight: bold; font-size: 18px; margin-bottom: 10px; }
          .footer .contact { color: #666; margin: 5px 0; }
          .thank-you { text-align: center; padding: 30px; font-size: 18px; color: #667eea; font-weight: 600; }
          .print-button { background: #667eea; color: white; padding: 12px 30px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; margin: 20px auto; display: block; }
          @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
            .print-button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧾 Payment Receipt</h1>
            <p>Official Payment Confirmation</p>
            <div class="receipt-number">Receipt: ${receiptData.receiptNumber}</div>
          </div>

          <div class="content">
            <div class="payment-info">
              <div class="success-icon">✓</div>
              <h2 style="text-align: center; color: #4caf50; margin-bottom: 10px;">Payment Successful</h2>
              <p style="text-align: center; color: #666;">Your payment has been received and processed</p>
            </div>

            <div class="amount-box">
              <div class="label">Total Amount Paid</div>
              <div class="amount">KES ${receiptData.amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</div>
            </div>

            <div class="section">
              <div class="section-title">Customer Information</div>
              <div class="info-row">
                <span class="info-label">Customer Name</span>
                <span class="info-value">${receiptData.customerName}</span>
              </div>
              ${receiptData.customerEmail ? `
              <div class="info-row">
                <span class="info-label">Email</span>
                <span class="info-value">${receiptData.customerEmail}</span>
              </div>
              ` : ''}
            </div>

            <div class="section">
              <div class="section-title">Payment Details</div>
              <div class="info-row">
                <span class="info-label">Payment Date</span>
                <span class="info-value">${new Date(receiptData.paymentDate).toLocaleString('en-KE', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment Method</span>
                <span class="info-value">${this.formatPaymentMethod(receiptData.paymentMethod)}</span>
              </div>
              ${receiptData.paymentReference ? `
              <div class="info-row">
                <span class="info-label">Reference Number</span>
                <span class="info-value">${receiptData.paymentReference}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="info-label">Invoice Number</span>
                <span class="info-value">${receiptData.invoiceNumber}</span>
              </div>
            </div>

            <div class="vehicle-details">
              <div class="section-title">Vehicle & Service Details</div>
              <div class="info-row">
                <span class="info-label">Vehicle</span>
                <span class="info-value">${receiptData.vehicleModel}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Plate Number</span>
                <span class="info-value">${receiptData.vehiclePlate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Service Type</span>
                <span class="info-value">${this.formatServiceType(receiptData.serviceType)}</span>
              </div>
            </div>

            <div class="thank-you">
              Thank you for your business! 🙏
            </div>
          </div>

          <div class="footer">
            <div class="company-name">${companyInfo.name}</div>
            <div class="contact">📧 ${companyInfo.email}</div>
            <div class="contact">📞 ${companyInfo.phone}</div>
            <div class="contact">📍 ${companyInfo.address}</div>
            <div style="margin-top: 20px; color: #999; font-size: 12px;">
              This is an electronically generated receipt. For any queries, please contact us.
            </div>
          </div>
        </div>

        <button class="print-button" onclick="window.print()">🖨️ Print Receipt</button>
      </body>
      </html>
    `;

    return html;
  }

  async sendReceiptEmail(receiptData: Receipt, recipientEmail: string): Promise<boolean> {
    try {
      const receiptHtml = await this.generateReceipt(receiptData);
      
      await emailService.sendEmail({
        to: recipientEmail,
        subject: `Payment Receipt - ${receiptData.receiptNumber}`,
        html: receiptHtml,
        text: `Payment receipt for ${receiptData.amount} KES. Receipt: ${receiptData.receiptNumber}`
      });

      console.log(`[RECEIPT] Sent to ${recipientEmail}`);
      return true;
    } catch (error) {
      console.error('[RECEIPT] Failed to send email:', error);
      return false;
    }
  }

  private formatPaymentMethod(method: string): string {
    const methods: { [key: string]: string } = {
      cash: '💵 Cash',
      card: '💳 Card Payment',
      mpesa: '📱 M-Pesa',
      transfer: '🏦 Bank Transfer',
      insurance: '🛡️ Insurance'
    };
    return methods[method] || method;
  }

  private formatServiceType(type: string): string {
    const types: { [key: string]: string } = {
      colour_repair: '🎨 Colour & Repair',
      clean_shine: '✨ Clean & Shine',
      coat_guard: '🛡️ Coat & Guard'
    };
    return types[type] || type;
  }

  generateReceiptNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `RCP-${year}${month}${day}-${random}`;
  }
}

export const receiptService = new ReceiptService();
