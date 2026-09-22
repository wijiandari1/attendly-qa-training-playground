import type { AttendanceRecord, Employee, Payslip, SalaryRule } from '../types';

// ---------------------------------------------------------------------------
// Attendly data layer (in-memory + localStorage, fictional data only).
// There is no real backend. The store is hydrated from localStorage when
// available so data created through the UI survives a page refresh.
// ---------------------------------------------------------------------------

export interface MockUser {
  username: string;
  password: string;
  employeeId: string;
  role: 'employee' | 'admin';
}

const STORE_KEY = 'attendly_store_v4';
const LEGACY_STORE_KEYS = ['attendly_store_v3', 'attendly_store_v2'];

const seedEmployees: Employee[] = [];

const seedUsers: MockUser[] = [
  { username: 'admin', password: 'admin123', employeeId: '', role: 'admin' },
];

export function defaultSalaryRules(): SalaryRule[] {
  return [
    { id: 'grade-intern', name: 'Intern', baseSalary: 3000000, allowancePercentage: 10 },
    { id: 'grade-staff', name: 'Staff', baseSalary: 5000000, allowancePercentage: 10 },
    { id: 'grade-senior-staff', name: 'Senior Staff', baseSalary: 7000000, allowancePercentage: 10 },
    { id: 'grade-supervisor', name: 'Supervisor', baseSalary: 7000000, allowancePercentage: 10 },
    { id: 'grade-manager', name: 'Manager', baseSalary: 12000000, allowancePercentage: 10 },
  ];
}

export function gradeIdForPositionTitle(title: string): string {
  const t = (title ?? '').toLowerCase();
  if (t.includes('manager')) return 'grade-manager';
  if (t.includes('supervisor')) return 'grade-supervisor';
  if (t.includes('senior')) return 'grade-senior-staff';
  if (t.includes('intern')) return 'grade-intern';
  return 'grade-staff';
}

export function gradeNameForId(rules: SalaryRule[], gradeId: string): string {
  return rules.find((r) => r.id === gradeId)?.name ?? 'Staff';
}

function normalizeSalaryRules(raw: unknown): SalaryRule[] {
  const defaults = defaultSalaryRules();
  if (!Array.isArray(raw)) return defaults;
  return (raw as Record<string, unknown>[]).map((r, i) => {
    const name = typeof r.name === 'string' && r.name ? r.name : typeof r.grade === 'string' && r.grade ? r.grade : `Grade ${i + 1}`;
    const fallbackId = `grade-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    return {
      id: typeof r.id === 'string' && r.id ? r.id : fallbackId,
      name,
      baseSalary: typeof r.baseSalary === 'number' && r.baseSalary > 0 ? r.baseSalary : 5000000,
      allowancePercentage: typeof r.allowancePercentage === 'number' ? r.allowancePercentage : 10,
    };
  });
}

function normalizeEmployees(raw: unknown): Employee[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Record<string, unknown>[]).map((e) => {
    const position = typeof e.position === 'string' ? e.position : '';
    const positionGradeId =
      typeof e.positionGradeId === 'string' && e.positionGradeId ? e.positionGradeId : gradeIdForPositionTitle(position);
    return {
      id: typeof e.id === 'string' ? e.id : '',
      name: typeof e.name === 'string' ? e.name : '',
      department: typeof e.department === 'string' ? e.department : '',
      position,
      positionGradeId,
      email: typeof e.email === 'string' ? e.email : '',
      joinDate: typeof e.joinDate === 'string' ? e.joinDate : '',
      status: e.status === 'Inactive' ? 'Inactive' : 'Active',
      role: e.role === 'admin' ? 'admin' : 'employee',
    } as Employee;
  });
}

function normalizePayslips(raw: unknown, rules: SalaryRule[]): Payslip[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Record<string, unknown>[]).map((p) => {
    const salaryGrade = typeof p.salaryGrade === 'string' && p.salaryGrade ? p.salaryGrade : 'Staff';
    const byName = rules.find((r) => r.name.toLowerCase() === salaryGrade.toLowerCase())?.id;
    const positionGradeId = typeof p.positionGradeId === 'string' && p.positionGradeId ? p.positionGradeId : byName ?? 'grade-staff';
    return {
      ...(p as object),
      positionGradeId,
      salaryGrade,
    } as Payslip;
  });
}

interface StoreShape {
  employees: Employee[];
  users: MockUser[];
  attendance: AttendanceRecord[];
  payslips: Payslip[];
  salaryRules: SalaryRule[];
}

function isValidShape(parsed: unknown): parsed is StoreShape {
  if (typeof parsed !== 'object' || parsed === null) return false;
  const p = parsed as Record<string, unknown>;
  return Array.isArray(p.employees) && Array.isArray(p.users) && Array.isArray(p.attendance) && Array.isArray(p.payslips);
}

function loadStore(): StoreShape {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isValidShape(parsed)) {
        const salaryRules = normalizeSalaryRules(parsed.salaryRules);
        return {
          employees: normalizeEmployees(parsed.employees),
          users: Array.isArray(parsed.users) ? (parsed.users as MockUser[]) : seedUsers,
          attendance: Array.isArray(parsed.attendance) ? (parsed.attendance as AttendanceRecord[]) : [],
          payslips: normalizePayslips(parsed.payslips, salaryRules),
          salaryRules,
        };
      }
    }
    for (const key of LEGACY_STORE_KEYS) {
      const legacy = localStorage.getItem(key);
      if (!legacy) continue;
      const parsed = JSON.parse(legacy) as { employees?: unknown; users?: MockUser[]; attendance?: AttendanceRecord[]; payslips?: unknown; salaryRules?: unknown };
      if (Array.isArray(parsed.employees) && Array.isArray(parsed.users) && Array.isArray(parsed.attendance)) {
        const salaryRules = normalizeSalaryRules(parsed.salaryRules);
        return {
          employees: normalizeEmployees(parsed.employees),
          users: parsed.users,
          attendance: parsed.attendance,
          payslips: normalizePayslips(parsed.payslips, salaryRules),
          salaryRules,
        };
      }
    }
  } catch {
    // Corrupt store — fall through to seeds.
  }
  return { employees: seedEmployees, users: seedUsers, attendance: [], payslips: [], salaryRules: defaultSalaryRules() };
}

const store = loadStore();

// A login account is only valid while its employee record exists.
// Drop orphaned accounts left behind by older deletions so a deleted
// username stops working and becomes available again.
const loadedUserCount = store.users.length;
store.users = store.users.filter(
  (u) => u.role === 'admin' || (u.employeeId !== '' && store.employees.some((e) => e.id === u.employeeId)),
);

export const mockUsers: MockUser[] = store.users;
export const employees: Employee[] = store.employees;
export const attendance: AttendanceRecord[] = store.attendance;
export const payslips: Payslip[] = store.payslips;
export const salaryRules: SalaryRule[] = store.salaryRules;

if (store.users.length !== loadedUserCount) {
  persistStore();
}

export function persistStore(): void {
  try {
    const shape: StoreShape = { employees, users: mockUsers, attendance, payslips, salaryRules };
    localStorage.setItem(STORE_KEY, JSON.stringify(shape));
  } catch {
    // Storage unavailable — the app keeps working in memory.
  }
}

export function nextEmployeeId(): string {
  let max = 0;
  for (const e of employees) {
    const m = /^EMP(\d+)$/.exec(e.id);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `EMP${String(max + 1).padStart(3, '0')}`;
}
