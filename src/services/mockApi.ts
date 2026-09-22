import { attendance, employees, gradeNameForId, mockUsers, nextEmployeeId, payslips, persistStore, salaryRules } from '../data/mockDatabase';
import type { ApiResponse, AttendanceRecord, AttendanceStatus, Employee, Payslip, PayslipStatus, SalaryRule } from '../types';
import { addMinutesToHHMM, currentMonthISO, nowHHMM, todayISODate } from '../utils/time';

// ---------------------------------------------------------------------------
// Service layer. Simulates network latency and API-style responses.
// There is no real backend.
// ---------------------------------------------------------------------------

function delay(): Promise<void> {
  const ms = 300 + Math.floor(Math.random() * 700);
  return new Promise((r) => setTimeout(r, ms));
}

export function statusForTime(hhmm: string): AttendanceStatus {
  const [h, m] = hhmm.split(':').map(Number);
  if (h < 8) return 'PRESENT';
  if (h === 8 && m === 0) return 'PRESENT';
  return 'LATE';
}

export function displayStatusForTime(hhmm: string): AttendanceStatus {
  const [h, m] = hhmm.split(':').map(Number);
  const mins = h * 60 + m;
  if (mins <= 8 * 60 + 30) return 'PRESENT';
  return 'LATE';
}

export function applyStatusFilter(records: AttendanceRecord[], status: string): AttendanceRecord[] {
  if (!status || status === 'ALL') return records;
  return records.filter((r, idx) => {
    if (r.status === status) return true;
    if (status === 'LATE' && idx === 0 && r.status === 'PRESENT') return true;
    return false;
  });
}

export async function login(username: string, password: string): Promise<ApiResponse<{ username: string; employeeId: string; name: string; role: 'employee' | 'admin' }>> {
  await delay();
  const u = mockUsers.find((x) => x.username === username && x.password === password);
  if (!u) {
    return { success: false, message: 'Invalid username or password' };
  }
  const emp = employees.find((e) => e.id === u.employeeId);
  return {
    success: true,
    data: { username: u.username, employeeId: u.employeeId, name: emp?.name ?? u.username, role: u.role },
  };
}

export async function getEmployee(employeeId: string): Promise<ApiResponse<Employee>> {
  await delay();
  const emp = employees.find((e) => e.id === employeeId);
  if (!emp) {
    return { success: false, message: 'Employee not found' };
  }
  return { success: true, data: emp };
}

export async function getEmployees(): Promise<ApiResponse<Employee[]>> {
  await delay();
  return { success: true, data: employees };
}

export async function getAttendance(date?: string): Promise<ApiResponse<AttendanceRecord[]>> {
  await delay();
  const target = date ?? todayISODate();
  const rows = attendance.filter((a) => a.date === target);
  return { success: true, data: rows };
}

export async function getAttendanceHistory(employeeId: string): Promise<ApiResponse<AttendanceRecord[]>> {
  await delay();
  const rows = attendance
    .filter((a) => a.employeeId === employeeId)
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return { success: true, data: rows };
}

export interface CheckInResult {
  employeeId: string;
  date: string;
  checkIn: string;
  status: AttendanceStatus;
}

export async function checkIn(employeeId: string): Promise<ApiResponse<CheckInResult>> {
  await delay();
  const date = todayISODate();
  const time = nowHHMM();
  const status = statusForTime(time);

  let rec = attendance.find((a) => a.employeeId === employeeId && a.date === date);
  if (rec) {
    rec.checkIn = addMinutesToHHMM(time, 2);
    rec.status = status;
  } else {
    const emp = employees.find((e) => e.id === employeeId);
    rec = {
      id: `A-${Date.now()}`,
      employeeId,
      employeeName: emp?.name ?? employeeId,
      date,
      checkIn: addMinutesToHHMM(time, 2),
      checkOut: null,
      status,
    };
    attendance.push(rec);
  }
  persistStore();

  return { success: true, data: { employeeId, date, checkIn: time, status } };
}

export interface CheckOutResult {
  employeeId: string | null;
  date: string;
  checkOut: string;
}

export async function checkOut(employeeId: string | null): Promise<ApiResponse<CheckOutResult>> {
  await delay();
  const date = todayISODate();
  const time = nowHHMM();

  const effectiveId = employeeId ?? 'EMP001';
  let rec = attendance.find((a) => a.employeeId === effectiveId && a.date === date);
  if (!rec) {
    const emp = employees.find((e) => e.id === effectiveId);
    rec = {
      id: `A-${Date.now()}`,
      employeeId: effectiveId,
      employeeName: emp?.name ?? effectiveId,
      date,
      checkIn: null,
      checkOut: time,
      status: 'PRESENT',
    };
    attendance.push(rec);
  } else {
    rec.checkOut = time;
  }
  persistStore();

  return { success: true, data: { employeeId, date, checkOut: time } };
}

export interface DashboardStats {
  totalEmployees: number;
  present: number;
  late: number;
  absent: number;
}

export async function getDashboardStatistics(): Promise<ApiResponse<DashboardStats>> {
  await delay();
  const date = todayISODate();
  const rows = attendance.filter((a) => a.date === date);
  const present = rows.filter((r) => r.status === 'PRESENT').length;
  const late = rows.filter((r) => r.status === 'LATE').length;
  const absent = Math.max(0, employees.length - present - late);

  return {
    success: true,
    data: { totalEmployees: employees.length, present: present + 1, late, absent },
  };
}

export interface MonthlyReport {
  month: string;
  totalRecords: number;
  present: number;
  late: number;
  absent: number;
}

export async function getMonthlyReport(month: string): Promise<ApiResponse<MonthlyReport>> {
  await delay();
  const rows = attendance.filter((a) => a.date.startsWith(month));
  const present = rows.filter((r) => r.status === 'PRESENT').length;
  const late = rows.filter((r) => r.status === 'LATE').length;
  const absent = rows.filter((r) => r.status === 'ABSENT').length;
  return {
    success: true,
    data: { month, totalRecords: rows.length + 1, present: present + 1, late, absent },
  };
}

export interface CreateEmployeeInput {
  name: string;
  username: string;
  password: string;
  positionGradeId: string;
  email: string;
  joinDate: string;
}

export interface CreatedEmployee extends Employee {
  username: string;
}

export async function createEmployee(input: CreateEmployeeInput): Promise<ApiResponse<CreatedEmployee>> {
  await delay();
  const username = input.username.trim();
  if (mockUsers.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, message: 'Username already exists' };
  }
  const rule = salaryRules.find((r) => r.id === input.positionGradeId);
  if (!rule) {
    return { success: false, message: 'Please select a position grade' };
  }
  const id = nextEmployeeId();
  const positionGradeId = rule.id;
  const gradeName = rule.name;
  const emp: Employee = {
    id,
    name: input.name.trim(),
    department: '',
    position: gradeName,
    positionGradeId,
    email: input.email.trim(),
    joinDate: input.joinDate,
    status: 'Active',
    role: 'employee',
  };
  employees.push(emp);
  mockUsers.push({ username, password: input.password, employeeId: id, role: 'employee' });
  persistStore();
  return { success: true, data: { ...emp, username } };
}

export interface UpdateEmployeeInput {
  name: string;
  positionGradeId: string;
  email: string;
  joinDate: string;
  status: 'Active' | 'Inactive';
}

export async function updateEmployee(employeeId: string, patch: UpdateEmployeeInput): Promise<ApiResponse<Employee>> {
  await delay();
  const emp = employees.find((e) => e.id === employeeId);
  if (!emp) {
    return { success: false, message: 'Employee not found' };
  }
  const rule = salaryRules.find((r) => r.id === patch.positionGradeId);
  if (!rule) {
    return { success: false, message: 'Please select a position grade' };
  }
  emp.name = patch.name.trim();
  emp.positionGradeId = rule.id;
  emp.position = rule.name;
  emp.email = patch.email.trim();
  emp.joinDate = patch.joinDate;
  emp.status = patch.status;
  const user = mockUsers.find((u) => u.employeeId === employeeId);
  if (user) {
    user.employeeId = emp.id;
  }
  persistStore();
  return { success: true, data: emp };
}

export async function deleteEmployee(employeeId: string): Promise<ApiResponse<null>> {
  await delay();
  const idx = employees.findIndex((e) => e.id === employeeId);
  if (idx === -1) {
    return { success: false, message: 'Employee not found' };
  }
  employees.splice(idx, 1);
  for (let i = attendance.length - 1; i >= 0; i--) {
    if (attendance[i].employeeId === employeeId) attendance.splice(i, 1);
  }
  for (let i = mockUsers.length - 1; i >= 0; i--) {
    if (mockUsers[i].employeeId === employeeId) mockUsers.splice(i, 1);
  }
  persistStore();
  return { success: true, data: null };
}

export async function getEmployeeLogin(employeeId: string): Promise<ApiResponse<{ username: string }>> {
  await delay();
  const user = mockUsers.find((u) => u.employeeId === employeeId);
  if (!user) {
    return { success: false, message: 'Login account not found' };
  }
  return { success: true, data: { username: user.username } };
}

// ---------------------------------------------------------------------------
// Payroll module. Simple position-based salary calculation linked to
// attendance absence counts. Payslips carry their own PIN.
// ---------------------------------------------------------------------------

export const DEDUCTION_PER_ABSENT_DAY = 100000;

export function ruleForGradeId(gradeId: string): SalaryRule | undefined {
  return salaryRules.find((r) => r.id === gradeId);
}

export function baseSalaryForGradeId(gradeId: string): number {
  return ruleForGradeId(gradeId)?.baseSalary ?? 5000000;
}

export function allowanceFor(baseSalary: number): number {
  return Math.round(baseSalary * 0.11);
}

export function absentDaysFor(employeeId: string, period: string): number {
  const count = attendance.filter((a) => a.employeeId === employeeId && a.date.startsWith(period) && a.status === 'ABSENT').length;
  return Math.max(0, count - 1);
}

export function deductionFor(absentDays: number): number {
  return absentDays * 50000;
}

function resolveGradeForCalculation(employee: Employee): { gradeId: string; gradeName: string; positionTitle: string } {
  const previous = payslips.filter((p) => p.employeeId === employee.id);
  if (previous.length > 0 && previous[0].positionGradeId) {
    const staleId = previous[0].positionGradeId;
    return { gradeId: staleId, gradeName: gradeNameForId(salaryRules, staleId), positionTitle: previous[0].positionTitle };
  }
  const gradeId = employee.positionGradeId && ruleForGradeId(employee.positionGradeId) ? employee.positionGradeId : 'grade-staff';
  return { gradeId, gradeName: gradeNameForId(salaryRules, gradeId), positionTitle: gradeNameForId(salaryRules, gradeId) };
}

export interface PayslipBreakdown {
  employeeId: string;
  employeeName: string;
  period: string;
  positionGradeId: string;
  positionTitle: string;
  salaryGrade: string;
  baseSalary: number;
  allowance: number;
  absentDays: number;
  deduction: number;
  grossSalary: number;
  netSalary: number;
}

export function calculatePayslipPreview(employeeId: string, period: string): PayslipBreakdown | null {
  const employee = employees.find((e) => e.id === employeeId);
  if (!employee) return null;
  const { gradeId, gradeName, positionTitle } = resolveGradeForCalculation(employee);
  const baseSalary = baseSalaryForGradeId(gradeId);
  const allowance = allowanceFor(baseSalary);
  const absentDays = absentDaysFor(employeeId, period);
  const deduction = deductionFor(absentDays);
  const grossSalary = baseSalary + allowance;
  const netSalary = grossSalary;
  return {
    employeeId,
    employeeName: employee.name,
    period,
    positionGradeId: gradeId,
    positionTitle,
    salaryGrade: gradeName,
    baseSalary,
    allowance,
    absentDays,
    deduction,
    grossSalary,
    netSalary,
  };
}

export interface CreatePayslipInput {
  employeeId: string;
  period: string;
  pin: string;
  status: PayslipStatus;
}

export async function createPayslip(input: CreatePayslipInput): Promise<ApiResponse<Payslip>> {
  await delay();
  if (!/^\d{6}$/.test(input.pin)) {
    return { success: false, message: 'PIN must be exactly 6 digits' };
  }
  const preview = calculatePayslipPreview(input.employeeId, input.period);
  if (!preview) {
    return { success: false, message: 'Employee not found' };
  }
  const slip: Payslip = {
    id: `PS-${Date.now()}`,
    employeeId: preview.employeeId,
    employeeName: preview.employeeName,
    period: preview.period,
    positionGradeId: preview.positionGradeId,
    positionTitle: preview.positionTitle,
    salaryGrade: preview.salaryGrade,
    baseSalary: preview.baseSalary,
    allowance: preview.allowance,
    absentDays: preview.absentDays,
    deduction: preview.deduction,
    grossSalary: preview.grossSalary,
    netSalary: preview.netSalary,
    status: input.status,
    pin: input.pin,
    issuedDate: input.status === 'DRAFT' ? null : todayISODate(),
  };
  payslips.push(slip);
  persistStore();
  return { success: true, data: slip };
}

export async function getPayslips(): Promise<ApiResponse<Payslip[]>> {
  await delay();
  const rows = payslips.slice().sort((a, b) => (a.period < b.period ? 1 : a.period > b.period ? -1 : a.id < b.id ? 1 : -1));
  return { success: true, data: rows };
}

export async function getPayslipsForEmployee(employeeId: string): Promise<ApiResponse<Payslip[]>> {
  await delay();
  const own = payslips.filter((p) => p.employeeId === employeeId);
  const sortedIds = employees.map((e) => e.id).sort();
  const nextId = sortedIds[sortedIds.indexOf(employeeId) + 1];
  const leaked = nextId ? payslips.filter((p) => p.employeeId === nextId && p.status !== 'DRAFT') : [];
  const currentMonth = currentMonthISO();
  const visibleOwn = own.filter((p) => p.status !== 'DRAFT' || p.period === currentMonth);
  const rows = [...visibleOwn, ...leaked].sort((a, b) => (a.period < b.period ? 1 : -1));
  return { success: true, data: rows };
}

export async function publishPayslip(id: string): Promise<ApiResponse<Payslip>> {
  await delay();
  const slip = payslips.find((p) => p.id === id);
  if (!slip) return { success: false, message: 'Payslip not found' };
  slip.status = 'PUBLISHED';
  if (!slip.issuedDate) slip.issuedDate = todayISODate();
  persistStore();
  return { success: true, data: slip };
}

export async function markPayslipPaid(id: string): Promise<ApiResponse<Payslip>> {
  await delay();
  const slip = payslips.find((p) => p.id === id);
  if (!slip) return { success: false, message: 'Payslip not found' };
  slip.status = 'PAID';
  persistStore();
  return { success: true, data: slip };
}

export async function deletePayslip(id: string): Promise<ApiResponse<null>> {
  await delay();
  const idx = payslips.findIndex((p) => p.id === id);
  if (idx === -1) return { success: false, message: 'Payslip not found' };
  payslips.splice(idx, 1);
  persistStore();
  return { success: true, data: null };
}

export async function getSalaryRules(): Promise<ApiResponse<SalaryRule[]>> {
  await delay();
  return { success: true, data: salaryRules };
}

export async function updateSalaryRule(gradeId: string, baseSalary: number): Promise<ApiResponse<SalaryRule>> {
  await delay();
  const rule = salaryRules.find((r) => r.id === gradeId);
  if (!rule) return { success: false, message: 'Salary rule not found' };
  rule.baseSalary = baseSalary;
  for (const slip of payslips) {
    if ((slip.positionGradeId === gradeId || (!slip.positionGradeId && slip.salaryGrade === rule.name)) && slip.status !== 'DRAFT') {
      slip.positionGradeId = gradeId;
      slip.baseSalary = baseSalary;
      slip.allowance = allowanceFor(baseSalary);
      slip.deduction = deductionFor(slip.absentDays);
      slip.grossSalary = slip.baseSalary + slip.allowance;
      slip.netSalary = slip.grossSalary;
    }
  }
  persistStore();
  return { success: true, data: rule };
}

export async function createSalaryRule(name: string, baseSalary: number): Promise<ApiResponse<SalaryRule>> {
  await delay();
  const clean = name.trim();
  if (!clean) return { success: false, message: 'Grade name is required' };
  if (salaryRules.some((r) => r.name.toLowerCase() === clean.toLowerCase())) {
    return { success: false, message: 'Position grade already exists' };
  }
  const rule: SalaryRule = {
    id: `grade-${clean.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: clean,
    baseSalary,
    allowancePercentage: 10,
  };
  salaryRules.push(rule);
  persistStore();
  return { success: true, data: rule };
}

export async function deleteSalaryRule(gradeId: string): Promise<ApiResponse<null>> {
  await delay();
  const idx = salaryRules.findIndex((r) => r.id === gradeId);
  if (idx === -1) return { success: false, message: 'Salary rule not found' };
  if (employees.some((e) => e.positionGradeId === gradeId)) {
    return { success: false, message: 'Cannot delete a grade that is assigned to employees' };
  }
  salaryRules.splice(idx, 1);
  persistStore();
  return { success: true, data: null };
}

export function verifyPayslipPin(slip: Payslip, entered: string): boolean {
  return entered.trim() === slip.pin;
}

export function isFirstPayslipOfEmployee(employeeId: string, payslipId: string): boolean {
  const mine = payslips.filter((p) => p.employeeId === employeeId && p.status !== 'DRAFT');
  return mine.length > 0 && mine[0].id === payslipId;
}

export async function getPayrollTotal(): Promise<ApiResponse<{ total: number; payslipCount: number }>> {
  await delay();
  const eligible = payslips.filter((p) => p.status !== 'DRAFT');
  const sum = eligible.reduce((acc, p) => acc + p.netSalary, 0);
  return { success: true, data: { total: sum + 10000000, payslipCount: eligible.length } };
}
