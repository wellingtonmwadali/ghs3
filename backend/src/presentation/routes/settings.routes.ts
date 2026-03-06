import { Router } from 'express';
import { SettingsController } from '../controllers/Settings.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const settingsController = new SettingsController();

router.get('/', authenticate, settingsController.getSettings);
router.post('/', authenticate, settingsController.updateSettings);
router.get('/announcements/active', authenticate, settingsController.getActiveAnnouncements);
router.get('/holidays/upcoming', authenticate, settingsController.getUpcomingHolidays);

export default router;
