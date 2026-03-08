import { AttendanceModel } from '../../infrastructure/models/Attendance.model';
import { ClockInDTO, ClockOutDTO, AttendanceReport } from '../entities/Attendance';

export class AttendanceService {
  async clockIn(data: ClockInDTO) {
    try {
      // Check if mechanic is already clocked in today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingAttendance = await AttendanceModel.findOne({
        mechanicId: data.mechanicId,
        date: today,
        status: 'clocked-in'
      });

      if (existingAttendance) {
        throw new Error('Already clocked in today. Please clock out first.');
      }

      const attendance = new AttendanceModel({
        mechanicId: data.mechanicId,
        mechanicName: data.mechanicName,
        clockInTime: new Date(),
        status: 'clocked-in',
        location: data.location,
        notes: data.notes
      });

      await attendance.save();
      console.log(`✅ ${data.mechanicName} clocked in at ${new Date().toLocaleTimeString()}`);
      return attendance;
    } catch (error: any) {
      console.error('Error clocking in:', error);
      throw error;
    }
  }

  async clockOut(mechanicId: string, data: ClockOutDTO) {
    try {
      // Find today's attendance record for this mechanic
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const attendance = await AttendanceModel.findOne({
        mechanicId,
        date: today,
        status: 'clocked-in'
      });

      if (!attendance) {
        throw new Error('No active clock-in found for today. Please clock in first.');
      }

      attendance.clockOutTime = new Date();
      attendance.status = 'clocked-out';
      
      if (data.notes) {
        attendance.notes = data.notes;
      }

      if (data.location) {
        attendance.location = data.location;
      }

      await attendance.save();
      
      console.log(`✅ ${attendance.mechanicName} clocked out at ${new Date().toLocaleTimeString()} - Total hours: ${attendance.totalHours}`);
      return attendance;
    } catch (error: any) {
      console.error('Error clocking out:', error);
      throw error;
    }
  }

  async getTodayAttendance() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return await AttendanceModel.find({
        date: { $gte: today, $lt: tomorrow }
      }).sort({ clockInTime: -1 });
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      throw error;
    }
  }

  async getMechanicAttendance(mechanicId: string, startDate?: Date, endDate?: Date) {
    try {
      const query: any = { mechanicId };

      if (startDate || endDate) {
        query.date = {};
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          query.date.$gte = start;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.date.$lte = end;
        }
      }

      return await AttendanceModel.find(query).sort({ date: -1 });
    } catch (error) {
      console.error('Error fetching mechanic attendance:', error);
      throw error;
    }
  }

  async getAttendanceReport(mechanicId: string, startDate: Date, endDate: Date): Promise<AttendanceReport> {
    try {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const records = await AttendanceModel.find({
        mechanicId,
        date: { $gte: start, $lte: end }
      }).sort({ date: -1 });

      if (records.length === 0) {
        throw new Error('No attendance records found for the specified period');
      }

      const presentDays = records.filter(r => r.status === 'clocked-out').length;
      const totalHours = records.reduce((sum, r) => sum + (r.totalHours || 0), 0);

      // Calculate total days in range
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        mechanicId,
        mechanicName: records[0].mechanicName,
        totalDays,
        presentDays,
        absentDays: totalDays - presentDays,
        totalHours: Math.round(totalHours * 100) / 100,
        averageHoursPerDay: presentDays > 0 ? Math.round((totalHours / presentDays) * 100) / 100 : 0,
        attendanceRecords: records as any
      };
    } catch (error) {
      console.error('Error generating attendance report:', error);
      throw error;
    }
  }

  async getAllMechanicsAttendanceToday() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return await AttendanceModel.find({
        date: { $gte: today, $lt: tomorrow }
      }).sort({ clockInTime: -1 });
    } catch (error) {
      console.error('Error fetching all mechanics attendance:', error);
      throw error;
    }
  }

  async getAttendanceStats(startDate: Date, endDate: Date) {
    try {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const stats = await AttendanceModel.aggregate([
        {
          $match: {
            date: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$mechanicId',
            mechanicName: { $first: '$mechanicName' },
            totalDays: { $sum: 1 },
            presentDays: {
              $sum: {
                $cond: [{ $eq: ['$status', 'clocked-out'] }, 1, 0]
              }
            },
            totalHours: {
              $sum: {
                $cond: [{ $ne: ['$totalHours', null] }, '$totalHours', 0]
              }
            }
          }
        },
        {
          $project: {
            mechanicId: '$_id',
            mechanicName: 1,
            totalDays: 1,
            presentDays: 1,
            totalHours: { $round: ['$totalHours', 2] },
            averageHoursPerDay: {
              $round: [
                {
                  $cond: [
                    { $gt: ['$presentDays', 0] },
                    { $divide: ['$totalHours', '$presentDays'] },
                    0
                  ]
                },
                2
              ]
            }
          }
        },
        {
          $sort: { totalHours: -1 }
        }
      ]);

      return stats;
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      throw error;
    }
  }

  async getCurrentStatus(mechanicId: string) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const attendance = await AttendanceModel.findOne({
        mechanicId,
        date: today
      }).sort({ clockInTime: -1 });

      return attendance;
    } catch (error) {
      console.error('Error fetching current status:', error);
      throw error;
    }
  }
}
