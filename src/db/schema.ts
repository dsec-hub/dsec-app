/**
 * Drizzle schema for the MEMBER PORTAL (dsec-app). It shares the Neon database
 * with dsec-hub and dsec-api but owns only its own two tables:
 *
 *   - `portal_account`    — one row per portal login (OAuth identity + membership
 *                           lifecycle). App-owned: created via
 *                           `scripts/add-portal-account-table.ts`, NOT Alembic.
 *   - `assistance_request`— a help/verification request from a member.
 *
 * Everything else here is a READ-ONLY mirror of tables owned elsewhere, declared
 * with only the columns the portal reads:
 *
 *   - `members`     — the DUSA roster (owned by dsec-api's weekly ingest). This
 *                     is the membership-verification ORACLE: a current row whose
 *                     email matches the login means "paid member".
 *   - `dusa_import` — the ingest audit log; we read it to know whether a Friday
 *                     membership import has run since a signup (so we never lock
 *                     a member before their first real verification chance).
 *
 * NEVER point `alembic --autogenerate` at this DB — it would emit destructive
 * DROPs for these app-owned tables.
 */
import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  date,
  timestamp,
  index,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/pg-core";

// --- Portal login + membership lifecycle (app-owned) ---------------------- //

export const portalAccount = pgTable(
  "portal_account",
  {
    id: serial().primaryKey().notNull(),
    // The OAuth-verified email, lowercased. The ONLY key we match against the
    // DUSA roster — OAuth proves the user controls this inbox, so it can't be
    // spoofed to claim someone else's membership.
    email: varchar({ length: 256 }).notNull(),
    name: varchar({ length: 256 }),
    avatarUrl: text("avatar_url"),
    provider: varchar({ length: 32 }), // 'google' | 'microsoft' | 'dev'
    providerAccountId: varchar("provider_account_id", { length: 256 }),
    // Denormalised snapshot of the live status, refreshed on every resolve so
    // the hub's Member Support view can list/filter without recomputing:
    // trial | verified | lapsed | locked | rejected.
    status: varchar({ length: 24 }).default("trial").notNull(),
    trialStartedAt: timestamp("trial_started_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    trialExpiresAt: timestamp("trial_expires_at", { withTimezone: true, mode: "string" }).notNull(),
    // First time we ever matched this account to a current roster member.
    verifiedAt: timestamp("verified_at", { withTimezone: true, mode: "string" }),
    // Most recent roster match — drives the lapse grace (a member who falls off
    // the roster keeps access for a short window before locking).
    lastMatchedAt: timestamp("last_matched_at", { withTimezone: true, mode: "string" }),
    // Soft link to members.id once matched (no cross-owned FK).
    memberId: integer("member_id"),
    lastCheckAt: timestamp("last_check_at", { withTimezone: true, mode: "string" }),
    // --- Onboarding + verification face photo ---
    // The member's face photo (a webp URL on Supabase, uploaded via dsec-api
    // /media). REQUIRED before a member can use the portal — it's how committee
    // visually verifies them alongside their membership card. Bytes live in
    // Supabase; we only store the URL (the portal holds no Supabase creds).
    photoUrl: text("photo_url"),
    photoUploadedAt: timestamp("photo_uploaded_at", { withTimezone: true, mode: "string" }),
    // Stamped when the member finishes (or skips the optional parts of) onboarding.
    // The hard gate is `photoUrl`; this just records that they saw the wizard.
    onboardingCompletedAt: timestamp("onboarding_completed_at", {
      withTimezone: true,
      mode: "string",
    }),
    // Committee override; wins over the automatic resolution. null | 'approved' | 'rejected'.
    manualOverride: varchar("manual_override", { length: 16 }),
    overrideBy: varchar("override_by", { length: 256 }),
    overrideNote: text("override_note"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("ix_portal_account_email").using("btree", table.email.asc().nullsLast()),
    index("ix_portal_account_status").using("btree", table.status.asc().nullsLast()),
    index("ix_portal_account_member_id").using("btree", table.memberId.asc().nullsLast()),
  ],
);

// --- Member assistance / verification requests (app-owned) ---------------- //

export const assistanceRequest = pgTable(
  "assistance_request",
  {
    id: serial().primaryKey().notNull(),
    portalAccountId: integer("portal_account_id"),
    // The portal login email (denormalised so a request survives account delete).
    email: varchar({ length: 256 }).notNull(),
    // The email the member *thinks* they used at DUSA signup (often the fix).
    contactEmail: varchar("contact_email", { length: 256 }),
    studentId: varchar("student_id", { length: 32 }),
    category: varchar({ length: 32 }).default("verification").notNull(), // verification|access|bug|other
    message: text().notNull(),
    status: varchar({ length: 16 }).default("open").notNull(), // open|resolved|dismissed
    resolutionNote: text("resolution_note"),
    resolvedBy: varchar("resolved_by", { length: 256 }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    index("ix_assistance_request_status").using("btree", table.status.asc().nullsLast()),
    index("ix_assistance_request_email").using("btree", table.email.asc().nullsLast()),
    foreignKey({
      columns: [table.portalAccountId],
      foreignColumns: [portalAccount.id],
      name: "assistance_request_portal_account_id_fkey",
    }).onDelete("set null"),
  ],
);

// --- READ-ONLY mirrors of tables owned by dsec-api ------------------------ //

/** The DUSA roster — verification oracle. Owned by dsec-api's weekly ingest. */
export const members = pgTable("members", {
  id: serial().primaryKey().notNull(),
  studentId: varchar("student_id", { length: 32 }).notNull(),
  fullName: varchar("full_name", { length: 256 }),
  email: varchar({ length: 256 }),
  dusaMember: boolean("dusa_member").default(false).notNull(),
  membershipType: varchar("membership_type", { length: 32 }),
  firstSubscriptionDate: date("first_subscription_date", { mode: "string" }),
  lastPaidDate: date("last_paid_date", { mode: "string" }),
  endDate: date("end_date", { mode: "string" }),
  isCurrent: boolean("is_current").default(true).notNull(),
});

/** Ingest audit log — we read it to detect "a membership import ran since X". */
export const dusaImport = pgTable("dusa_import", {
  id: serial().primaryKey().notNull(),
  reportType: varchar("report_type", { length: 32 }),
  status: varchar({ length: 32 }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }),
});

// --- Email one-time sign-in codes (app-owned) ----------------------------- //

/**
 * Short-lived 6-digit codes for passwordless email sign-in. We store only an
 * HMAC of the code (peppered with AUTH_SECRET), never the code itself. A code is
 * single-use (`consumedAt`), expires (`expiresAt`), and locks out after a few
 * wrong `attempts` — so the 10^6 space can't be brute-forced online.
 */
export const emailLoginCode = pgTable(
  "email_login_code",
  {
    id: serial().primaryKey().notNull(),
    email: varchar({ length: 256 }).notNull(),
    codeHash: varchar("code_hash", { length: 128 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true, mode: "string" }),
    attempts: integer().default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  },
  (table) => [index("ix_email_login_code_email").using("btree", table.email.asc().nullsLast())],
);
