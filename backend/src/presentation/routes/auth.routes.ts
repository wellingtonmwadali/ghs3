import { Router } from 'express';
import { AuthController } from '../controllers/Auth.controller';
import { validate } from '../middlewares/validation.middleware';
import { loginSchema, registerSchema, refreshTokenSchema, changePasswordSchema } from '../../application/dto/validation.schemas';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { loginRateLimiter, registerRateLimiter, sanitizeInput } from '../middlewares/security.middleware';

const router = Router();
const authController = new AuthController();

// Apply input sanitization to all routes
router.use(sanitizeInput);

// Public
router.post('/login', loginRateLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);

// Protected — any authenticated user
router.post('/logout', authenticate, authController.logout);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.get('/profile', authenticate, authController.getProfile);

// Protected — owner/manager only
router.post('/register', authenticate, authorize('owner', 'manager'), registerRateLimiter, validate(registerSchema), authController.register);
router.get('/users', authenticate, authorize('owner', 'manager'), authController.getAllUsers);
router.patch('/users/:id/toggle-active', authenticate, authorize('owner', 'manager'), authController.toggleUserActive);

export default router;
