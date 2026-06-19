"use client";

import { useRef, useState } from "react";

/**
 * Segmented one-time-code input: N single-digit boxes with auto-advance,
 * backspace-to-previous, arrow-key nav, and paste-to-fill. The joined value is
 * mirrored into a hidden `<input name>` so it submits with the enclosing form.
 */
export function OtpInput({
  length = 6,
  name = "code",
  disabled = false,
  autoFocus = true,
}: {
  length?: number;
  name?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const [vals, setVals] = useState<string[]>(() => Array(length).fill(""));
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const focus = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  function setAt(i: number, ch: string) {
    setVals((prev) => {
      const next = [...prev];
      next[i] = ch;
      return next;
    });
  }

  function handleChange(i: number, raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (!digits) {
      setAt(i, "");
      return;
    }
    // Typing into a box (or autofill dropping several): spread across boxes.
    setVals((prev) => {
      const next = [...prev];
      for (let k = 0; k < digits.length && i + k < length; k++) next[i + k] = digits[k];
      return next;
    });
    focus(i + digits.length);
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (vals[i]) {
        setAt(i, "");
      } else if (i > 0) {
        focus(i - 1);
        setAt(i - 1, "");
      }
    } else if (e.key === "ArrowLeft") {
      focus(i - 1);
    } else if (e.key === "ArrowRight") {
      focus(i + 1);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!digits) return;
    e.preventDefault();
    const next = Array(length).fill("");
    for (let k = 0; k < digits.length; k++) next[k] = digits[k];
    setVals(next);
    focus(digits.length);
  }

  return (
    <div>
      <div className="flex gap-2 sm:gap-2.5" onPaste={handlePaste}>
        {Array.from({ length }).map((_, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={vals[i]}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={length}
            disabled={disabled}
            autoFocus={autoFocus && i === 0}
            aria-label={`Digit ${i + 1} of ${length}`}
            className="h-12 w-10 border-[3px] border-paper bg-void text-center font-display text-xl text-paper shadow-[2px_2px_0_0_var(--color-paper)] outline-none transition-colors focus:border-pink disabled:opacity-50 sm:h-14 sm:w-12 sm:text-2xl"
          />
        ))}
      </div>
      <input type="hidden" name={name} value={vals.join("")} />
    </div>
  );
}
