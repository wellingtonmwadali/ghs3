import { Router } from 'express';
import { AuthController } from '../controllers/Auth.controller';
import { validate } from '../middlewares/validation.middleware';
import { loginSchema, registerSchema } from '../../application/dto/validation.schemas';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { loginRateLimiter, registerRateLimiter, sanitizeInput } from '../middlewares/security.middleware';

const router = Router();
const authController = new AuthController();

// Apply input sanitization to all routes
router.use(sanitizeInput);

router.post('/register', registerRateLimiter, validate(registerSchema), authController.register);
router.post('/login', loginRateLimiter, validate(loginSchema), authController.login);
router.get('/profile', authenticate, authController.getProfile);
router.get('/users', authenticate, authorize('owner', 'manager'), authController.getAllUsers);
router.patch('/users/:id/toggle-active', authenticate, authorize('owner', 'manager'), authController.toggleUserActive);

export default router;
