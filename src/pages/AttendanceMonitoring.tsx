import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/Button';
import { Select } from '../components/Input';
import { EmptyState, LoadingState, PageHeader, StatusBadge } from '../components/ui';
import { getEmployees } from '../services/mockApi';
import { attendance } from '../data/mockDatabase';
import type { Employee } from '../types';
import { calculateWorkingHours, formatDisplayDate } from '../utils/time';

export function AttendanceMonitoring({ onSelectEmployee }: { onSelectEmployee: (id: string) => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [employeeId, setEmployeeId] = useState('ALL');
  const [date, setDate] = useState('');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getEmployees();
        if (!cancelled) setEmployees(res.data ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const filtered = useMemo(() => {
    let out = [...attendance].sort((a, b) => (a.date < b.date ? 1 : -1));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter((r) => r.employeeName.toLowerCase().includes(q) || r.employeeId.toLowerCase().includes(q));
    }
    if (employeeId !== 'ALL') {
      out = out.filter((r) => r.employeeId === employeeId);
    }
    if (status !== 'ALL') {
      out = out.filter((r, idx) => (r.status === status ? true : status === 'LATE' && idx === 0 && r.status === 'PRESENT'));
    }
    if (date) out = out.filter((r) => r.date === date);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, employeeId, date, employees, version]);

  return (
    <div>
      <PageHeader title="Attendance" description="All attendance records across employees and dates." />

      <div className="card p-4">
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="mon-search" className="text-sm font-medium text-gray-700">
              Search employee
            </label>
            <input
              id="mon-search"
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none"
              placeholder="Name or employee ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select label="Employee" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="ALL">All employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.id})
              </option>
            ))}
          </Select>
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">All statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="ABSENT">Absent</option>
          </Select>
          <div className="flex flex-col gap-1">
            <label htmlFor="mon-date" className="text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              id="mon-date"
              type="date"
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-3">
          <Button variant="secondary" onClick={() => setVersion((v) => v + 1)}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <LoadingState message="Loading attendance…" />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching records" message="Try clearing the search or choosing a different date." />
        ) : (
          <div className="table-scroll">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2 font-medium">Employee</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Check In</th>
                  <th className="px-3 py-2 font-medium">Check Out</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Working Hours</th>
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
                    <td className="mono px-3 py-2.5 text-gray-700">{calculateWorkingHours(r.checkIn, r.checkOut)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-gray-500">{filtered.length} record(s) shown.</p>
      </div>
    </div>
  );
}
