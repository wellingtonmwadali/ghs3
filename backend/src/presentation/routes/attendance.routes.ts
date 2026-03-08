import { Router } from 'express';
import { AttendanceController } from '../controllers/Attendance.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();
const attendanceController = new AttendanceController();

// All routes require authentication
router.use(authenticate);

// Clock in (mechanics only)
router.post('/clock-in', authorize('mechanic'), attendanceController.clockIn.bind(attendanceController));

// Clock out (mechanics only)
router.post('/clock-out', authorize('mechanic'), attendanceController.clockOut.bind(attendanceController));

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
