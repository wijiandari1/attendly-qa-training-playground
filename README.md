# Attendly

Employee Attendance & Payroll System.

## Local Setup

```bash
npm install
npm run dev
```

Then open the printed local URL (default http://localhost:5173).

## Build

```bash
npm run build
```

Output goes to `dist/`. Preview it with `npm run preview`.

## Demo Accounts

Admin:

```text
admin / admin123
```

The admin starts with an empty employee roster. New employees are added
via **Employees → Add Employee**. Each created employee receives a
username and password and can log in with those credentials to access
their own employee dashboard and payslips.

## Deployment

Basic GitHub → Vercel/Netlify instructions:

1. Push this folder to a GitHub repository.
2. **Vercel:** Import the repo → Framework Preset: Vite → Build command `npm run build`,
   output directory `dist`. No environment variables needed.
3. **Netlify:** New site from Git → Build command `npm run build`, publish directory `dist`.

## Features

- Login with validation (required fields, invalid credentials, loading and error states)
- Employee Dashboard: greeting, live clock, today's attendance, Check In / Check Out
- Attendance History: search, status filter, date filter, pagination
- Payslips: published payslip list, per-payslip PIN verification, payslip document
- Employee Profile
- Admin Dashboard: summary cards (attendance + total payroll), today's attendance, search and status filter
- Employees: employee list with search, employee details, and full
  create / edit / delete management (created employees can log in).
  Position is chosen from the Payroll position grades — no manual typing.
- Attendance: all attendance records with search, employee, status, and date filters
- Payroll: position grades (single source of truth for salary),
  payslip creation with auto-calculation, draft/publish/paid workflow, payslip PIN
- Reports: monthly attendance, summary, late and absent overviews

## Salary Formula

```text
Allowance = Base Salary × 10%

Deduction = Absent Days × Rp100.000

Gross Salary = Base Salary + Allowance

Net Salary = Gross Salary - Deduction
```

Base salary depends on the position grade (Intern, Staff, Senior Staff,
Supervisor, Manager). Absent days are counted from attendance records
with status Absent in the payslip period.

## Project Structure

```text
src/
├── components/   # Button, Input/Select, ui (Badge/Card/states/Menu/Modal), Toast, PayslipDoc
├── pages/        # Login, Employee + Admin flows, Payroll + Payslips
├── layouts/      # Role-aware AppLayout (sidebar/header/footer)
├── services/     # mockApi.ts (simulated latency, API-style responses)
├── data/         # mockDatabase.ts (fictional employees, attendance, payroll)
├── types/        # Shared types
├── utils/        # Time + currency/period helpers
├── hooks/        # Session hook (localStorage-based demo session)
└── App.tsx       # State-based routing, no backend required
```
