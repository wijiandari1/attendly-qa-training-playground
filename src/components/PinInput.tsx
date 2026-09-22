import { useRef } from 'react';

interface PinInputProps {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function PinInput({ value, onChange, length = 6, error, disabled, autoFocus }: PinInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  function setRefs(el: HTMLInputElement | null, idx: number) {
    refs.current[idx] = el;
  }

  function focusAt(idx: number) {
    const el = refs.current[idx];
    if (el) {
      el.focus();
      el.select();
    }
  }

  function emit(next: string) {
    onChange(next.replace(/\D/g, '').slice(0, length));
  }

  function handleChange(idx: number, raw: string) {
    const clean = raw.replace(/\D/g, '');
    if (!clean) {
      const arr = value.split('');
      arr[idx] = '';
      emit(arr.join('').slice(0, length));
      return;
    }
    const char = clean[clean.length - 1];
    const arr = digits.slice();
    arr[idx] = char;
    emit(arr.join(''));
    if (idx < length - 1) focusAt(idx + 1);
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[idx]) {
        const arr = digits.slice();
        arr[idx] = '';
        emit(arr.join(''));
      } else if (idx > 0) {
        const arr = digits.slice();
        arr[idx - 1] = '';
        emit(arr.join(''));
        focusAt(idx - 1);
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault();
      focusAt(idx - 1);
    } else if (e.key === 'ArrowRight' && idx < length - 1) {
      e.preventDefault();
      focusAt(idx + 1);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (text) {
      emit(text);
      focusAt(Math.min(text.length, length - 1));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-center gap-2.5" role="group" aria-label="Payslip PIN, 6 digits">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => setRefs(el, i)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={1}
            aria-label={`Digit ${i + 1}`}
            autoFocus={autoFocus && i === 0}
            disabled={disabled}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={`h-12 w-12 rounded-full border bg-white text-center text-lg font-semibold text-gray-900 transition-colors focus:outline-none disabled:opacity-50 ${
              error
                ? 'border-red-500 focus:border-red-500'
                : d
                  ? 'border-[#1e3a5f]'
                  : 'border-gray-300 focus:border-[#1e3a5f]'
            }`}
          />
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-center text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
