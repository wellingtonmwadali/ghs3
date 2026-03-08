export interface Attendance {
  _id: string;
  mechanicId: string;
  mechanicName: string;
  date: Date;
  clockInTime: Date;
  clockOutTime?: Date;
  totalHours?: number;
  status: 'clocked-in' | 'clocked-out' | 'absent' | 'on-leave';
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ClockInDTO {
  mechanicId: string;
  mechanicName: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

export interface ClockOutDTO {
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface AttendanceReport {
  mechanicId: string;
  mechanicName: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  totalHours: number;
  averageHoursPerDay: number;
  attendanceRecords: Attendance[];
}
