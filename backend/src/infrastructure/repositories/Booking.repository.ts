import { BookingModel, IBookingDocument } from '../models/Booking.model';
import { IBooking } from '../../domain/entities/Booking';

export class BookingRepository {
  async create(bookingData: IBooking): Promise<IBookingDocument> {
    const booking = new BookingModel(bookingData);
    return await booking.save();
  }

  async findById(id: string): Promise<IBookingDocument | null> {
    return await BookingModel.findById(id);
  }

  async findAll(status?: string): Promise<IBookingDocument[]> {
    const query = status ? { status } : {};
    return await BookingModel.find(query).sort({ preferredDate: 1 });
  }

  async update(id: string, updateData: Partial<IBooking>): Promise<IBookingDocument | null> {
    return await BookingModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await BookingModel.findByIdAndDelete(id);
    return !!result;
  }

  async getPendingBookings(): Promise<IBookingDocument[]> {
    return await BookingModel.find({ status: 'pending' }).sort({ createdAt: 1 });
  }

  async getUpcomingBookings(): Promise<IBookingDocument[]> {
    const today = new Date();
    return await BookingModel.find({
      status: 'confirmed',
      preferredDate: { $gte: today }
    }).sort({ preferredDate: 1 });
  }

  async findWithPagination(query: any, skip: number, limit: number): Promise<IBookingDocument[]> {
    return await BookingModel.find(query)
      .sort({ preferredDate: -1 })
      .skip(skip)
      .limit(limit);
  }

  async count(query: any): Promise<number> {
    return await BookingModel.countDocuments(query);
  }

  async findByReference(reference: string): Promise<IBookingDocument | null> {
    return await BookingModel.findOne({ bookingReference: reference });
  }

  async findPendingBookings(): Promise<IBookingDocument[]> {
    return await BookingModel.find({ status: 'pending' }).sort({ createdAt: -1 });
  }
}
