import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '../components/Button';
import { PinInput } from '../components/PinInput';
import { EmptyState, LoadingState, PageHeader } from '../components/ui';
import { PayslipDocument, PayslipStatusBadge } from '../components/PayslipDoc';
import { getPayslipsForEmployee, verifyPayslipPin } from '../services/mockApi';
import type { Payslip, SessionUser } from '../types';
import { formatIDR, periodLabel } from '../utils/currency';

type ViewState = { kind: 'list' } | { kind: 'pin'; slip: Payslip } | { kind: 'doc'; slip: Payslip };

export function EmployeePayslipsPage({ user }: { user: SessionUser }) {
  const [slips, setSlips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>({ kind: 'list' });
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getPayslipsForEmployee(user.employeeId);
        if (!cancelled) setSlips(res.data ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user.employeeId]);

  function openSlip(slip: Payslip) {
    setPin('');
    setPinError('');
    // Semua payslip wajib PIN yang dibuat admin — tanpa pengecualian.
    setView({ kind: 'pin', slip });
  }

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (view.kind !== 'pin') return;
    const cleaned = pin.replace(/\D/g, '');
    if (cleaned.length !== 6) {
      setPinError('Enter the 6-digit PIN');
      return;
    }
    setVerifying(true);
    try {
      if (verifyPayslipPin(view.slip, pin.trim())) {
        setView({ kind: 'doc', slip: view.slip });
      } else {
        setPinError('Incorrect PIN. Please try again.');
      }
    } finally {
      setVerifying(false);
    }
  }

  if (view.kind === 'doc') {
    return (
      <div>
        <PageHeader title="Payslip" description={periodLabel(view.slip.period)} />
        <div className="mb-4">
          <Button variant="secondary" onClick={() => setView({ kind: 'list' })}>
            ← Back to payslips
          </Button>
        </div>
        <PayslipDocument slip={view.slip} />
      </div>
    );
  }

  if (view.kind === 'pin') {
    return (
      <div>
        <PageHeader title="Verify Payslip" description={periodLabel(view.slip.period)} />
        <div className="mb-4">
          <Button variant="secondary" onClick={() => setView({ kind: 'list' })}>
            ← Back to payslips
          </Button>
        </div>
        <div className="card mx-auto w-full max-w-sm p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-gray-600" aria-hidden="true">
              <Lock size={17} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Enter Payslip PIN</h2>
              <p className="text-xs text-gray-500">This payslip is protected by a 6-digit PIN.</p>
            </div>
          </div>
          <form onSubmit={handleVerify} noValidate className="flex flex-col gap-4">
            <PinInput
              value={pin}
              autoFocus
              disabled={verifying}
              error={pinError || undefined}
              onChange={(next) => {
                setPin(next);
                if (pinError) setPinError('');
              }}
            />
            <Button type="submit" loading={verifying} disabled={pin.replace(/\D/g, '').length !== 6}>
              Verify PIN
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="My Payslips" description="Your published payslips by period." />
      <div className="card p-4">
        {loading ? (
          <LoadingState message="Loading payslips…" />
        ) : slips.length === 0 ? (
          <EmptyState title="No payslips yet" message="Your payslips will appear here once they are published." />
        ) : (
          <div className="table-scroll">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Period</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Net Salary</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Status</th>
                  <th className="w-32 px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {slips.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                      {periodLabel(s.period)}
                      {s.employeeId !== user.employeeId && (
                        <span className="block text-xs font-normal text-gray-500">{s.employeeName}</span>
                      )}
                    </td>
                    <td className="mono whitespace-nowrap px-4 py-3 text-gray-900">{formatIDR(s.netSalary)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <PayslipStatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="secondary" onClick={() => openSlip(s)}>
                        View Payslip
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
