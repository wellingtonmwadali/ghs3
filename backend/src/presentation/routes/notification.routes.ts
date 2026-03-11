import { Router } from 'express';
import { NotificationController } from '../controllers/Notification.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();
const notificationController = new NotificationController();

// All notification routes require authentication and owner/manager role
router.use(authenticate);
router.use(authorize('owner', 'manager'));

// Manual notification triggers
router.post('/check-inventory', notificationController.checkInventory);
router.post('/check-late-services', notificationController.checkLateServices);
router.post('/check-all', notificationController.checkAll);

export default router;
