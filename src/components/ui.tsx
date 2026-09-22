import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Clock, MinusCircle, MoreVertical, X } from 'lucide-react';
import type { AttendanceStatus } from '../types';

const config: Record<AttendanceStatus, { classes: string; Icon: typeof CheckCircle2; label: string }> = {
  PRESENT: { classes: 'bg-green-50 text-green-800 border-green-200', Icon: CheckCircle2, label: 'Present' },
  LATE: { classes: 'bg-amber-50 text-amber-800 border-amber-200', Icon: Clock, label: 'Late' },
  ABSENT: { classes: 'bg-red-50 text-red-800 border-red-200', Icon: MinusCircle, label: 'Absent' },
};

export function StatusBadge({ status }: { status: AttendanceStatus }) {
  const c = config[status] ?? { classes: 'bg-gray-50 text-gray-700 border-gray-200', Icon: AlertCircle, label: status };
  const { Icon } = c;
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium ${c.classes}`}>
      <Icon size={13} aria-hidden="true" />
      {c.label}
    </span>
  );
}

export function Card({ title, subtitle, action, children, className = '' }: { title?: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`card p-4 sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-semibold text-gray-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-4 py-10 text-center">
      <AlertCircle size={22} className="mb-1 text-gray-400" aria-hidden="true" />
      <p className="text-sm font-medium text-gray-800">{title}</p>
      <p className="max-w-sm text-sm text-gray-500">{message}</p>
    </div>
  );
}

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-gray-500" role="status" aria-live="polite">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#1e3a5f]" aria-hidden="true" />
      {message}
    </div>
  );
}

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-gray-900/40" onClick={onClose} aria-hidden="true" />
      <div className="card relative max-h-[90vh] w-full max-w-lg overflow-y-auto p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Close dialog">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export interface ActionMenuOption {
  label: string;
  Icon: typeof X;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function ActionMenu({ label, options, openUp = false }: { label: string; options: ActionMenuOption[]; openUp?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, up: false });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const MENU_WIDTH = 144;
  const ITEM_HEIGHT = 37;

  function computePosition(): { top: number; left: number; up: boolean } {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return { top: 0, left: 0, up: false };
    const needed = options.length * ITEM_HEIGHT + 12;
    const below = window.innerHeight - rect.bottom;
    const above = rect.top;
    let up = openUp;
    if (!up && below < needed && above > needed) up = true;
    if (up && above < needed && below > needed) up = false;
    const top = up ? Math.max(8, rect.top - needed - 4) : rect.bottom + 4;
    const left = Math.min(Math.max(8, rect.right - MENU_WIDTH), Math.max(8, window.innerWidth - MENU_WIDTH - 8));
    return { top, left, up };
  }

  function toggle() {
    if (!open) setPos(computePosition());
    setOpen((o) => !o);
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    function onScroll() {
      setOpen(false);
    }
    function onResize() {
      setOpen(false);
    }
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open ]);

  function choose(opt: ActionMenuOption) {
    if (opt.disabled) return;
    setOpen(false);
    opt.onClick();
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
      >
        <MoreVertical size={16} aria-hidden="true" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={label}
            className="w-36 rounded-md border border-gray-200 bg-white py-1 shadow-md"
            style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 60 }}
          >
            {options.map((opt) => (
              <button
                key={opt.label}
                type="button"
                role="menuitem"
                disabled={opt.disabled}
                onClick={() => choose(opt)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                  opt.danger ? 'text-red-700 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <opt.Icon size={14} aria-hidden="true" />
                {opt.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
