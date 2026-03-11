// Domain Entity: Mechanic (Staff)
export interface IMechanic {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  specialization: 'painter' | 'detailer' | 'installer' | 'technician' | 'all';
  skills: string[];
  
  activeJobs: string[]; // Car IDs
  completedJobs: string[]; // Car IDs
  
  performance: {
    totalJobsCompleted: number;
    averageTurnaroundTime: number; // in hours
    customerRating: number; // 0-5
  };
  
  laborHoursLogged: number;
  
  availability: 'available' | 'busy' | 'off';
  
  hireDate: Date;
  birthday?: Date;
  salary?: number;
  
  createdAt?: Date;
  updatedAt?: Date;
}
