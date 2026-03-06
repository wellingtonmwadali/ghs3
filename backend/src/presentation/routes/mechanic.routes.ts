import { Router } from 'express';
import { MechanicController } from '../controllers/Mechanic.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const mechanicController = new MechanicController();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get birthdays this month
router.get('/birthdays', mechanicController.getBirthdaysThisMonth);

// Get top performers
router.get('/top-performers', mechanicController.getTopPerformers);

// Get available mechanics
router.get('/available', mechanicController.getAvailableMechanics);

// Create mechanic
router.post('/', mechanicController.createMechanic);

// Get all mechanics with filters
router.get('/', mechanicController.getAllMechanics);

// Get mechanic by ID
router.get('/:id', mechanicController.getMechanic);

// Update mechanic
router.put('/:id', mechanicController.updateMechanic);

// Assign job to mechanic
router.post('/:id/assign-job', mechanicController.assignJob);

// Complete job
router.post('/:id/complete-job', mechanicController.completeJob);

// Delete mechanic
router.delete('/:id', mechanicController.deleteMechanic);

export default router;
