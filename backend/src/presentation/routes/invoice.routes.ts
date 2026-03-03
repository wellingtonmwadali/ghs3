import { Router } from 'express';
import { InvoiceController } from '../controllers/Invoice.controller';
import { validate } from '../middlewares/validation.middleware';
import { createInvoiceSchema, addPaymentSchema } from '../../application/dto/validation.schemas';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();
const invoiceController = new InvoiceController();

// All routes require authentication
router.use(authenticate);

router.get('/revenue-stats', authorize('owner', 'manager'), invoiceController.getRevenueStats);
router.get('/outstanding', authorize('owner', 'manager'), invoiceController.getOutstandingInvoices);

router.post('/', authorize('owner', 'manager', 'receptionist'), validate(createInvoiceSchema), invoiceController.createInvoice);
router.get('/:id', invoiceController.getInvoiceById);
router.post('/:id/payment', authorize('owner', 'manager', 'receptionist'), validate(addPaymentSchema), invoiceController.addPayment);

export default router;
