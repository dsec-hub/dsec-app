// Helpers for reading FormData in Server Actions. Empty strings become null so
// optional columns stay null rather than "".

export function str(fd: FormData, key: string): string | null {
  const v = (fd.get(key) as string | null)?.trim();
  return v ? v : null;
}

export function int(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === null) return null;
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
}

/** Numeric/decimal columns are string-mode in Drizzle — keep the value as a string. */
export function num(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  if (v === null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : String(n);
}

export function bool(fd: FormData, key: string): boolean {
  return fd.get(key) != null; // a checked checkbox is present; unchecked is absent
}
