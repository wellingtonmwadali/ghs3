import { Router } from 'express';
import { BookingController } from '../controllers/Booking.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const bookingController = new BookingController();

// Public route - create booking (for online integration)
router.post('/public', bookingController.createBooking);

// Get booking by reference (public - for customers)
router.get('/public/:reference', bookingController.getBookingByReference);

// Apply authentication middleware to all other routes
router.use(authenticate);

// Get pending bookings
router.get('/pending', bookingController.getPendingBookings);

// Get today's bookings
router.get('/today', bookingController.getTodaysBookings);

// Get all bookings with filters
router.get('/', bookingController.getAllBookings);

// Create booking (admin)
router.post('/', bookingController.createBooking);

// Get booking by ID
router.get('/:id', bookingController.getBooking);

// Update booking
router.put('/:id', bookingController.updateBooking);

// Confirm booking
router.post('/:id/confirm', bookingController.confirmBooking);

// Cancel booking
router.post('/:id/cancel', bookingController.cancelBooking);

// Complete booking
router.post('/:id/complete', bookingController.completeBooking);

// Delete booking
router.delete('/:id', bookingController.deleteBooking);

export default router;
