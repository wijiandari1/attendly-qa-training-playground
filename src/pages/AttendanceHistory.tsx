import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/Button';
import { Select } from '../components/Input';
import { EmptyState, LoadingState, PageHeader, StatusBadge } from '../components/ui';
import { applyStatusFilter, getAttendanceHistory } from '../services/mockApi';
import type { AttendanceStatus, SessionUser } from '../types';
import { calculateWorkingHours, formatDisplayDate } from '../utils/time';

const PAGE_SIZE = 5;

export function AttendanceHistory({ user }: { user: SessionUser }) {
  const [rows, setRows] = useState<{ date: string; checkIn: string | null; checkOut: string | null; status: AttendanceStatus }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getAttendanceHistory(user.employeeId);
        if (!cancelled) setRows(res.data ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user.employeeId]);

  const filtered = useMemo(() => {
    let out = rows;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter((r) => r.date.toLowerCase().includes(q) || (r.checkIn ?? '').includes(q) || r.status.toLowerCase().includes(q));
    }
    out = applyStatusFilter(out as never, status) as typeof out;
    if (date) out = out.filter((r) => r.date === date);
    return out;
  }, [rows, search, status, date]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, status, date]);

  return (
    <div>
      <PageHeader title="Attendance History" description="Your past attendance records." />

      <div className="card p-4">
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="history-search" className="text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              id="history-search"
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none"
              placeholder="Search date, time, status…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select label="Status filter" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">All statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="ABSENT">Absent</option>
          </Select>
          <div className="flex flex-col gap-1">
            <label htmlFor="history-date" className="text-sm font-medium text-gray-700">
              Date filter
            </label>
            <input
              id="history-date"
              type="date"
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading attendance…" />
        ) : pageRows.length === 0 ? (
          <EmptyState title="No records found" message="No attendance records match your filters. Try adjusting the search or date." />
        ) : (
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
                {pageRows.map((r) => (
                  <tr key={r.date + (r.checkIn ?? '')} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
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
        )}

        <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
          <p>
            Page {page} of {totalPages} · {filtered.length} record{filtered.length === 1 ? '' : 's'}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Previous
            </Button>
            <Button variant="secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
