import { Router } from 'express';
import { AuthController } from '../controllers/Auth.controller';
import { validate } from '../middlewares/validation.middleware';
import { loginSchema, registerSchema } from '../../application/dto/validation.schemas';
import { authenticate } from '../middlewares/auth.middleware';
import { loginRateLimiter, registerRateLimiter, sanitizeInput } from '../middlewares/security.middleware';

const router = Router();
const authController = new AuthController();

// Apply input sanitization to all routes
router.use(sanitizeInput);

router.post('/register', registerRateLimiter, validate(registerSchema), authController.register);
router.post('/login', loginRateLimiter, validate(loginSchema), authController.login);
router.get('/profile', authenticate, authController.getProfile);

export default router;
