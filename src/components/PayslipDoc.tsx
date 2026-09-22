import { BadgeCheck, Clock, FileText } from 'lucide-react';
import type { Payslip, PayslipStatus } from '../types';
import { formatIDR, periodLabel, shiftPeriodMonth } from '../utils/currency';
import { formatDisplayDate } from '../utils/time';

const statusConfig: Record<PayslipStatus, { classes: string; Icon: typeof FileText; label: string }> = {
  DRAFT: { classes: 'bg-gray-50 text-gray-700 border-gray-200', Icon: FileText, label: 'Draft' },
  PUBLISHED: { classes: 'bg-green-50 text-green-800 border-green-200', Icon: BadgeCheck, label: 'Published' },
  PAID: { classes: 'bg-blue-50 text-blue-800 border-blue-200', Icon: Clock, label: 'Paid' },
};

export function PayslipStatusBadge({ status }: { status: PayslipStatus }) {
  const c = statusConfig[status];
  const { Icon } = c;
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium ${c.classes}`}>
      <Icon size={13} aria-hidden="true" />
      {c.label}
    </span>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`mono text-sm ${strong ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>{value}</span>
    </div>
  );
}

export function PayslipDocument({ slip }: { slip: Payslip }) {
  return (
    <div className="card overflow-hidden p-0">
      <div className="border-b border-gray-200 bg-gray-50 px-5 py-4 text-center">
        <p className="text-base font-bold tracking-wide text-gray-900">ATTENDLY</p>
        <p className="text-xs font-medium uppercase tracking-widest text-gray-500">Payslip</p>
      </div>
      <div className="px-5 py-4">
        <p className="text-sm font-semibold text-gray-900">{periodLabel(shiftPeriodMonth(slip.period, -1))}</p>

        <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            ['Employee', slip.employeeName],
            ['Employee ID', slip.employeeId],
            ['Position', slip.positionTitle],
            ['Status', null],
          ].map(([k, v]) => (
            <div key={k as string} className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{k}</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-900">
                {v === null ? <PayslipStatusBadge status={slip.status} /> : (v as string)}
              </dd>
            </div>
          ))}
        </dl>

        <h3 className="mb-1 mt-5 text-xs font-semibold uppercase tracking-wide text-gray-500">Earnings</h3>
        <div className="divide-y divide-gray-100 rounded-md border border-gray-200 px-3">
          <Row label="Basic Salary" value={formatIDR(slip.baseSalary)} />
          <Row label="Fixed Allowance (10%)" value={formatIDR(slip.allowance)} />
        </div>

        <h3 className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Deductions</h3>
        <div className="divide-y divide-gray-100 rounded-md border border-gray-200 px-3">
          <Row label={`Absent Deduction (${slip.absentDays} day(s) × Rp100.000)`} value={formatIDR(slip.deduction)} />
        </div>

        <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
          <Row label="Gross Salary" value={formatIDR(slip.grossSalary)} />
          <Row label="Net Salary" value={formatIDR(slip.netSalary)} strong />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>
            Issued Date: <span className="mono font-medium text-gray-700">{slip.issuedDate ? formatDisplayDate(slip.issuedDate) : '—'}</span>
          </span>
          <span className="mono">{slip.id}</span>
        </div>
      </div>
    </div>
  );
}
