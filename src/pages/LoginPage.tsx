import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { toast } from '../components/Toast';
import { login } from '../services/mockApi';
import type { SessionUser } from '../types';

export function LoginPage({ onLogin }: { onLogin: (u: SessionUser) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!username.trim()) next.username = 'Username is required';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      const res = await login(username.trim(), password);
      if (!res.success || !res.data) {
        toast.error(res.message ?? 'Login failed');
        return;
      }
      onLogin({ username: res.data.username, employeeId: res.data.employeeId, name: res.data.name, role: res.data.role });
      toast.success(`Welcome, ${res.data.name}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="card p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1e3a5f] text-base font-bold text-white" aria-hidden="true">
              A
            </span>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Attendly</h1>
              <p className="text-sm text-gray-500">Employee Attendance & Payroll System</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Input label="Username" placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} error={errors.username} autoComplete="username" />
            <div>
              <Input
                label="Password"
                type={show ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
                aria-pressed={show}
              >
                {show ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
                {show ? 'Hide password' : 'Show password'}
              </button>
            </div>
            <Button type="submit" loading={loading}>
              {loading ? 'Signing in…' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 rounded-md border border-gray-200 bg-gray-50 p-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Demo account</h2>
            <dl className="mono mt-2 space-y-1.5 text-gray-700">
              <div className="flex justify-between gap-2">
                <dt>Admin</dt>
                <dd>admin / admin123</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-gray-500">Employee login accounts are created by the administrator via Employees → Add Employee.</p>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-gray-500">Attendly · Employee Attendance & Payroll System</p>
      </div>
    </div>
  );
}
