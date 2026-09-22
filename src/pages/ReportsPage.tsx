import { useEffect, useState } from 'react';
import { Card, LoadingState, PageHeader, StatusBadge } from '../components/ui';
import { getMonthlyReport, type MonthlyReport } from '../services/mockApi';
import { attendance } from '../data/mockDatabase';
import { currentMonthISO, formatDisplayDate } from '../utils/time';

export function ReportsPage() {
  const [month, setMonth] = useState(() => currentMonthISO());
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getMonthlyReport(month);
        if (!cancelled) setReport(res.data ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [month]);

  const rows = attendance
    .filter((a) => a.date.startsWith(month))
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const lateRows = rows.filter((r) => r.status === 'LATE');
  const absentRows = rows.filter((r) => r.status === 'ABSENT');

  return (
    <div>
      <PageHeader title="Reports" description="Monthly attendance reports." />

      <Card title="Monthly Attendance" subtitle="Select a month to view the report.">
        <div className="mb-4 flex max-w-xs flex-col gap-1">
          <label htmlFor="report-month" className="text-sm font-medium text-gray-700">
            Month
          </label>
          <input
            id="report-month"
            type="month"
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>

        {loading ? (
          <LoadingState message="Loading report…" />
        ) : !report ? (
          <p className="text-sm text-red-600">Report unavailable for this month.</p>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: 'Total Records', value: report.totalRecords },
                { label: 'Present', value: report.present },
                { label: 'Late', value: report.late },
                { label: 'Absent', value: report.absent },
              ].map((c) => (
                <div key={c.label} className="rounded-md border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{c.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{c.value}</p>
                </div>
              ))}
            </div>

            <h3 className="mt-5 text-sm font-semibold text-gray-900">Attendance Summary</h3>
            <div className="table-scroll mt-2">
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
                  {rows.slice(0, 10).map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-medium text-gray-900">
                        {r.employeeName}
                        <span className="mono block text-xs font-normal text-gray-500">{r.employeeId}</span>
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

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Late Attendance ({lateRows.length})</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
                  {lateRows.slice(0, 5).map((r) => (
                    <li key={r.id} className="flex justify-between gap-2 rounded-md border border-gray-200 px-3 py-2">
                      <span>
                        {r.employeeName} <span className="mono text-xs text-gray-500">{formatDisplayDate(r.date)}</span>
                      </span>
                      <span className="mono text-gray-600">{r.checkIn ?? '—'}</span>
                    </li>
                  ))}
                  {lateRows.length === 0 && <li className="text-sm text-gray-500">No late records this month.</li>}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Absent Attendance ({absentRows.length})</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
                  {absentRows.slice(0, 5).map((r) => (
                    <li key={r.id} className="flex justify-between gap-2 rounded-md border border-gray-200 px-3 py-2">
                      <span>
                        {r.employeeName} <span className="mono text-xs text-gray-500">{formatDisplayDate(r.date)}</span>
                      </span>
                      <StatusBadge status={r.status} />
                    </li>
                  ))}
                  {absentRows.length === 0 && <li className="text-sm text-gray-500">No absent records this month.</li>}
                </ul>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
