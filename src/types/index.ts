export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT';

export interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  positionGradeId: string;
  email: string;
  joinDate: string;
  status: 'Active' | 'Inactive';
  role: 'employee' | 'admin';
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  checkIn: string | null; // HH:MM
  checkOut: string | null; // HH:MM
  status: AttendanceStatus;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface SessionUser {
  username: string;
  employeeId: string;
  name: string;
  role: 'employee' | 'admin';
}

export type Route =
  | 'login'
  | 'employee-dashboard'
  | 'history'
  | 'payslips'
  | 'profile'
  | 'admin-dashboard'
  | 'employees'
  | 'attendance'
  | 'payroll'
  | 'reports'
  | 'employee-detail';

export type PayslipStatus = 'DRAFT' | 'PUBLISHED' | 'PAID';

export interface SalaryRule {
  id: string;
  name: string;
  baseSalary: number;
  allowancePercentage: number;
}

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string; // YYYY-MM
  positionGradeId: string;
  positionTitle: string;
  salaryGrade: string;
  baseSalary: number;
  allowance: number;
  absentDays: number;
  deduction: number;
  grossSalary: number;
  netSalary: number;
  status: PayslipStatus;
  pin: string;
  issuedDate: string | null; // YYYY-MM-DD
}
