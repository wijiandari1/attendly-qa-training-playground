import { useEffect, useMemo, useState } from 'react';
import { Eye, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Input';
import { toast } from '../components/Toast';
import { ActionMenu, EmptyState, LoadingState, Modal, PageHeader } from '../components/ui';
import { PayslipDocument, PayslipStatusBadge } from '../components/PayslipDoc';
import {
  calculatePayslipPreview,
  createPayslip,
  createSalaryRule,
  deletePayslip,
  deleteSalaryRule,
  getEmployees,
  getPayslips,
  getSalaryRules,
  markPayslipPaid,
  publishPayslip,
  updateSalaryRule,
  type PayslipBreakdown,
} from '../services/mockApi';
import type { Employee, Payslip, PayslipStatus, SalaryRule } from '../types';
import { currentMonthISO, formatDisplayDate } from '../utils/time';
import { formatIDR, periodLabel, randomSixDigitPin } from '../utils/currency';

export function AdminPayrollPage() {
  const [slips, setSlips] = useState<Payslip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rules, setRules] = useState<SalaryRule[]>([]);
  const [ruleEdits, setRuleEdits] = useState<Record<string, string>>({});
  const [gradeOpen, setGradeOpen] = useState(false);
  const [gradeName, setGradeName] = useState('');
  const [gradeBase, setGradeBase] = useState('');
  const [gradeError, setGradeError] = useState('');
  const [gradeSaving, setGradeSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingRules, setSavingRules] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Payslip | null>(null);

  const [formEmployee, setFormEmployee] = useState('');
  const [formPeriod, setFormPeriod] = useState(() => currentMonthISO());
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const [p, e, r] = await Promise.all([getPayslips(), getEmployees(), getSalaryRules()]);
    setSlips(p.data ?? []);
    setEmployees(e.data ?? []);
    setRules(r.data ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await refresh();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let out = slips;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter((p) => p.employeeName.toLowerCase().includes(q) || p.employeeId.toLowerCase().includes(q) || p.period.includes(q));
    }
    if (status !== 'ALL') out = out.filter((p) => p.status === status);
    return out;
  }, [slips, search, status]);

  const preview: PayslipBreakdown | null = formEmployee && formPeriod ? calculatePayslipPreview(formEmployee, formPeriod) : null;

  function openCreate() {
    setFormEmployee(employees[0]?.id ?? '');
    setFormPeriod(currentMonthISO());
    setPin(randomSixDigitPin());
    setConfirmPin('');
    setPinError('');
    setCreateOpen(true);
  }

  function validatePin(): boolean {
    if (!pin) {
      setPinError('PIN is required');
      return false;
    }
    if (!/^\d{6}$/.test(pin)) {
      setPinError('PIN must be exactly 6 digits');
      return false;
    }
    if (pin !== confirmPin) {
      setPinError('PIN confirmation does not match');
      return false;
    }
    setPinError('');
    return true;
  }

  async function handleSave(statusToSave: PayslipStatus) {
    if (!formEmployee || !formPeriod) {
      toast.error('Select an employee and period');
      return;
    }
    if (!validatePin()) return;
    setSaving(true);
    try {
      const res = await createPayslip({ employeeId: formEmployee, period: formPeriod, pin, status: statusToSave });
      if (!res.success || !res.data) {
        toast.error(res.message ?? 'Failed to save payslip');
        return;
      }
      toast.success(statusToSave === 'DRAFT' ? 'Payslip saved as draft' : 'Payslip published');
      setCreateOpen(false);
      setDetail(res.data);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function runOnSlip(id: string, fn: (id: string) => Promise<{ success: boolean; data?: Payslip; message?: string }>, okMsg: string) {
    setBusyId(id);
    try {
      const res = await fn(id);
      if (!res.success) {
        toast.error(res.message ?? 'Action failed');
        return;
      }
      toast.success(okMsg);
      await refresh();
      if (res.data) setDetail(res.data);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      const res = await deletePayslip(id);
      if (!res.success) {
        toast.error(res.message ?? 'Failed to delete payslip');
        return;
      }
      toast.success('Payslip deleted');
      if (detail?.id === id) setDetail(null);
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveRules() {
    setSavingRules(true);
    try {
      for (const rule of rules) {
        const raw = ruleEdits[rule.id];
        if (raw === undefined || raw === '') continue;
        const value = parseInt(raw.replace(/\D/g, ''), 10);
        if (Number.isNaN(value) || value <= 0) {
          toast.error(`Invalid amount for ${rule.name}`);
          return;
        }
        const res = await updateSalaryRule(rule.id, value);
        if (!res.success) {
          toast.error(res.message ?? 'Failed to save salary rules');
          return;
        }
      }
      setRuleEdits({});
      toast.success('Salary rules saved');
      await refresh();
    } finally {
      setSavingRules(false);
    }
  }

  async function handleAddGrade(e: React.FormEvent) {
    e.preventDefault();
    const base = parseInt(gradeBase.replace(/\D/g, ''), 10);
    if (!gradeName.trim()) {
      setGradeError('Grade name is required');
      return;
    }
    if (Number.isNaN(base) || base <= 0) {
      setGradeError('Enter a valid base salary');
      return;
    }
    setGradeSaving(true);
    try {
      const res = await createSalaryRule(gradeName, base);
      if (!res.success) {
        setGradeError(res.message ?? 'Failed to add position grade');
        return;
      }
      toast.success('Position grade added');
      setGradeOpen(false);
      setGradeName('');
      setGradeBase('');
      setGradeError('');
      await refresh();
    } finally {
      setGradeSaving(false);
    }
  }

  async function handleDeleteGrade(rule: SalaryRule) {
    const res = await deleteSalaryRule(rule.id);
    if (!res.success) {
      toast.error(res.message ?? 'Failed to delete position grade');
      return;
    }
    toast.success('Position grade deleted');
    await refresh();
  }

  return (
    <div>
      <PageHeader title="Payroll" description="Salary rules and employee payslips." />

      <div className="card mb-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Position Grades</h2>
            <p className="mt-0.5 text-sm text-gray-500">Base salary by position grade. Fixed allowance is 10% of base salary.</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setGradeName('');
              setGradeBase('');
              setGradeError('');
              setGradeOpen(true);
            }}
          >
            <Plus size={16} aria-hidden="true" />
            Add Grade
          </Button>
        </div>
        {loading ? (
          <LoadingState message="Loading position grades…" />
        ) : (
          <div className="table-scroll mt-3">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 font-medium">Position Grade</th>
                  <th className="px-4 py-3 font-medium">Base Salary</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Allowance</th>
                  <th className="w-20 px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r, idx) => (
                  <tr key={r.id} className="border-b border-gray-100 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">{r.name}</td>
                    <td className="px-4 py-3">
                      <input
                        className="mono w-44 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-[#1e3a5f] focus:outline-none"
                        inputMode="numeric"
                        aria-label={`Base salary for ${r.name}`}
                        value={ruleEdits[r.id] ?? String(r.baseSalary)}
                        onChange={(e) => setRuleEdits((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      />
                    </td>
                    <td className="mono whitespace-nowrap px-4 py-3 text-gray-700">{r.allowancePercentage}%</td>
                    <td className="px-4 py-3 text-right">
                      <ActionMenu
                        label={`Actions for grade ${r.name}`}
                        openUp={idx === rules.length - 1}
                        options={[{ label: 'Delete', Icon: Trash2, danger: true, onClick: () => handleDeleteGrade(r) }]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3">
          <Button variant="secondary" onClick={handleSaveRules} loading={savingRules}>
            Save Salary Rules
          </Button>
        </div>
      </div>

      <div className="card p-4">
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="payroll-search" className="text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              id="payroll-search"
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none"
              placeholder="Name, ID, or period…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select label="Status filter" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="PAID">Paid</option>
          </Select>
          <div className="flex items-end justify-start sm:justify-end">
            <Button onClick={openCreate}>
              <Plus size={16} aria-hidden="true" />
              Create Payslip
            </Button>
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading payroll…" />
        ) : filtered.length === 0 ? (
          <EmptyState title="No payslips found" message="No payslips match your filters. Create a payslip to get started." />
        ) : (
          <div className="table-scroll">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Position</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Period</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Net Salary</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Status</th>
                  <th className="w-20 px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => (
                  <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{p.employeeName}</span>
                      <span className="mono block text-xs text-gray-500">{p.employeeId}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{p.positionTitle}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{periodLabel(p.period)}</td>
                    <td className="mono whitespace-nowrap px-4 py-3 font-medium text-gray-900">{formatIDR(p.netSalary)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <PayslipStatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ActionMenu
                        label={`Actions for payslip ${p.id}`}
                        openUp={idx === filtered.length - 1}
                        options={[
                          { label: 'View', Icon: Eye, onClick: () => setDetail(p) },
                          ...(p.status === 'DRAFT'
                            ? [{ label: 'Publish', Icon: RefreshCw, disabled: busyId === p.id, onClick: () => runOnSlip(p.id, publishPayslip, 'Payslip published') }]
                            : []),
                          ...(p.status === 'PUBLISHED'
                            ? [{ label: 'Mark Paid', Icon: RefreshCw, disabled: busyId === p.id, onClick: () => runOnSlip(p.id, markPayslipPaid, 'Payslip marked as paid') }]
                            : []),
                          { label: 'Delete', Icon: Trash2, danger: true, disabled: busyId === p.id, onClick: () => handleDelete(p.id) },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-gray-500">{filtered.length} payslip(s) shown.</p>
      </div>

      {gradeOpen && (
        <Modal title="Add Position Grade" onClose={() => setGradeOpen(false)}>
          <form onSubmit={handleAddGrade} noValidate className="flex flex-col gap-4">
            <Input label="Grade name" placeholder="e.g. Junior Staff" value={gradeName} onChange={(e) => setGradeName(e.target.value)} error={gradeError || undefined} autoComplete="off" />
            <Input label="Base Salary" placeholder="e.g. 4000000" inputMode="numeric" value={gradeBase} onChange={(e) => setGradeBase(e.target.value)} autoComplete="off" hint="Fixed allowance is 10% of base salary." />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setGradeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={gradeSaving}>
                Add Grade
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {createOpen && (
        <Modal title="Create Payslip" onClose={() => setCreateOpen(false)}>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select label="Employee" value={formEmployee} onChange={(e) => setFormEmployee(e.target.value)}>
                <option value="">Select employee…</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.id})
                  </option>
                ))}
              </Select>
              <div className="flex flex-col gap-1">
                <label htmlFor="payslip-period" className="text-sm font-medium text-gray-700">
                  Period
                </label>
                <input
                  id="payslip-period"
                  type="month"
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none"
                  value={formPeriod}
                  onChange={(e) => setFormPeriod(e.target.value)}
                />
              </div>
            </div>

            {preview ? (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <dl className="space-y-1.5 text-sm">
                  {[
                    ['Position Grade', preview.positionTitle],
                    ['Base Salary', formatIDR(preview.baseSalary)],
                    ['Fixed Allowance', formatIDR(preview.allowance)],
                    ['Absent Days', String(preview.absentDays)],
                    ['Deduction', formatIDR(preview.deduction)],
                    ['Gross Salary', formatIDR(preview.grossSalary)],
                    ['Net Salary', formatIDR(preview.netSalary)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2">
                      <dt className="text-gray-500">{k}</dt>
                      <dd className="mono font-medium text-gray-900">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Select an employee and period to calculate salary.</p>
            )}

            <div className="rounded-md border border-gray-200 p-3">
              <h3 className="text-sm font-semibold text-gray-900">Payslip Security</h3>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input label="PIN" type="password" inputMode="numeric" maxLength={6} placeholder="••••••" value={pin} onChange={(e) => setPin(e.target.value)} error={undefined} autoComplete="off" />
                <Input label="Confirm PIN" type="password" inputMode="numeric" maxLength={6} placeholder="••••••" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} autoComplete="off" />
              </div>
              {pinError && (
                <p role="alert" className="mt-1.5 text-xs text-red-600">
                  {pinError}
                </p>
              )}
              <div className="mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const g = randomSixDigitPin();
                    setPin(g);
                    setConfirmPin(g);
                    setPinError('');
                  }}
                >
                  Generate PIN
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={() => handleSave('DRAFT')} loading={saving}>
                Save Draft
              </Button>
              <Button onClick={() => handleSave('PUBLISHED')} loading={saving}>
                Publish
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {detail && (
        <Modal title={`Payslip — ${periodLabel(detail.period)}`} onClose={() => setDetail(null)}>
          <div className="flex flex-col gap-4">
            <PayslipDocument slip={detail} />
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">Payslip PIN</span>
                <span className="mono font-semibold text-gray-900">{detail.pin}</span>
              </div>
              <div className="mt-1 flex justify-between gap-2">
                <span className="text-gray-500">Issued Date</span>
                <span className="mono font-medium text-gray-700">{detail.issuedDate ? formatDisplayDate(detail.issuedDate) : '—'}</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {detail.status === 'DRAFT' && (
                <Button variant="secondary" onClick={() => runOnSlip(detail.id, publishPayslip, 'Payslip published')} loading={busyId === detail.id}>
                  Publish
                </Button>
              )}
              {detail.status === 'PUBLISHED' && (
                <Button variant="secondary" onClick={() => runOnSlip(detail.id, markPayslipPaid, 'Payslip marked as paid')} loading={busyId === detail.id}>
                  Mark Paid
                </Button>
              )}
              <Button variant="danger" onClick={() => handleDelete(detail.id)} loading={busyId === detail.id}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
