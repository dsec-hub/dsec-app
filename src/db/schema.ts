import { pgTable, varchar, index, serial, timestamp, json, text, integer, doublePrecision, uniqueIndex, boolean, foreignKey, unique, date, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const alembicVersion = pgTable("alembic_version", {
	versionNum: varchar("version_num", { length: 32 }).primaryKey().notNull(),
});

export const eventLog = pgTable("event_log", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	source: varchar({ length: 32 }).notNull(),
	externalId: varchar("external_id", { length: 256 }),
	sender: varchar({ length: 512 }),
	subject: varchar({ length: 1024 }),
	classification: varchar({ length: 64 }),
	action: varchar({ length: 64 }),
	payload: json(),
	output: text(),
	tokens: integer(),
	cost: doublePrecision(),
}, (table) => [
	index("ix_event_log_action").using("btree", table.action.asc().nullsLast().op("text_ops")),
	index("ix_event_log_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("ix_event_log_source").using("btree", table.source.asc().nullsLast().op("text_ops")),
]);

export const apiKey = pgTable("api_key", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 256 }).notNull(),
	prefix: varchar({ length: 64 }).notNull(),
	keyHash: varchar("key_hash", { length: 512 }).notNull(),
	scopes: json().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdBy: varchar("created_by", { length: 256 }),
	lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: 'string' }),
	revoked: boolean().notNull(),
}, (table) => [
	uniqueIndex("ix_api_key_prefix").using("btree", table.prefix.asc().nullsLast().op("text_ops")),
	index("ix_api_key_revoked").using("btree", table.revoked.asc().nullsLast().op("bool_ops")),
]);

export const rateLimit = pgTable("rate_limit", {
	id: serial().primaryKey().notNull(),
	keyId: integer("key_id"),
	bucket: varchar({ length: 128 }).notNull(),
	windowStart: timestamp("window_start", { withTimezone: true, mode: 'string' }).notNull(),
	count: integer().notNull(),
	triggerCountToday: integer("trigger_count_today").notNull(),
}, (table) => [
	index("ix_rate_limit_bucket").using("btree", table.bucket.asc().nullsLast().op("text_ops")),
	index("ix_rate_limit_key_id").using("btree", table.keyId.asc().nullsLast().op("int4_ops")),
	index("ix_rate_limit_window_start").using("btree", table.windowStart.asc().nullsLast().op("timestamptz_ops")),
	index("ix_ratelimit_key_window").using("btree", table.keyId.asc().nullsLast().op("timestamptz_ops"), table.windowStart.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.keyId],
			foreignColumns: [apiKey.id],
			name: "rate_limit_key_id_fkey"
		}),
	unique("uq_ratelimit_key_window").on(table.windowStart, table.keyId),
]);

export const people = pgTable("people", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 256 }).notNull(),
	type: varchar({ length: 64 }),
	committee: varchar({ length: 128 }),
	roleTitle: varchar("role_title", { length: 128 }),
	email: varchar({ length: 256 }),
	status: varchar({ length: 32 }),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	archived: boolean().default(false).notNull(),
}, (table) => [
	index("ix_people_archived").using("btree", table.archived.asc().nullsLast().op("bool_ops")),
	index("ix_people_committee").using("btree", table.committee.asc().nullsLast().op("text_ops")),
	index("ix_people_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("ix_people_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
]);

export const events = pgTable("events", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 512 }).notNull(),
	type: varchar({ length: 64 }),
	status: varchar({ length: 32 }),
	startDate: date("start_date"),
	endDate: date("end_date"),
	trimester: varchar({ length: 32 }),
	format: varchar({ length: 64 }),
	venue: varchar({ length: 256 }),
	eventLeadId: integer("event_lead_id"),
	committee: varchar({ length: 128 }),
	dusaSubmissionStatus: varchar("dusa_submission_status", { length: 64 }),
	dusaDeadline: date("dusa_deadline"),
	dusaRequired: boolean("dusa_required").default(false).notNull(),
	foodProvided: boolean("food_provided").default(false).notNull(),
	externalGuests: boolean("external_guests").default(false).notNull(),
	expectedAttendance: integer("expected_attendance"),
	actualAttendance: integer("actual_attendance"),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	archived: boolean().default(false).notNull(),
}, (table) => [
	index("ix_events_archived").using("btree", table.archived.asc().nullsLast().op("bool_ops")),
	index("ix_events_dusa_deadline").using("btree", table.dusaDeadline.asc().nullsLast().op("date_ops")),
	index("ix_events_dusa_submission_status").using("btree", table.dusaSubmissionStatus.asc().nullsLast().op("text_ops")),
	index("ix_events_event_lead_id").using("btree", table.eventLeadId.asc().nullsLast().op("int4_ops")),
	index("ix_events_start_date").using("btree", table.startDate.asc().nullsLast().op("date_ops")),
	index("ix_events_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.eventLeadId],
			foreignColumns: [people.id],
			name: "events_event_lead_id_fkey"
		}),
]);

export const sponsors = pgTable("sponsors", {
	id: serial().primaryKey().notNull(),
	organisation: varchar({ length: 256 }).notNull(),
	stage: varchar({ length: 64 }),
	contactPersonId: integer("contact_person_id"),
	tier: varchar({ length: 64 }),
	valueAud: numeric("value_aud", { precision: 12, scale:  2 }),
	dusaApproved: boolean("dusa_approved").default(false).notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	archived: boolean().default(false).notNull(),
}, (table) => [
	index("ix_sponsors_archived").using("btree", table.archived.asc().nullsLast().op("bool_ops")),
	index("ix_sponsors_contact_person_id").using("btree", table.contactPersonId.asc().nullsLast().op("int4_ops")),
	index("ix_sponsors_stage").using("btree", table.stage.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.contactPersonId],
			foreignColumns: [people.id],
			name: "sponsors_contact_person_id_fkey"
		}),
]);

export const finance = pgTable("finance", {
	id: serial().primaryKey().notNull(),
	item: varchar({ length: 256 }).notNull(),
	type: varchar({ length: 64 }),
	amountAud: numeric("amount_aud", { precision: 12, scale:  2 }),
	gstIncluded: boolean("gst_included").default(false).notNull(),
	status: varchar({ length: 32 }),
	dateRequested: date("date_requested"),
	datePaid: date("date_paid"),
	notes: text(),
	relatedEventId: integer("related_event_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	archived: boolean().default(false).notNull(),
}, (table) => [
	index("ix_finance_archived").using("btree", table.archived.asc().nullsLast().op("bool_ops")),
	index("ix_finance_related_event_id").using("btree", table.relatedEventId.asc().nullsLast().op("int4_ops")),
	index("ix_finance_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("ix_finance_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.relatedEventId],
			foreignColumns: [events.id],
			name: "finance_related_event_id_fkey"
		}),
]);

export const appUser = pgTable("app_user", {
	id: serial().primaryKey().notNull(),
	email: varchar({ length: 256 }).notNull(),
	name: varchar({ length: 256 }),
	passwordHash: varchar("password_hash", { length: 512 }).notNull(),
	role: varchar({ length: 32 }).default('exec').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("ix_app_user_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("ix_app_user_is_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
]);
