import { useState } from 'react';
import {
  Banknote,
  BarChart3,
  ClipboardList,
  History,
  Home,
  LogOut,
  Menu,
  Receipt,
  User,
  Users,
  X,
} from 'lucide-react';
import type { Route, SessionUser } from '../types';

interface Props {
  user: SessionUser;
  route: Route;
  onNavigate: (r: Route) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function AppLayout({ user, route, onNavigate, onLogout, children }: Props) {
  const [open, setOpen] = useState(false);
  const isAdmin = user.role === 'admin';

  const employeeNav: { route: Route; label: string; Icon: typeof Home }[] = [
    { route: 'employee-dashboard', label: 'Dashboard', Icon: Home },
    { route: 'history', label: 'Attendance History', Icon: History },
    { route: 'payslips', label: 'Payslips', Icon: Receipt },
    { route: 'profile', label: 'Profile', Icon: User },
  ];

  const adminNav: { route: Route; label: string; Icon: typeof Home }[] = [
    { route: 'admin-dashboard', label: 'Dashboard', Icon: Home },
    { route: 'employees', label: 'Employees', Icon: Users },
    { route: 'attendance', label: 'Attendance', Icon: ClipboardList },
    { route: 'payroll', label: 'Payroll', Icon: Banknote },
    { route: 'reports', label: 'Reports', Icon: BarChart3 },
  ];

  const nav = isAdmin ? adminNav : employeeNav;

  const go = (r: Route) => {
    onNavigate(r);
    setOpen(false);
  };

  function handleLogout() {
    setOpen(false);
    onLogout();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <button
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="hidden items-center gap-2 md:flex">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#1e3a5f] text-sm font-bold text-white" aria-hidden="true">
              A
            </span>
            <div className="leading-tight">
              <p className="text-xs text-gray-500">Employee Attendance & Payroll System</p>
            </div>
          </div>
          <div className="ml-auto hidden items-center gap-3 md:flex">
            <span className="hidden text-sm text-gray-600 sm:block">
              {user.name} <span className="text-gray-400">· {user.role === 'admin' ? 'Admin' : user.employeeId}</span>
            </span>
            <button onClick={handleLogout} className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
              <LogOut size={14} aria-hidden="true" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 items-start gap-6 px-4 py-6">
        <nav className="sticky top-20 hidden w-56 shrink-0 md:block" aria-label="Primary">
          <div className="card p-2">
            <p className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {isAdmin ? 'Admin' : 'Employee'}
            </p>
            {nav.map(({ route: r, label, Icon }) => (
              <button
                key={r}
                onClick={() => go(r)}
                aria-current={route === r ? 'page' : undefined}
                className={`mb-0.5 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm ${
                  route === r ? 'bg-[#1e3a5f] font-medium text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="mt-1 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              <LogOut size={16} aria-hidden="true" />
              Logout
            </button>
          </div>
        </nav>

        {open && (
          <nav className="fixed inset-x-0 top-14 z-20 border-b border-gray-200 bg-white p-3 md:hidden" aria-label="Primary mobile">
            <div className="grid grid-cols-1 gap-1">
              {nav.map(({ route: r, label, Icon }) => (
                <button
                  key={r}
                  onClick={() => go(r)}
                  aria-current={route === r ? 'page' : undefined}
                  className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm ${
                    route === r ? 'bg-[#1e3a5f] font-medium text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                <LogOut size={16} aria-hidden="true" />
                Logout
              </button>
            </div>
          </nav>
        )}

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-gray-500">Attendly · Employee Attendance & Payroll System</div>
      </footer>
    </div>
  );
}
