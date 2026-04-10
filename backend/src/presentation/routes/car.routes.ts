import { Router } from 'express';
import { CarController } from '../controllers/Car.controller';
import { validate } from '../middlewares/validation.middleware';
import { createCarSchema, updateCarSchema } from '../../application/dto/validation.schemas';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();
const carController = new CarController();

// All routes require authentication
router.use(authenticate);

router.get('/dashboard', carController.getDashboardStats);
router.get('/garage-board', carController.getGarageBoardData);

router.post('/', authorize('owner', 'manager', 'receptionist'), validate(createCarSchema), carController.createCar);
router.get('/', carController.getAllCars);
router.get('/:id', carController.getCarById);
router.put('/:id', authorize('owner', 'manager', 'mechanic'), validate(updateCarSchema), carController.updateCar);
router.delete('/:id', authorize('owner', 'manager'), carController.deleteCar);

// Job card workflow actions
router.post('/:id/pause', authorize('owner', 'manager', 'mechanic'), carController.pauseCar);
router.post('/:id/resume', authorize('owner', 'manager', 'mechanic'), carController.resumeCar);
router.post('/:id/approve', authorize('owner', 'manager'), carController.approveCar);
router.post('/:id/reject', authorize('owner', 'manager'), carController.rejectCar);

export default router;
