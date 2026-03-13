import { Router } from 'express';
import { ReceiptController } from '../controllers/Receipt.controller';
import { validate } from '../middlewares/validation.middleware';
import { generateReceiptSchema } from '../../application/dto/validation.schemas';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();
const receiptController = new ReceiptController();

// All routes require authentication
router.use(authenticate);

// Receipt routes
router.post('/generate', authorize('owner', 'manager', 'receptionist'), validate(generateReceiptSchema), receiptController.generateReceipt);
router.post('/email', authorize('owner', 'manager', 'receptionist'), validate(generateReceiptSchema), receiptController.emailReceipt);

export default router;
