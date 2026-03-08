import { Router } from 'express';
import { AttendanceController } from '../controllers/Attendance.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { clockInSchema, clockOutSchema } from '../../application/dto/validation.schemas';

const router = Router();
const attendanceController = new AttendanceController();

// All routes require authentication
router.use(authenticate);

// Clock in/out - mechanics only - with geolocation validation
router.post('/clock-in', authorize('mechanic'), validate(clockInSchema), attendanceController.clockIn.bind(attendanceController));

// Clock out - with geolocation validation
router.post('/clock-out', authorize('mechanic'), validate(clockOutSchema), attendanceController.clockOut.bind(attendanceController));

// Get current status of logged-in mechanic
router.get('/status', authorize('mechanic'), attendanceController.getCurrentStatus.bind(attendanceController));

// Get today's attendance (all mechanics) - managers/owners only
router.get('/today', authorize('owner', 'manager'), attendanceController.getTodayAttendance.bind(attendanceController));

// Get attendance stats for a date range - managers/owners only
router.get('/stats', authorize('owner', 'manager'), attendanceController.getAttendanceStats.bind(attendanceController));

// Get specific mechanic's attendance
router.get('/mechanic/:mechanicId', authorize('owner', 'manager'), attendanceController.getMechanicAttendance.bind(attendanceController));

// Get attendance report for specific mechanic
router.get('/report/:mechanicId', authorize('owner', 'manager'), attendanceController.getAttendanceReport.bind(attendanceController));

export default router;
