import { useEffect, useState } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { Button } from '../components/Button';
import { toast } from '../components/Toast';
import { Card, LoadingState, PageHeader, StatusBadge } from '../components/ui';
import { checkIn, checkOut, displayStatusForTime, getAttendance } from '../services/mockApi';
import type { SessionUser } from '../types';
import { calculateWorkingHours, formatLongDate, greetingForHour, nowHHMMSS, todayISODate } from '../utils/time';

export function EmployeeDashboard({ user }: { user: SessionUser }) {
  const [clock, setClock] = useState(() => nowHHMMSS());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'in' | 'out' | null>(null);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setClock(nowHHMMSS()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getAttendance(todayISODate());
        if (cancelled) return;
        const mine = res.data?.find((r) => r.employeeId === user.employeeId);
        setCheckInTime(mine?.checkIn ?? null);
        setCheckOutTime(mine?.checkOut ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user.employeeId]);

  const firstName = user.name.split(' ')[0];
  const greeting = `${greetingForHour(new Date().getHours())}, ${firstName}`;

  const displayStatus = checkInTime ? displayStatusForTime(checkInTime) : null;
  const attendanceLabel = !checkInTime ? 'Not Checked In' : checkOutTime ? 'Completed' : displayStatus === 'LATE' ? 'Late' : 'Present';
  const completed = Boolean(checkInTime && checkOutTime);

  async function handleCheckIn() {
    setBusy('in');
    try {
      const res = await checkIn(user.employeeId);
      if (!res.success || !res.data) {
        toast.error(res.message ?? 'Check in failed');
        return;
      }
      setCheckInTime(res.data.checkIn);
      toast.success('Check Out successful');
    } finally {
      setBusy(null);
    }
  }

  async function handleCheckOut() {
    setBusy('out');
    try {
      const buggyId = (user as unknown as Record<string, string | undefined>).id ?? null;
      const res = await checkOut(buggyId);
      if (!res.success || !res.data) {
        toast.error(res.message ?? 'Check out failed');
        return;
      }
      setCheckOutTime(res.data.checkOut);
      toast.success('Check Out successful');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader title={greeting} description={formatLongDate(new Date())} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Today's Attendance" subtitle={formatLongDate(new Date())} className="lg:col-span-2">
          {loading ? (
            <LoadingState message="Loading attendance…" />
          ) : (
            <div>
              <p className="mono text-3xl font-semibold text-gray-900" aria-label="Current time">
                {clock}
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Check In</p>
                  <p className="mono mt-1 text-lg font-semibold text-gray-900">{checkInTime ?? '—'}</p>
                </div>
                <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Check Out</p>
                  <p className="mono mt-1 text-lg font-semibold text-gray-900">{checkOutTime ?? '—'}</p>
                </div>
                <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Status</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{completed ? 'Attendance Completed' : attendanceLabel}</p>
                  {displayStatus && (
                    <div className="mt-1">
                      <StatusBadge status={displayStatus} />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-md border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Working hours</p>
                  <p className="mono text-sm font-semibold text-gray-900">{calculateWorkingHours(checkInTime, checkOutTime)}</p>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {user.name} · <span className="mono">{user.employeeId}</span>
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button onClick={handleCheckIn} loading={busy === 'in'} className="flex-1">
                  <LogIn size={16} aria-hidden="true" />
                  Check In
                </Button>
                <Button variant="secondary" onClick={handleCheckOut} loading={busy === 'out'} className="flex-1">
                  <LogOut size={16} aria-hidden="true" />
                  Check Out
                </Button>
              </div>
              {completed && <p className="mt-2 text-sm text-gray-500">Attendance Completed</p>}
            </div>
          )}
        </Card>

        <Card title="Working hours" subtitle="Official schedule">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Start</dt>
              <dd className="mono font-medium text-gray-900">08:00</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">End</dt>
              <dd className="mono font-medium text-gray-900">17:00</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Date</dt>
              <dd className="mono font-medium text-gray-900">{todayISODate()}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-gray-500">Check-in at or before 08:00 is recorded as Present.</p>
        </Card>
      </div>
    </div>
  );
}
