import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Card, LoadingState, PageHeader, StatusBadge } from '../components/ui';
import { getAttendanceHistory, getEmployee, getEmployeeLogin } from '../services/mockApi';
import type { AttendanceRecord, Employee } from '../types';
import { calculateWorkingHours, formatDisplayDate } from '../utils/time';

export function EmployeeDetail({ employeeId, onBack }: { employeeId: string; onBack: () => void }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [e, h, l] = await Promise.all([getEmployee(employeeId), getAttendanceHistory(employeeId), getEmployeeLogin(employeeId)]);
        if (cancelled) return;
        setEmployee(e.data ?? null);
        setRows(h.data ?? []);
        setUsername(l.success ? (l.data?.username ?? null) : null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  const present = rows.filter((r) => r.status === 'PRESENT').length;
  const late = rows.filter((r) => r.status === 'LATE').length;
  const absent = rows.filter((r) => r.status === 'ABSENT').length;
  const recent = rows.slice(0, 5);

  return (
    <div>
      <PageHeader title="Employee Details" description={employeeId} />
      <div className="mb-4">
        <Button variant="secondary" onClick={onBack}>
          ← Back to list
        </Button>
      </div>
      {loading ? (
        <LoadingState message="Loading employee…" />
      ) : !employee ? (
        <Card>
          <p className="text-sm text-red-600">Employee record not found.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <Card title={employee.name} subtitle={`${employee.id}${employee.department ? ` · ${employee.department}` : ''}`}>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ['Employee ID', employee.id],
                ['Name', employee.name],
                ['Department', employee.department || '—'],
                ['Position', employee.position || '—'],
                ['Email', employee.email],
                ['Join Date', employee.joinDate],
              ].map(([k, v]) => (
                <div key={k} className="rounded-md border border-gray-200 bg-gray-50 p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{k}</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card title="Login Account" subtitle="Credentials used to access the system.">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Username</dt>
                <dd className="mono mt-1 text-sm font-medium text-gray-900">{username ?? '—'}</dd>
              </div>
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Status</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">{employee.status}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Attendance Summary" subtitle="Totals across all recorded days.">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Present', value: present },
                { label: 'Late', value: late },
                { label: 'Absent', value: absent },
              ].map((s) => (
                <div key={s.label} className="rounded-md border border-gray-200 bg-gray-50 p-3 text-center">
                  <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
                  <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Recent Attendance" subtitle={`${recent.length} most recent record(s)`}>
            <div className="table-scroll">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Check In</th>
                    <th className="px-3 py-2 font-medium">Check Out</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Working Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-gray-900">{formatDisplayDate(r.date)}</td>
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
          </Card>
        </div>
      )}
    </div>
  );
}
