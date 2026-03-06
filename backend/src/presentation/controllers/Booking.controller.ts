import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../../application/services/Booking.service';

export class BookingController {
  private bookingService: BookingService;

  constructor() {
    this.bookingService = new BookingService();
  }

  createBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await this.bookingService.createBooking(req.body);
      res.status(201).json({
        success: true,
        data: booking,
        message: 'Booking created successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  updateBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const booking = await this.bookingService.updateBooking(id, req.body);
      res.json({
        success: true,
        data: booking
      });
    } catch (error) {
      next(error);
    }
  };

  getBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const booking = await this.bookingService.getBookingById(id);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
      res.json({
        success: true,
        data: booking
      });
    } catch (error) {
      next(error);
    }
  };

  getBookingByReference = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reference } = req.params;
      const booking = await this.bookingService.getBookingByReference(reference);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
      res.json({
        success: true,
        data: booking
      });
    } catch (error) {
      next(error);
    }
  };

  getAllBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, status, serviceType, page, limit } = req.query;
      const result = await this.bookingService.getAllBookings({
        search: search as string,
        status: status as string,
        serviceType: serviceType as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });
      res.json({
        success: true,
        data: result.bookings,
        pagination: {
          total: result.total,
          page: result.page,
          pages: result.pages
        }
      });
    } catch (error) {
      next(error);
    }
  };

  deleteBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.bookingService.deleteBooking(id);
      res.json({
        success: true,
        message: 'Booking deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  confirmBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const booking = await this.bookingService.confirmBooking(id);
      res.json({
        success: true,
        data: booking,
        message: 'Booking confirmed'
      });
    } catch (error) {
      next(error);
    }
  };

  cancelBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const booking = await this.bookingService.cancelBooking(id, reason);
      res.json({
        success: true,
        data: booking,
        message: 'Booking cancelled'
      });
    } catch (error) {
      next(error);
    }
  };

  completeBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const booking = await this.bookingService.completeBooking(id);
      res.json({
        success: true,
        data: booking,
        message: 'Booking completed'
      });
    } catch (error) {
      next(error);
    }
  };

  getPendingBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookings = await this.bookingService.getPendingBookings();
      res.json({
        success: true,
        data: bookings
      });
    } catch (error) {
      next(error);
    }
  };

  getTodaysBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookings = await this.bookingService.getTodaysBookings();
      res.json({
        success: true,
        data: bookings
      });
    } catch (error) {
      next(error);
    }
  };
}
