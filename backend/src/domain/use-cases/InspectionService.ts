import { InspectionModel } from '../../infrastructure/models/Inspection.model';
import { InventoryModel } from '../../infrastructure/models/Inventory.model';
import { InvoiceModel } from '../../infrastructure/models/Invoice.model';
import { BookingModel } from '../../infrastructure/models/Booking.model';
import { CarModel } from '../../infrastructure/models/Car.model';
import { CustomerModel } from '../../infrastructure/models/Customer.model';
import { CreateInspectionDTO, UpdateInspectionDTO } from '../entities/Inspection';
import { EmailService } from '../../infrastructure/services/Email.service';
import { SettingsModel } from '../../infrastructure/models/Settings.model';

export class InspectionService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  async createInspection(data: CreateInspectionDTO, mechanicId: string) {
    try {
      // Check stock availability for each part
      const partsWithStock = await Promise.all(
        data.requiredParts.map(async (part) => {
          const inventory = await InventoryModel.findById(part.inventoryId);
          const inStock = inventory ? inventory.quantity >= part.quantity : false;
          
          return {
            ...part,
            inStock,
            supplierInfo: inventory?.supplier?.contact || 'N/A'
          };
        })
      );

      const inspection = new InspectionModel({
        ...data,
        mechanicId,
        requiredParts: partsWithStock
      });

      await inspection.save();

      // Check for out-of-stock parts and send email alert
      const outOfStockParts = partsWithStock.filter(part => !part.inStock);
      if (outOfStockParts.length > 0) {
        await this.sendLowStockAlert(inspection._id.toString(), outOfStockParts);
      }

      return inspection;
    } catch (error) {
      console.error('Error creating inspection:', error);
      throw error;
    }
  }

  async approveInspection(inspectionId: string, approvedBy: string) {
    try {
      const inspection = await InspectionModel.findById(inspectionId);
      
      if (!inspection) {
        throw new Error('Inspection not found');
      }

      if (inspection.status !== 'pending') {
        throw new Error('Inspection is not in pending status');
      }

      // Check if all parts are in stock
      const outOfStockParts = inspection.requiredParts.filter(part => !part.inStock);
      if (outOfStockParts.length > 0) {
        throw new Error(`Cannot approve: ${outOfStockParts.length} part(s) out of stock`);
      }

      // Deduct inventory for each part
      for (const part of inspection.requiredParts) {
        const inventory = await InventoryModel.findById(part.inventoryId);
        
        if (!inventory) {
          throw new Error(`Inventory item ${part.partName} not found`);
        }

        if (inventory.quantity < part.quantity) {
          throw new Error(`Insufficient stock for ${part.partName}`);
        }

        // Deduct the quantity
        inventory.quantity -= part.quantity;
        
        // Check if it's below minimum stock level
        if (inventory.quantity <= inventory.minStockLevel) {
          await this.sendLowInventoryAlert(inventory);
        }

        await inventory.save();
      }

      // Update inspection status
      inspection.status = 'approved';
      inspection.approvedBy = approvedBy;
      inspection.approvedAt = new Date();
      await inspection.save();

      // Auto-generate invoice
      const invoice = await this.generateInvoice(inspection);
      
      // Link invoice to inspection
      inspection.invoiceId = invoice._id.toString();
      await inspection.save();

      // Update booking status
      await BookingModel.findByIdAndUpdate(inspection.bookingId, {
        status: 'in-progress'
      });

      // Send invoice email to customer
      const customer = await CustomerModel.findById(inspection.customerId);
      if (customer && customer.email) {
        await this.emailService.sendInvoiceEmail(invoice, customer.email);
      }

      return { inspection, invoice };
    } catch (error) {
      console.error('Error approving inspection:', error);
      throw error;
    }
  }

  async rejectInspection(inspectionId: string, rejectionReason: string) {
    try {
      const inspection = await InspectionModel.findById(inspectionId);
      
      if (!inspection) {
        throw new Error('Inspection not found');
      }

      inspection.status = 'rejected';
      inspection.rejectionReason = rejectionReason;
      await inspection.save();

      return inspection;
    } catch (error) {
      console.error('Error rejecting inspection:', error);
      throw error;
    }
  }

  private async generateInvoice(inspection: any) {
    try {
      const car = await CarModel.findById(inspection.vehicleId);
      const customer = await CustomerModel.findById(inspection.customerId);

      // Generate invoice number
      const lastInvoice = await InvoiceModel.findOne().sort({ createdAt: -1 });
      const lastNumber = lastInvoice ? parseInt(lastInvoice.invoiceNumber.split('-')[1]) : 0;
      const invoiceNumber = `INV-${String(lastNumber + 1).padStart(6, '0')}`;

      // Prepare items
      const items = [
        ...inspection.requiredParts.map((part: any) => ({
          description: part.partName,
          quantity: part.quantity,
          unitPrice: part.unitPrice,
          total: part.quantity * part.unitPrice
        })),
        ...inspection.requiredServices.map((service: any) => ({
          description: `${service.name} - ${service.description}`,
          quantity: 1,
          unitPrice: service.price,
          total: service.price
        }))
      ];

      const invoice = new InvoiceModel({
        invoiceNumber,
        customerId: inspection.customerId,
        customerName: customer?.name || 'Unknown',
        vehicleId: inspection.vehicleId,
        vehicleInfo: car ? `${car.vehicleModel} (${car.vehiclePlate})` : 'Unknown',
        bookingId: inspection.bookingId,
        items,
        subtotal: inspection.estimatedCost,
        tax: 0,
        discount: 0,
        total: inspection.estimatedCost,
        amountPaid: 0,
        balance: inspection.estimatedCost,
        status: 'unpaid',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        notes: `Auto-generated from inspection for ${car?.vehicleModel || ''}`
      });

      await invoice.save();

      // Update booking with invoice reference
      await BookingModel.findByIdAndUpdate(inspection.bookingId, {
        $push: { invoiceIds: invoice._id }
      });

      return invoice;
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  }

  private async sendLowStockAlert(inspectionId: string, outOfStockParts: any[]) {
    try {
      const settings = await SettingsModel.findOne();
      if (!settings?.notifications?.lowInventoryAlert || !settings?.companyInfo?.email) {
        return;
      }

      await this.emailService.initialize();

      const partsHtml = outOfStockParts.map(part => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${part.partName}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${part.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${part.supplierInfo || 'N/A'}</td>
        </tr>
      `).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">⚠️ Parts Out of Stock</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Inspection: ${inspectionId}</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              The following parts are required for an inspection but are currently out of stock:
            </p>
            
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Part Name</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Qty Needed</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Supplier</th>
                </tr>
              </thead>
              <tbody>
                ${partsHtml}
              </tbody>
            </table>
            
            <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                <strong>Action Required:</strong> Please order these parts from the suppliers to complete the inspection and proceed with the repair.
              </p>
            </div>
          </div>
          
          <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p>${settings?.companyInfo?.name || 'GHS3'} - ${settings?.companyInfo?.address || ''}</p>
          </div>
        </body>
        </html>
      `;

      await this.emailService.sendEmail({
        to: settings.companyInfo.email,
        subject: `⚠️ Parts Out of Stock - Inspection ${inspectionId}`,
        html
      });

      console.log('✅ Low stock alert sent for inspection:', inspectionId);
    } catch (error) {
      console.error('Error sending low stock alert:', error);
    }
  }

  private async sendLowInventoryAlert(inventory: any) {
    try {
      const settings = await SettingsModel.findOne();
      if (!settings?.companyInfo?.email) {
        return;
      }
      
      await this.emailService.sendLowInventoryAlert(inventory, settings.companyInfo.email);
    } catch (error) {
      console.error('Error sending low inventory alert:', error);
    }
  }

  async getInspectionsByBooking(bookingId: string) {
    return await InspectionModel.find({ bookingId }).sort({ createdAt: -1 });
  }

  async getInspectionById(inspectionId: string) {
    return await InspectionModel.findById(inspectionId)
      .populate('bookingId')
      .populate('vehicleId')
      .populate('customerId')
      .populate('mechanicId');
  }

  async getAllInspections(filters?: { status?: string; mechanicId?: string }) {
    const query: any = {};
    
    if (filters?.status) {
      query.status = filters.status;
    }
    
    if (filters?.mechanicId) {
      query.mechanicId = filters.mechanicId;
    }
    
    return await InspectionModel.find(query)
      .sort({ createdAt: -1 })
      .populate('bookingId')
      .populate('vehicleId')
      .populate('customerId')
      .populate('mechanicId');
  }

  async updateInspection(inspectionId: string, data: UpdateInspectionDTO) {
    try {
      const inspection = await InspectionModel.findById(inspectionId);
      
      if (!inspection) {
        throw new Error('Inspection not found');
      }

      if (inspection.status !== 'pending') {
        throw new Error('Cannot update non-pending inspection');
      }

      // Update fields
      if (data.requiredParts) {
        const partsWithStock = await Promise.all(
          data.requiredParts.map(async (part) => {
            const inventory = await InventoryModel.findById(part.inventoryId);
            const inStock = inventory ? inventory.quantity >= part.quantity : false;
            
            return {
              ...part,
              inStock,
              supplierInfo: inventory?.supplier?.contact || 'N/A'
            };
          })
        );
        inspection.requiredParts = partsWithStock as any;
      }

      if (data.requiredServices) {
        inspection.requiredServices = data.requiredServices as any;
      }

      if (data.additionalNotes !== undefined) {
        inspection.additionalNotes = data.additionalNotes;
      }

      await inspection.save();
      return inspection;
    } catch (error) {
      console.error('Error updating inspection:', error);
      throw error;
    }
  }
}
