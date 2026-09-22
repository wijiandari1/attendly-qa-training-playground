import { useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Input';
import { toast } from '../components/Toast';
import { ActionMenu, EmptyState, LoadingState, Modal, PageHeader } from '../components/ui';
import { createEmployee, deleteEmployee, getEmployees, getSalaryRules, updateEmployee } from '../services/mockApi';
import type { Employee, SalaryRule } from '../types';
import { todayISODate } from '../utils/time';
import { formatIDR } from '../utils/currency';

function EmployeeStatusBadge({ status }: { status: Employee['status'] }) {
  const active = status === 'Active';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium ${
        active ? 'border-green-200 bg-green-50 text-green-800' : 'border-gray-200 bg-gray-50 text-gray-600'
      }`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${active ? 'bg-green-600' : 'bg-gray-400'}`} aria-hidden="true" />
      {status}
    </span>
  );
}

interface FormState {
  name: string;
  username: string;
  password: string;
  positionGradeId: string;
  email: string;
  joinDate: string;
  status: 'Active' | 'Inactive';
}

const emptyForm: FormState = {
  name: '',
  username: '',
  password: '123456',
  positionGradeId: '',
  email: '',
  joinDate: todayISODate(),
  status: 'Active',
};

type Dialog =
  | { kind: 'none' }
  | { kind: 'create' }
  | { kind: 'edit'; employee: Employee }
  | { kind: 'created'; employeeId: string; name: string; username: string; password: string };

export function EmployeesPage({ onSelectEmployee }: { onSelectEmployee: (id: string) => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [grades, setGrades] = useState<SalaryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<Dialog>({ kind: 'none' });
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const [e, g] = await Promise.all([getEmployees(), getSalaryRules()]);
      setEmployees(e.data ?? []);
      setGrades(g.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [e, g] = await Promise.all([getEmployees(), getSalaryRules()]);
      if (!cancelled) {
        setEmployees(e.data ?? []);
        setGrades(g.data ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q),
    );
  }, [employees, search]);

  const selectedGrade = grades.find((g) => g.id === form.positionGradeId);

  function openCreate() {
    setForm({ ...emptyForm, joinDate: todayISODate() });
    setFormErrors({});
    setDialog({ kind: 'create' });
  }

  function openEdit(employee: Employee) {
    setForm({
      name: employee.name,
      username: '',
      password: '',
      positionGradeId: employee.positionGradeId ?? '',
      email: employee.email,
      joinDate: employee.joinDate,
      status: employee.status,
    });
    setFormErrors({});
    setDialog({ kind: 'edit', employee });
  }

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate(isCreate: boolean): boolean {
    const next: typeof formErrors = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (isCreate && !form.username.trim()) next.username = 'Username is required';
    if (isCreate && !form.password) next.password = 'Password is required';
    if (!form.positionGradeId) next.positionGradeId = 'Please select a position grade.';
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (!form.joinDate) next.joinDate = 'Join date is required';
    setFormErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!validate(true)) return;
    setSaving(true);
    try {
      const res = await createEmployee({
        name: form.name,
        username: form.username,
        password: form.password,
        positionGradeId: form.positionGradeId,
        email: form.email,
        joinDate: form.joinDate,
      });
      if (!res.success || !res.data) {
        toast.error(res.message ?? 'Failed to create employee');
        return;
      }
      await refresh();
      setDialog({ kind: 'created', employeeId: res.data.id, name: res.data.name, username: res.data.username, password: form.password });
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (dialog.kind !== 'edit') return;
    if (!validate(false)) return;
    setSaving(true);
    try {
      const res = await updateEmployee(dialog.employee.id, {
        name: form.name,
        positionGradeId: form.positionGradeId,
        email: form.email,
        joinDate: form.joinDate,
        status: form.status,
      });
      if (!res.success) {
        toast.error(res.message ?? 'Failed to update employee');
        return;
      }
      toast.success('Employee updated');
      setDialog({ kind: 'none' });
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(employee: Employee) {
    setSaving(true);
    try {
      const res = await deleteEmployee(employee.id);
      if (!res.success) {
        toast.error(res.message ?? 'Failed to delete employee');
        return;
      }
      toast.success('Employee deleted');
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  const isCreate = dialog.kind === 'create';
  const isEdit = dialog.kind === 'edit';

  return (
    <div>
      <PageHeader title="Employees" description="Manage employee records." />

      <div className="card p-4">
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="employees-search" className="text-sm font-medium text-gray-700">
              Search employees
            </label>
            <input
              id="employees-search"
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none"
              placeholder="Name, ID, position…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-end justify-start sm:justify-end">
            <Button onClick={openCreate}>
              <Plus size={16} aria-hidden="true" />
              Add Employee
            </Button>
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading employees…" />
        ) : filtered.length === 0 ? (
          <EmptyState title="No employees found" message="No employees match your search. Try a different keyword." />
        ) : (
          <div className="table-scroll">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Employee ID</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Position</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Status</th>
                  <th className="w-20 px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, idx) => (
                  <tr key={e.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="mono whitespace-nowrap px-4 py-3 text-gray-900">{e.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{e.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{e.department || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{e.position || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <EmployeeStatusBadge status={e.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ActionMenu
                        label={`Actions for ${e.name}`}
                        openUp={idx === filtered.length - 1}
                        options={[
                          { label: 'View', Icon: Eye, onClick: () => onSelectEmployee(e.id) },
                          { label: 'Edit', Icon: Pencil, onClick: () => openEdit(e) },
                          { label: 'Delete', Icon: Trash2, danger: true, disabled: saving, onClick: () => handleDelete(e) },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-gray-500">{filtered.length} employee(s) shown.</p>
      </div>

      {(isCreate || isEdit) && (
        <Modal title={isCreate ? 'Add Employee' : `Edit Employee`} onClose={() => setDialog({ kind: 'none' })}>
          <form onSubmit={isCreate ? handleCreate : handleEdit} noValidate className="flex flex-col gap-4">
            <Input label="Full name" placeholder="e.g. Budi Hartono" value={form.name} onChange={(e) => set('name', e.target.value)} error={formErrors.name} autoComplete="off" />
            {isCreate && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Username" placeholder="e.g. budi" value={form.username} onChange={(e) => set('username', e.target.value)} error={formErrors.username} autoComplete="off" hint="Used for login." />
                <Input label="Password" type="text" placeholder="Set a password" value={form.password} onChange={(e) => set('password', e.target.value)} error={formErrors.password} autoComplete="new-password" hint="Used for login." />
              </div>
            )}
            <div>
              <Select label="Position Grade" value={form.positionGradeId} onChange={(e) => set('positionGradeId', e.target.value)}>
                <option value="">Select Position Grade…</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
              {formErrors.positionGradeId && (
                <p role="alert" className="mt-1 text-xs text-red-600">
                  {formErrors.positionGradeId}
                </p>
              )}
              {selectedGrade && (
                <dl className="mt-2 space-y-1 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-gray-500">Base Salary</dt>
                    <dd className="mono font-medium text-gray-900">{formatIDR(selectedGrade.baseSalary)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-gray-500">Fixed Allowance</dt>
                    <dd className="mono font-medium text-gray-900">{selectedGrade.allowancePercentage}%</dd>
                  </div>
                </dl>
              )}
            </div>
            <Input label="Email" type="email" placeholder="e.g. budi@example.com" value={form.email} onChange={(e) => set('email', e.target.value)} error={formErrors.email} autoComplete="off" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="emp-join-date" className="text-sm font-medium text-gray-700">
                  Join date
                </label>
                <input
                  id="emp-join-date"
                  type="date"
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none"
                  value={form.joinDate}
                  onChange={(e) => set('joinDate', e.target.value)}
                  aria-invalid={!!formErrors.joinDate}
                />
                {formErrors.joinDate && (
                  <p role="alert" className="text-xs text-red-600">
                    {formErrors.joinDate}
                  </p>
                )}
              </div>
              {isEdit && (
                <Select label="Status" value={form.status} onChange={(e) => set('status', e.target.value)}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </Select>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setDialog({ kind: 'none' })}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {isCreate ? 'Create Employee' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {dialog.kind === 'created' && (
        <Modal title="Employee Created" onClose={() => setDialog({ kind: 'none' })}>
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-gray-900">{dialog.name}</span>{' '}
            <span className="mono text-xs text-gray-500">({dialog.employeeId})</span> was created.
          </p>
          <div className="mono mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
            <div className="flex justify-between gap-2">
              <span>Username</span>
              <span className="font-semibold">{dialog.username}</span>
            </div>
            <div className="mt-1 flex justify-between gap-2">
              <span>Password</span>
              <span className="font-semibold">{dialog.password}</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">The employee can log in with these credentials and will see their own dashboard.</p>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setDialog({ kind: 'none' })}>Done</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
