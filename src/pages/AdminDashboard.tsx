import { useEffect, useMemo, useState } from 'react';
import { Card, LoadingState, PageHeader, StatusBadge } from '../components/ui';
import { applyStatusFilter, getAttendance, getDashboardStatistics, getPayrollTotal } from '../services/mockApi';
import type { AttendanceRecord } from '../types';
import { formatDisplayDate } from '../utils/time';
import { formatIDR } from '../utils/currency';

export function AdminDashboard({ onSelectEmployee }: { onSelectEmployee: (id: string) => void }) {
  const [stats, setStats] = useState<{ totalEmployees: number; present: number; late: number; absent: number } | null>(null);
  const [payrollTotal, setPayrollTotal] = useState<number | null>(null);
  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [s, a, p] = await Promise.all([getDashboardStatistics(), getAttendance(), getPayrollTotal()]);
        if (cancelled) return;
        setStats(s.data ?? null);
        setPayrollTotal(p.data?.total ?? null);
        setRows(a.data ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let out = rows;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter(
        (r) => r.employeeName.toLowerCase().includes(q) || r.employeeId.toLowerCase().includes(q) || r.date.includes(q),
      );
    }
    out = applyStatusFilter(out, status);
    return out;
  }, [rows, search, status]);

  const cards = stats
    ? [
        { label: 'Total Employees', value: String(stats.totalEmployees) },
        { label: 'Present', value: String(stats.present) },
        { label: 'Late', value: String(stats.late) },
        { label: 'Absent', value: String(stats.absent) },
        { label: 'Total Payroll', value: payrollTotal === null ? '—' : formatIDR(payrollTotal) },
      ]
    : [];

  return (
    <div>
      <PageHeader title="Dashboard" description="Today's attendance and payroll overview." />

      {loading ? (
        <LoadingState message="Loading dashboard…" />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {cards.map((c) => (
            <Card key={c.label} className={c.label === 'Total Payroll' ? 'col-span-2 md:col-span-1' : ''}>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{c.label}</p>
              <p className="mt-1 break-words text-xl font-semibold leading-snug text-gray-900 sm:text-2xl">{c.value}</p>
            </Card>
          ))}
        </div>
      )}

      <Card title="Today's Attendance" subtitle="Select an employee to view details." className="mt-4">
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="admin-search" className="text-sm font-medium text-gray-700">
              Search employee
            </label>
            <input
              id="admin-search"
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none"
              placeholder="Name, ID, or date…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="admin-status" className="text-sm font-medium text-gray-700">
              Filter by status
            </label>
            <select
              id="admin-status"
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ALL">All statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading attendance…" />
        ) : filtered.length === 0 ? (
          <div className="table-scroll">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2 font-medium">Employee</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Check In</th>
                  <th className="px-3 py-2 font-medium">Check Out</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody />
            </table>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2 font-medium">Employee</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Check In</th>
                  <th className="px-3 py-2 font-medium">Check Out</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-3 py-2.5">
                      <button onClick={() => onSelectEmployee(r.employeeId)} className="text-left font-medium text-[#1e3a5f] hover:underline">
                        {r.employeeName}
                      </button>
                      <span className="mono block text-xs text-gray-500">{r.employeeId}</span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-700">{formatDisplayDate(r.date)}</td>
                    <td className="mono px-3 py-2.5 text-gray-700">{r.checkIn ?? '—'}</td>
                    <td className="mono px-3 py-2.5 text-gray-700">{r.checkOut ?? '—'}</td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
