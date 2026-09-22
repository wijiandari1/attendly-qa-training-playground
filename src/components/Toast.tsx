import { useEffect, useState } from 'react';

export interface ToastItem {
  id: number;
  kind: 'success' | 'error' | 'info';
  message: string;
}

let push: ((t: Omit<ToastItem, 'id'>) => void) | null = null;
let seq = 1;

export const toast = {
  success(message: string) {
    push?.({ kind: 'success', message });
  },
  error(message: string) {
    push?.({ kind: 'error', message });
  },
  info(message: string) {
    push?.({ kind: 'info', message });
  },
};

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    push = (t) => {
      const id = seq++;
      setItems((prev) => [...prev, { ...t, id }]);
      setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== id));
      }, 4000);
    };
    return () => {
      push = null;
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2" aria-live="polite">
      {items.map((t) => (
        <div
          key={t.id}
          role={t.kind === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto rounded-md border bg-white px-3 py-2.5 text-sm shadow-sm ${
            t.kind === 'success' ? 'border-green-200' : t.kind === 'error' ? 'border-red-200' : 'border-gray-200'
          }`}
        >
          <p className={`font-medium ${t.kind === 'success' ? 'text-green-800' : t.kind === 'error' ? 'text-red-700' : 'text-gray-800'}`}>
            {t.kind === 'success' ? 'Success' : t.kind === 'error' ? 'Error' : 'Info'}
          </p>
          <p className="text-gray-600">{t.message}</p>
        </div>
      ))}
    </div>
  );
}
