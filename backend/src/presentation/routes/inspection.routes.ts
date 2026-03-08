import { Router } from 'express';
import { InspectionController } from '../controllers/Inspection.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();
const inspectionController = new InspectionController();

// All routes require authentication
router.use(authenticate);

// Get all inspections (with optional filters)
router.get('/', inspectionController.getAllInspections.bind(inspectionController));

// Get inspections by booking ID
router.get('/booking/:bookingId', inspectionController.getInspectionsByBooking.bind(inspectionController));

// Get inspection by ID
router.get('/:id', inspectionController.getInspectionById.bind(inspectionController));

// Create new inspection (mechanics only)
router.post('/', authorize('owner', 'manager', 'mechanic'), inspectionController.createInspection.bind(inspectionController));

// Update inspection (only when status is pending)
router.put('/:id', authorize('owner', 'manager', 'mechanic'), inspectionController.updateInspection.bind(inspectionController));

// Approve inspection (auto-deducts inventory and generates invoice) - managers/owners only
router.post('/:id/approve', authorize('owner', 'manager'), inspectionController.approveInspection.bind(inspectionController));

// Reject inspection - managers/owners only
router.post('/:id/reject', authorize('owner', 'manager'), inspectionController.rejectInspection.bind(inspectionController));

export default router;
