// Role-based access control primitives. PURE and edge-safe (no node/db imports)
// so `auth.config.ts` — loaded by the proxy on every request — can import it.

export type ModuleKey =
  | "events"
  | "people"
  | "sponsors"
  | "finance"
  | "tasks"
  | "projects"
  | "members"
  | "meetings"
  | "documents"
  | "admin";

export type ModuleDef = {
  key: ModuleKey;
  label: string;
  href: string;
  description: string;
};

/** Gateable modules. "Overview" (/) is intentionally absent — it is always
 * available to any active user. The "admin" module grants the admin panel AND
 * acts as a superuser flag (see `canAccess`). */
export const MODULES: ModuleDef[] = [
  { key: "events", label: "Events", href: "/events", description: "Event planning, DUSA submissions, and the calendar." },
  { key: "people", label: "People", href: "/people", description: "Committee roster and contacts." },
  { key: "sponsors", label: "Sponsors", href: "/sponsors", description: "Sponsorship pipeline and agreements." },
  { key: "finance", label: "Finance", href: "/finance", description: "Budget, grants, reimbursements, and income." },
  { key: "tasks", label: "Tasks", href: "/tasks", description: "Trello-style task boards and assignments." },
  { key: "projects", label: "Projects", href: "/projects", description: "Community projects shown on the public website." },
  { key: "members", label: "Members", href: "/members", description: "Weekly DUSA membership roster and growth stats." },
  { key: "meetings", label: "Meetings", href: "/meetings", description: "Meeting records and AI-generated minutes." },
  { key: "documents", label: "Docs", href: "/docs", description: "Notion-style docs, meeting notes, and deliverables." },
  { key: "admin", label: "Admin", href: "/admin", description: "Manage users, roles, and invites. Implies full access to every module." },
];

export const MODULE_KEYS = MODULES.map((m) => m.key);

/** Modules a non-admin role may be granted (admin is implicit/superuser). */
export const ASSIGNABLE_MODULES = MODULES;

/** A user can access `key` if their role lists it, or if it lists "admin"
 * (admin = superuser, sees everything including modules added later). */
export function canAccess(modules: readonly string[] | null | undefined, key: string): boolean {
  if (!modules) return false;
  return modules.includes("admin") || modules.includes(key);
}

export function isAdmin(modules: readonly string[] | null | undefined): boolean {
  return !!modules && modules.includes("admin");
}

/** Map a pathname to the module that owns it, or null if it is always-allowed. */
export function moduleForPath(pathname: string): ModuleKey | null {
  for (const m of MODULES) {
    if (pathname === m.href || pathname.startsWith(`${m.href}/`)) return m.key;
  }
  return null;
}

/** Keep only valid, de-duplicated module keys from arbitrary input. */
export function sanitizeModules(input: readonly string[]): ModuleKey[] {
  const valid = new Set<string>(MODULE_KEYS);
  return MODULE_KEYS.filter((k) => input.includes(k) && valid.has(k));
}

// --- Read vs write granularity ------------------------------------------------
// `canAccess`/`modules` above answer "can this role SEE the module". The helpers
// below add a second tier: which of those modules the role may also EDIT. Write
// always implies read, and "admin" is a superuser for both.

/** A user can write to `key` if they are an admin (superuser) or their role
 * grants both read AND write for that module. */
export function canWrite(
  modules: readonly string[] | null | undefined,
  writeModules: readonly string[] | null | undefined,
  key: string,
): boolean {
  if (!modules) return false;
  if (modules.includes("admin")) return true;
  return modules.includes(key) && !!writeModules?.includes(key);
}

/** Per-module access tier, as configured in the role editor. */
export type AccessLevel = "none" | "read" | "write";

/** Resolve a module's access tier from a role's read + write sets. */
export function levelFor(
  modules: readonly string[] | null | undefined,
  writeModules: readonly string[] | null | undefined,
  key: string,
): AccessLevel {
  if (!canAccess(modules, key)) return "none";
  return canWrite(modules, writeModules, key) ? "write" : "read";
}

/** Keep only valid write keys that are also granted read access (write ⊆ read). */
export function sanitizeWriteModules(
  read: readonly string[],
  write: readonly string[],
): ModuleKey[] {
  const readable = new Set<string>(sanitizeModules(read));
  return sanitizeModules(write).filter((k) => readable.has(k));
}

/** Convert per-module access tiers (from the role form) into the stored
 * `modules` (read) + `writeModules` (write) arrays, enforcing write ⊆ read. */
export function levelsToArrays(levels: Record<string, AccessLevel>): {
  modules: ModuleKey[];
  writeModules: ModuleKey[];
} {
  const read = MODULE_KEYS.filter((k) => levels[k] === "read" || levels[k] === "write");
  const write = MODULE_KEYS.filter((k) => levels[k] === "write");
  return {
    modules: sanitizeModules(read),
    writeModules: sanitizeWriteModules(read, write),
  };
}
