import { BookingRepository } from '../../infrastructure/repositories/Booking.repository';
import { IBooking } from '../../domain/entities/Booking';
import { IBookingDocument } from '../../infrastructure/models/Booking.model';

export class BookingService {
  private bookingRepository: BookingRepository;

  constructor() {
    this.bookingRepository = new BookingRepository();
  }

  async createBooking(data: Partial<IBooking>): Promise<IBookingDocument> {
    // Generate booking reference
    const bookingRef = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const booking = await this.bookingRepository.create({
      ...data,
      bookingReference: bookingRef,
      status: 'pending'
    } as IBooking);
    
    return booking;
  }

  async updateBooking(id: string, data: Partial<IBooking>): Promise<IBookingDocument | null> {
    const booking = await this.bookingRepository.update(id, data);
    if (!booking) {
      throw new Error('Booking not found');
    }
    return booking;
  }

  async getBookingById(id: string): Promise<IBookingDocument | null> {
    return await this.bookingRepository.findById(id);
  }

  async getBookingByReference(reference: string): Promise<IBookingDocument | null> {
    return await this.bookingRepository.findByReference(reference);
  }

  async getAllBookings(options: {
    search?: string;
    status?: string;
    serviceType?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ bookings: IBookingDocument[]; total: number; page: number; pages: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    let query: any = {};

    if (options.search) {
      query.$or = [
        { customerName: { $regex: options.search, $options: 'i' } },
        { customerEmail: { $regex: options.search, $options: 'i' } },
        { bookingReference: { $regex: options.search, $options: 'i' } }
      ];
    }

    if (options.status) {
      query.status = options.status;
    }

    if (options.serviceType) {
      query.serviceType = options.serviceType;
    }

    const bookings = await this.bookingRepository.findWithPagination(query, skip, limit);
    const total = await this.bookingRepository.count(query);
    const pages = Math.ceil(total / limit);

    return { bookings, total, page, pages };
  }

  async deleteBooking(id: string): Promise<void> {
    const deleted = await this.bookingRepository.delete(id);
    if (!deleted) {
      throw new Error('Booking not found');
    }
  }

  async confirmBooking(id: string): Promise<IBookingDocument | null> {
    return await this.bookingRepository.update(id, { status: 'confirmed' });
  }

  async cancelBooking(id: string, reason?: string): Promise<IBookingDocument | null> {
    return await this.bookingRepository.update(id, { 
      status: 'cancelled',
      description: reason ? `Cancelled: ${reason}` : 'Cancelled'
    });
  }

  async completeBooking(id: string): Promise<IBookingDocument | null> {
    return await this.bookingRepository.update(id, { status: 'completed' });
  }

  async getPendingBookings(): Promise<IBookingDocument[]> {
    return await this.bookingRepository.findPendingBookings();
  }

  async getTodaysBookings(): Promise<IBookingDocument[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const allBookings = await this.bookingRepository.findAll();
    return allBookings.filter(booking => {
      const bookingDate = new Date(booking.preferredDate);
      return bookingDate >= today && bookingDate < tomorrow;
    });
  }
}
