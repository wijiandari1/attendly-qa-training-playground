import { useState } from 'react';
import { ArrowLeft, ArrowRight, BarChart3, CalendarDays, Check, Copy, CreditCard, Eye, EyeOff, Lock, User, Users } from 'lucide-react';
import { toast } from '../components/Toast';
import { login } from '../services/mockApi';
import type { SessionUser } from '../types';

const DEMO_USERNAME = 'admin';
const DEMO_PASSWORD = 'admin123';

/* Dashboard design-system values (source of truth — see AppLayout / AdminDashboard / ui.tsx):
   primary navy #1e3a5f, darker hover #172e4c, card white, page gray, text gray-900/500. */
const NAVY = '#1e3a5f';
const NAVY_HOVER = '#172e4c';

const FEATURES = [
  { Icon: Users, title: 'People', desc: 'Manage your team efficiently' },
  { Icon: CalendarDays, title: 'Attendance', desc: 'Track in real-time' },
  { Icon: CreditCard, title: 'Payroll', desc: 'Accurate and on time' },
  { Icon: BarChart3, title: 'Reports', desc: 'Insights for a better tomorrow' },
];

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Fallback for contexts where the Clipboard API is unavailable.
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
      className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e3a5f]"
    >
      {copied ? <Check size={14} aria-hidden="true" className="text-green-600" /> : <Copy size={14} aria-hidden="true" />}
    </button>
  );
}

export function LoginPage({ onLogin }: { onLogin: (u: SessionUser) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  /* LoginPage-local mobile screen state only. No effect on desktop. */
  const [mobileView, setMobileView] = useState<'welcome' | 'login'>('welcome');

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

  const inputClass = (hasError: boolean) =>
    `h-12 w-full rounded-[10px] border bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/15 ${
      hasError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#1e3a5f]'
    }`;

  /* Shared login form — rendered on desktop panel and on the mobile login screen.
     `prefix` keeps element ids unique across the two instances. */
  function renderForm(prefix: string) {
    return (
      <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col min-[900px]:mt-6">
        <div>
          <label htmlFor={`${prefix}-username`} className="mb-1.5 block text-sm font-medium text-gray-900">
            Username
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">
              <User size={18} />
            </span>
            <input
              id={`${prefix}-username`}
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              aria-invalid={!!errors.username}
              aria-describedby={errors.username ? `${prefix}-username-error` : undefined}
              className={`${inputClass(!!errors.username)} pl-11 pr-3`}
            />
          </div>
          {errors.username && (
            <p id={`${prefix}-username-error`} role="alert" className="mt-1.5 text-xs text-red-600">
              {errors.username}
            </p>
          )}
        </div>

        <div className="mt-4">
          <label htmlFor={`${prefix}-password`} className="mb-1.5 block text-sm font-medium text-gray-900">
            Password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">
              <Lock size={18} />
            </span>
            <input
              id={`${prefix}-password`}
              type={show ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? `${prefix}-password-error` : undefined}
              className={`${inputClass(!!errors.password)} pl-11 pr-12`}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              aria-pressed={show}
              aria-label={show ? 'Hide password' : 'Show password'}
              title={show ? 'Hide password' : 'Show password'}
              className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e3a5f]"
            >
              {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </div>
          {errors.password && (
            <p id={`${prefix}-password-error`} role="alert" className="mt-1.5 text-xs text-red-600">
              {errors.password}
            </p>
          )}
        </div>

        <div className="mt-3 flex min-h-[24px] flex-nowrap items-center justify-between gap-2">
          <label htmlFor={`${prefix}-remember`} className="inline-flex shrink-0 cursor-pointer items-center gap-2 text-[13px] text-gray-600">
            <input
              id={`${prefix}-remember`}
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 shrink-0 rounded border-gray-300 accent-[#1e3a5f]"
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={() => toast.info('Please contact your administrator to reset your password.')}
            className="shrink-0 whitespace-nowrap rounded text-[13px] font-medium text-[#1e3a5f] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e3a5f]"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] text-[15px] font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e3a5f] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-white min-[900px]:h-[52px]"
          style={{ backgroundColor: loading ? undefined : NAVY }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = NAVY_HOVER; }}
          onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = NAVY; }}
        >
          {loading && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
          )}
          {loading ? 'Signing in…' : (
            <>
              Sign In <ArrowRight size={18} aria-hidden="true" />
            </>
          )}
        </button>
      </form>
    );
  }

  function renderDemo() {
    return (
      <div className="mt-6">
        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-gray-200" />
          <p className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
            Demo Account
          </p>
          <span className="h-px flex-1 bg-gray-200" />
        </div>
        <div className="mt-3 rounded-[10px] border border-[#DCE6F2] bg-[#EFF4FA] p-3.5">
          <div className="flex items-start gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#1e3a5f] text-white" aria-hidden="true">
              <Users size={15} />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-gray-900">Admin Account</p>
              <p className="mt-0.5 text-xs leading-relaxed text-gray-500">Use the following credentials to explore the system:</p>
            </div>
          </div>
          <dl className="mt-3 space-y-2 text-[13px]">
            <div className="flex items-center justify-between gap-2">
              <dt className="shrink-0 text-gray-500">Username</dt>
              <dd className="flex min-w-0 items-center gap-1">
                <span className="truncate font-mono font-semibold text-gray-900">{DEMO_USERNAME}</span>
                <CopyButton value={DEMO_USERNAME} label="demo username" />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="shrink-0 text-gray-500">Password</dt>
              <dd className="flex min-w-0 items-center gap-1">
                <span className="truncate font-mono font-semibold text-gray-900">{DEMO_PASSWORD}</span>
                <CopyButton value={DEMO_PASSWORD} label="demo password" />
              </dd>
            </div>
          </dl>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen min-h-[100dvh] w-full flex-col overflow-x-hidden bg-[#E8EEF4]">
      {/* ============ DESKTOP (>= 900px): two-column layout, unaffected by mobileView ============ */}
      <div className="hidden flex-1 items-center justify-center px-6 py-10 min-[900px]:flex">
        <div className="grid w-full max-w-[1120px] grid-cols-[1fr_1.05fr] overflow-hidden rounded-[20px] bg-white shadow-[0_24px_60px_-24px_rgba(30,58,95,0.35)]">
          {/* LEFT BRANDING PANEL */}
          <aside className="relative flex min-h-[680px] flex-col overflow-hidden bg-[#1e3a5f] p-10 text-white xl:p-12">
            {/* subtle abstract decoration: soft curves + dots, very low contrast */}
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-white/[0.06]" />
              <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-white/[0.05]" />
              <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/[0.04]" />
              <div
                className="absolute right-10 top-40 h-20 w-24 opacity-50"
                style={{
                  backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 1.2px, transparent 1.2px)',
                  backgroundSize: '14px 14px',
                }}
              />
              <div
                className="absolute bottom-24 right-12 h-24 w-20 opacity-40"
                style={{
                  backgroundImage: 'radial-gradient(rgba(255,255,255,0.3) 1.2px, transparent 1.2px)',
                  backgroundSize: '14px 14px',
                }}
              />
            </div>

            <div className="relative flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-white/25 bg-white/10 text-white">
                <Users size={22} aria-hidden="true" />
              </span>
              <span className="leading-tight">
                <span className="block text-[17px] font-bold tracking-tight">Attendly</span>
                <span className="block text-xs text-white/70">People &bull; Attendance &bull; Payroll</span>
              </span>
            </div>

            <h1 className="relative mt-12 text-[40px] font-bold leading-[1.12] tracking-tight xl:mt-14">
              Simplify
              <br />
              Workforce
              <br />
              <span className="text-[#A9C8F2]">Management</span>
            </h1>
            <p className="relative mt-4 max-w-[320px] text-[15px] leading-relaxed text-white/75">
              Track attendance, manage payroll, and empower your team &mdash; all in one place.
            </p>

            <span className="relative mt-7 block h-[3px] w-12 rounded-full bg-[#5B8BD0]" aria-hidden="true" />

            <ul className="relative mt-7 space-y-5">
              {FEATURES.map(({ Icon, title, desc }) => (
                <li key={title} className="flex items-center gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-white/10 text-white">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold">{title}</span>
                    <span className="block truncate text-[13px] text-white/65">{desc}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="relative mt-auto pt-10">
              <div className="flex items-center gap-3">
                <span className="block h-[2px] w-10 rounded-full bg-[#5B8BD0]" aria-hidden="true" />
                <p className="text-xs leading-relaxed text-white/60">
                  Trusted by organizations
                  <br />
                  that build a better workplace.
                </p>
              </div>
            </div>
          </aside>

          {/* RIGHT LOGIN PANEL */}
          <div className="flex flex-col justify-center px-14 py-10 xl:px-16">
            <div className="text-center">
              <span
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-[14px] text-white"
                style={{ backgroundColor: NAVY }}
              >
                <Users size={26} aria-hidden="true" />
              </span>
              <p className="mt-3 text-[22px] font-bold tracking-tight text-gray-900">Attendly</p>
              <p className="mt-1 text-[13px] text-gray-500">People &bull; Attendance &bull; Payroll</p>
            </div>

            <h2 className="mt-8 text-[26px] font-bold tracking-tight text-gray-900">
              Welcome Back
            </h2>
            <p className="mt-1 text-sm text-gray-500">Sign in to continue to Attendly</p>

            {renderForm('login')}
            {renderDemo()}

            <p className="mt-6 text-center text-xs text-gray-400">
              Attendly &bull; Built for People. Driven by Progress.
            </p>
          </div>
        </div>
      </div>

      {/* ============ MOBILE SCREEN 1 — WELCOME (< 900px, app-like fixed screen) ============ */}
      {mobileView === 'welcome' && (
        <div className="relative flex h-[100dvh] min-h-[100dvh] w-full flex-col overflow-hidden bg-[#1e3a5f] px-6 pb-8 pt-12 text-white min-[900px]:hidden">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/[0.06]" />
            <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-white/[0.05]" />
            <div
              className="absolute right-6 top-24 h-16 w-20 opacity-60"
              style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 1.2px, transparent 1.2px)',
                backgroundSize: '12px 12px',
              }}
            />
            <div
              className="absolute bottom-40 left-6 h-16 w-20 opacity-40"
              style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.3) 1.2px, transparent 1.2px)',
                backgroundSize: '12px 12px',
              }}
            />
          </div>
          <div className="relative flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-white/25 bg-white/10 text-white">
              <Users size={22} aria-hidden="true" />
            </span>
            <span className="leading-tight">
              <span className="block text-[17px] font-bold tracking-tight">Attendly</span>
              <span className="block text-xs text-white/70">People &bull; Attendance &bull; Payroll</span>
            </span>
          </div>

          <h1 className="relative mt-10 text-[32px] font-bold leading-[1.15] tracking-tight">
            Simplify
            <br />
            Workforce
            <br />
            <span className="text-[#A9C8F2]">Management</span>
          </h1>
          <p className="relative mt-3 max-w-[300px] text-sm leading-relaxed text-white/75">
            Track attendance, manage payroll, and empower your team &mdash; all in one place.
          </p>

          <div className="relative mt-auto">
            <button
              type="button"
              onClick={() => setMobileView('login')}
              className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[12px] bg-white text-[15px] font-semibold text-[#1e3a5f] transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Continue <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* ============ MOBILE SCREEN 2 — LOGIN (< 900px, white full-screen, login only) ============ */}
      {mobileView === 'login' && (
        <div className="h-[100dvh] min-h-[100dvh] w-full overflow-y-auto bg-white min-[900px]:hidden">
          <div className="mx-auto w-full max-w-[430px] px-4 pb-8 pt-4">
            <button
              type="button"
              onClick={() => setMobileView('welcome')}
              className="inline-flex items-center gap-1.5 rounded-md px-1 py-2 text-[13px] font-medium text-[#1e3a5f] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e3a5f]"
            >
              <ArrowLeft size={16} aria-hidden="true" /> Back
            </button>

            <div className="mt-1 text-center">
              <span
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-[12px] text-white"
                style={{ backgroundColor: NAVY }}
              >
                <Users size={24} aria-hidden="true" />
              </span>
              <p className="mt-2.5 text-xl font-bold tracking-tight text-gray-900">Attendly</p>
              <p className="mt-0.5 text-xs text-gray-500">People &bull; Attendance &bull; Payroll</p>
            </div>

            <h2 className="mt-5 text-[22px] font-bold tracking-tight text-gray-900">
              Welcome Back
            </h2>
            <p className="mt-1 text-sm text-gray-500">Sign in to continue to Attendly</p>

            {renderForm('mlogin')}
            {renderDemo()}

            <p className="mt-6 text-center text-[11px] text-gray-400">
              Attendly &bull; Built for People. Driven by Progress.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
