import dotenv from 'dotenv';
dotenv.config();

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { connectDatabase } from './infrastructure/database/connection';
import { errorHandler, notFound } from './presentation/middlewares/error.middleware';
import { securityHeaders, trackSuspiciousActivity, sanitizeInput } from './presentation/middlewares/security.middleware';
import { CronJobService } from './infrastructure/services/CronJob.service';

// Routes
import authRoutes from './presentation/routes/auth.routes';
import carRoutes from './presentation/routes/car.routes';
import invoiceRoutes from './presentation/routes/invoice.routes';
import customerRoutes from './presentation/routes/customer.routes';
import mechanicRoutes from './presentation/routes/mechanic.routes';
import inventoryRoutes from './presentation/routes/inventory.routes';
import settingsRoutes from './presentation/routes/settings.routes';
import bookingRoutes from './presentation/routes/booking.routes';
import inspectionRoutes from './presentation/routes/inspection.routes';
import attendanceRoutes from './presentation/routes/attendance.routes';
import notificationRoutes from './presentation/routes/notification.routes';
import expenseRoutes from './presentation/routes/expense.routes';
import receiptRoutes from './presentation/routes/receipt.routes';

const app: Application = express();
const PORT = process.env.PORT || 5000;

// CORS must come first — before helmet and security middleware
app.use(cors({
  origin: (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(s => s.trim()),
  credentials: true
}));

// Security middleware
app.use(helmet());
app.use(securityHeaders);
app.use(trackSuspiciousActivity);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression() as any);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/mechanics', mechanicRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/receipts', receiptRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDatabase();

    // Initialize cron jobs
    const cronJobService = new CronJobService();
    await cronJobService.initialize();

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API: http://localhost:${PORT}/api`);
      console.log(`💚 Health: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

export default app;
