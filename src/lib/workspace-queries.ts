import "server-only";

import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, lte, or, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  attachments,
  documents,
  eventSpeakers,
  eventSponsors,
  events,
  financeReports,
  financeTransactions,
  mediaAssets,
  meetings,
  memberReports,
  members,
  people,
  projects,
  sponsorContacts,
  sponsors,
  taskBoards,
  tasks,
  usageEvents,
} from "@/db/workspace-schema";
import { todayISO } from "@/lib/format";
import { DEFAULT_BOARD_COLUMNS } from "@/lib/workspace-options";

const num = (v: unknown): number => Number(v ?? 0) || 0;

// ===========================================================================
// Members
// ===========================================================================

export async function getMemberStats() {
  const [c] = await db
    .select({
      current: sql<number>`count(*) filter (where ${members.isCurrent})`,
      dusa: sql<number>`count(*) filter (where ${members.isCurrent} and ${members.dusaMember})`,
      total: count(),
    })
    .from(members);
  const trend = await db
    .select()
    .from(memberReports)
    .orderBy(desc(memberReports.reportDate))
    .limit(16);
  return {
    current: num(c?.current),
    dusa: num(c?.dusa),
    nonDusa: num(c?.current) - num(c?.dusa),
    totalSeen: num(c?.total),
    trend: trend.reverse(), // oldest -> newest for charts
  };
}

export async function getMembers(opts: { search?: string; dusaOnly?: boolean; currentOnly?: boolean } = {}) {
  const conds = [];
  if (opts.currentOnly !== false) conds.push(eq(members.isCurrent, true));
  if (opts.dusaOnly) conds.push(eq(members.dusaMember, true));
  if (opts.search) {
    const q = `%${opts.search}%`;
    conds.push(or(ilike(members.fullName, q), ilike(members.email, q), ilike(members.studentId, q)));
  }
  return db
    .select()
    .from(members)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(members.fullName))
    .limit(500);
}

export type MemberRow = typeof members.$inferSelect;

/** Live DUSA membership row for a student id, or null. Used to surface a
 * committee person's club-membership status from their linked student id. */
export async function getMemberByStudentId(
  studentId: string | null | undefined,
): Promise<MemberRow | null> {
  const id = studentId?.trim();
  if (!id) return null;
  const [row] = await db.select().from(members).where(eq(members.studentId, id)).limit(1);
  return row ?? null;
}

export async function getFacultyBreakdown() {
  const rows = await db
    .select({ faculty: members.faculty, c: count() })
    .from(members)
    .where(eq(members.isCurrent, true))
    .groupBy(members.faculty)
    .orderBy(desc(count()));
  return rows.map((r) => ({ label: r.faculty ?? "Unknown", value: num(r.c) }));
}

// ===========================================================================
// Finance
// ===========================================================================

export async function getFinanceSummary() {
  const [report] = await db
    .select()
    .from(financeReports)
    .where(eq(financeReports.isCurrent, true))
    .limit(1);
  const [budgets] = await db
    .select({
      budget: sql<number>`coalesce(sum(${events.budgetAud}), 0)`,
      grant: sql<number>`coalesce(sum(${events.grantAud}), 0)`,
    })
    .from(events)
    .where(eq(events.archived, false));
  return {
    report: report ?? null,
    totalBudget: num(budgets?.budget),
    totalGrant: num(budgets?.grant),
  };
}

export async function getRecentTransactions(limit = 12) {
  const [report] = await db
    .select({ id: financeReports.id })
    .from(financeReports)
    .where(eq(financeReports.isCurrent, true))
    .limit(1);
  if (!report) return [];
  return db
    .select()
    .from(financeTransactions)
    .where(eq(financeTransactions.reportId, report.id))
    .orderBy(desc(financeTransactions.postingDate))
    .limit(limit);
}

export async function getCurrentTransactions() {
  const [report] = await db
    .select({ id: financeReports.id })
    .from(financeReports)
    .where(eq(financeReports.isCurrent, true))
    .limit(1);
  if (!report) return [];
  return db
    .select()
    .from(financeTransactions)
    .where(eq(financeTransactions.reportId, report.id))
    .orderBy(desc(financeTransactions.postingDate));
}

export async function getExpenseBreakdown() {
  const [report] = await db
    .select({ id: financeReports.id })
    .from(financeReports)
    .where(eq(financeReports.isCurrent, true))
    .limit(1);
  if (!report) return [];
  const rows = await db
    .select({
      label: financeTransactions.glAccountName,
      total: sql<number>`coalesce(sum(${financeTransactions.amountAbs}), 0)`,
    })
    .from(financeTransactions)
    .where(and(eq(financeTransactions.reportId, report.id), eq(financeTransactions.kind, "expense")))
    .groupBy(financeTransactions.glAccountName)
    .orderBy(desc(sql`sum(${financeTransactions.amountAbs})`))
    .limit(6);
  return rows.map((r) => ({ label: r.label ?? "Other", value: num(r.total) }));
}

export async function getEventBudgets() {
  return db
    .select({ id: events.id, name: events.name, budgetAud: events.budgetAud, grantAud: events.grantAud, status: events.status })
    .from(events)
    .where(and(eq(events.archived, false), sql`${events.budgetAud} is not null`))
    .orderBy(desc(events.budgetAud))
    .limit(20);
}

// ===========================================================================
// Tasks
// ===========================================================================

export async function getBoards() {
  return db.select().from(taskBoards).where(eq(taskBoards.archived, false)).orderBy(asc(taskBoards.name));
}

export type TaskCard = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  position: number;
  priority: string | null;
  dueDate: string | null;
  assigneeId: number | null;
  committee: string | null;
  completedAt: string | null;
  assigneeName: string | null;
};

type BoardRow = Awaited<ReturnType<typeof getBoards>>[number];

// Shared select projection for a task card (matches TaskCard).
const taskCardFields = {
  id: tasks.id, title: tasks.title, description: tasks.description, status: tasks.status,
  position: tasks.position, priority: tasks.priority, dueDate: tasks.dueDate,
  assigneeId: tasks.assigneeId, committee: tasks.committee, completedAt: tasks.completedAt,
  assigneeName: people.name,
};

// Bucket tasks into the given columns; any task whose status isn't a known
// column falls into the first column so nothing is hidden.
function toColumns(rows: TaskCard[], cols: string[]) {
  const columns = cols.map((name) => ({ name, tasks: rows.filter((t) => t.status === name) }));
  const known = new Set(cols);
  const orphans = rows.filter((t) => !known.has(t.status));
  if (orphans.length && columns[0]) columns[0].tasks.push(...orphans);
  return columns;
}

export async function getBoardWithTasks(boardId?: number): Promise<{
  board: BoardRow | null;
  boards: BoardRow[];
  columns: { name: string; tasks: TaskCard[] }[];
}> {
  const boards = await getBoards();
  const board = boardId ? boards.find((b) => b.id === boardId) ?? boards[0] : boards[0];
  if (!board) return { board: null, boards, columns: [] };
  const rows: TaskCard[] = await db
    .select(taskCardFields)
    .from(tasks)
    .leftJoin(people, eq(tasks.assigneeId, people.id))
    .where(and(eq(tasks.boardId, board.id), eq(tasks.archived, false)))
    .orderBy(asc(tasks.position), asc(tasks.id));
  const cols = (board.columns ?? [...DEFAULT_BOARD_COLUMNS]) as string[];
  return { board, boards, columns: toColumns(rows, cols) };
}

/**
 * The Inbox: tasks not assigned to any board (boardId IS NULL). Without this,
 * a task created with no board would be invisible everywhere. Shown with the
 * default columns so it behaves like a board.
 */
export async function getInboxColumns(): Promise<{
  columns: { name: string; tasks: TaskCard[] }[];
  count: number;
}> {
  const rows: TaskCard[] = await db
    .select(taskCardFields)
    .from(tasks)
    .leftJoin(people, eq(tasks.assigneeId, people.id))
    .where(and(isNull(tasks.boardId), eq(tasks.archived, false)))
    .orderBy(asc(tasks.position), asc(tasks.id));
  return { columns: toColumns(rows, [...DEFAULT_BOARD_COLUMNS]), count: rows.length };
}

export async function getTaskStats() {
  const today = todayISO();
  const [s] = await db
    .select({
      open: sql<number>`count(*) filter (where ${tasks.completedAt} is null)`,
      done: sql<number>`count(*) filter (where ${tasks.completedAt} is not null)`,
      overdue: sql<number>`count(*) filter (where ${tasks.completedAt} is null and ${tasks.dueDate} is not null and ${tasks.dueDate} < ${today})`,
      total: count(),
    })
    .from(tasks)
    .where(eq(tasks.archived, false));
  return { open: num(s?.open), done: num(s?.done), overdue: num(s?.overdue), total: num(s?.total) };
}

export async function getTasksDueSoon(days = 14, limit = 12) {
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + days);
  const horizonISO = horizon.toISOString().slice(0, 10);
  return db
    .select({
      id: tasks.id, title: tasks.title, status: tasks.status, priority: tasks.priority,
      dueDate: tasks.dueDate, committee: tasks.committee, assigneeName: people.name,
    })
    .from(tasks)
    .leftJoin(people, eq(tasks.assigneeId, people.id))
    .where(
      and(
        eq(tasks.archived, false),
        sql`${tasks.completedAt} is null`,
        sql`${tasks.dueDate} is not null`,
        lte(tasks.dueDate, horizonISO),
      ),
    )
    .orderBy(asc(tasks.dueDate))
    .limit(limit);
}

// ===========================================================================
// Projects
// ===========================================================================

export async function getProjects(opts: { publicOnly?: boolean } = {}) {
  const conds = [eq(projects.archived, false)];
  if (opts.publicOnly) conds.push(eq(projects.isPublic, true));
  return db
    .select({
      id: projects.id, name: projects.name, slug: projects.slug, summary: projects.summary,
      status: projects.status, category: projects.category, techTags: projects.techTags,
      featured: projects.featured, isPublic: projects.isPublic, repoUrl: projects.repoUrl,
      demoUrl: projects.demoUrl, leadName: people.name,
    })
    .from(projects)
    .leftJoin(people, eq(projects.leadId, people.id))
    .where(and(...conds))
    .orderBy(desc(projects.featured), desc(projects.updatedAt));
}

export async function getProjectStats() {
  const [s] = await db
    .select({
      total: sql<number>`count(*) filter (where not ${projects.archived})`,
      public: sql<number>`count(*) filter (where ${projects.isPublic} and not ${projects.archived})`,
      shipped: sql<number>`count(*) filter (where ${projects.status} in ('Completed','Showcased') and not ${projects.archived})`,
    })
    .from(projects);
  return { total: num(s?.total), public: num(s?.public), shipped: num(s?.shipped) };
}

// ===========================================================================
// Events
// ===========================================================================

export async function getUpcomingEvents(limit = 8) {
  const today = todayISO();
  return db
    .select({
      id: events.id, name: events.name, startDate: events.startDate, status: events.status,
      type: events.type, venue: events.venue, committee: events.committee, leadName: people.name,
    })
    .from(events)
    .leftJoin(people, eq(events.eventLeadId, people.id))
    .where(and(eq(events.archived, false), gte(events.startDate, today)))
    .orderBy(asc(events.startDate))
    .limit(limit);
}

/** Speakers attached to an event, each with their (optional) headshot photos.
 * Links resolve the person's name when the row has no free-text name. */
export type EventSpeakerRow = Awaited<ReturnType<typeof getEventSpeakers>>[number];

export async function getEventSpeakers(eventId: number) {
  const rows = await db
    .select({
      id: eventSpeakers.id,
      personId: eventSpeakers.personId,
      name: eventSpeakers.name,
      title: eventSpeakers.title,
      bio: eventSpeakers.bio,
      sortOrder: eventSpeakers.sortOrder,
      personName: people.name,
    })
    .from(eventSpeakers)
    .leftJoin(people, eq(eventSpeakers.personId, people.id))
    .where(and(eq(eventSpeakers.eventId, eventId), eq(eventSpeakers.archived, false)))
    .orderBy(asc(eventSpeakers.sortOrder), asc(eventSpeakers.id));
  if (!rows.length) return [];
  // Batch-load every speaker's photos in one query, then group by speaker id.
  const photos = await db
    .select()
    .from(mediaAssets)
    .where(
      and(
        eq(mediaAssets.archived, false),
        eq(mediaAssets.entityType, "speaker"),
        inArray(mediaAssets.entityId, rows.map((r) => r.id)),
      ),
    )
    .orderBy(asc(mediaAssets.sortOrder), asc(mediaAssets.id));
  const byId = new Map<number, typeof photos>();
  for (const p of photos) {
    const list = byId.get(p.entityId) ?? [];
    list.push(p);
    byId.set(p.entityId, list);
  }
  return rows.map((r) => ({
    ...r,
    displayName: r.name || r.personName || "Speaker",
    photos: byId.get(r.id) ?? [],
  }));
}

/** Sponsors linked to an event (for the logo wall), each with its logo. */
export type EventSponsorRow = Awaited<ReturnType<typeof getEventSponsors>>[number];

export async function getEventSponsors(eventId: number) {
  const rows = await db
    .select({
      id: eventSponsors.id,
      sponsorId: eventSponsors.sponsorId,
      tier: eventSponsors.tier,
      sortOrder: eventSponsors.sortOrder,
      organisation: sponsors.organisation,
      website: sponsors.website,
    })
    .from(eventSponsors)
    .innerJoin(sponsors, eq(eventSponsors.sponsorId, sponsors.id))
    .where(
      and(
        eq(eventSponsors.eventId, eventId),
        eq(eventSponsors.archived, false),
        eq(sponsors.archived, false),
      ),
    )
    .orderBy(asc(eventSponsors.sortOrder), asc(eventSponsors.id));
  if (!rows.length) return [];
  const logos = await db
    .select()
    .from(mediaAssets)
    .where(
      and(
        eq(mediaAssets.archived, false),
        eq(mediaAssets.entityType, "sponsor"),
        eq(mediaAssets.role, "logo"),
        inArray(mediaAssets.entityId, rows.map((r) => r.sponsorId)),
      ),
    )
    .orderBy(asc(mediaAssets.sortOrder), asc(mediaAssets.id));
  const byId = new Map<number, (typeof logos)[number]>();
  for (const l of logos) if (!byId.has(l.entityId)) byId.set(l.entityId, l);
  return rows.map((r) => ({ ...r, logo: byId.get(r.sponsorId) ?? null }));
}

// ===========================================================================
// Meetings + documents
// ===========================================================================

export async function getMeetings(limit = 50) {
  return db
    .select()
    .from(meetings)
    .where(eq(meetings.archived, false))
    .orderBy(desc(meetings.meetingDate))
    .limit(limit);
}

export async function getOpenActionItems(limit = 10) {
  const recent = await db
    .select({ id: meetings.id, title: meetings.title, actionItems: meetings.actionItems, meetingDate: meetings.meetingDate })
    .from(meetings)
    .where(and(eq(meetings.archived, false), sql`${meetings.actionItems} is not null`))
    .orderBy(desc(meetings.meetingDate))
    .limit(20);
  const items: { text: string; owner?: string | null; due?: string | null; meeting: string }[] = [];
  for (const m of recent) {
    for (const it of (m.actionItems ?? [])) {
      items.push({ ...it, meeting: m.title });
    }
  }
  return items.slice(0, limit);
}

export async function getDocuments(opts: { type?: string } = {}) {
  const conds = [eq(documents.archived, false)];
  if (opts.type) conds.push(eq(documents.type, opts.type));
  return db
    .select({
      id: documents.id, title: documents.title, type: documents.type, status: documents.status,
      assigneeId: documents.assigneeId, updatedAt: documents.updatedAt, assigneeName: people.name,
    })
    .from(documents)
    .leftJoin(people, eq(documents.assigneeId, people.id))
    .where(and(...conds))
    .orderBy(desc(documents.updatedAt))
    .limit(100);
}

// ===========================================================================
// Sponsors (pipeline)
// ===========================================================================

export async function getSponsorPipeline() {
  return db
    .select()
    .from(sponsors)
    .where(eq(sponsors.archived, false))
    .orderBy(desc(sponsors.valueAud));
}

/** Individual people on a sponsorship (linked or free-text), with roles. */
export type SponsorContactRow = Awaited<ReturnType<typeof getSponsorContacts>>[number];

export async function getSponsorContacts(sponsorId: number) {
  return db
    .select({
      id: sponsorContacts.id,
      personId: sponsorContacts.personId,
      name: sponsorContacts.name,
      role: sponsorContacts.role,
      email: sponsorContacts.email,
      phone: sponsorContacts.phone,
      notes: sponsorContacts.notes,
      personName: people.name,
      personEmail: people.email,
    })
    .from(sponsorContacts)
    .leftJoin(people, eq(sponsorContacts.personId, people.id))
    .where(and(eq(sponsorContacts.sponsorId, sponsorId), eq(sponsorContacts.archived, false)))
    .orderBy(asc(sponsorContacts.sortOrder), asc(sponsorContacts.id));
}

/** Tasks tagged to a sponsor — the per-sponsor task board. Open first. */
export type SponsorTaskRow = Awaited<ReturnType<typeof getSponsorTasks>>[number];

export async function getSponsorTasks(sponsorId: number) {
  return db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      completedAt: tasks.completedAt,
      assigneeName: people.name,
    })
    .from(tasks)
    .leftJoin(people, eq(tasks.assigneeId, people.id))
    .where(and(eq(tasks.relatedSponsorId, sponsorId), eq(tasks.archived, false)))
    .orderBy(sql`${tasks.completedAt} is not null`, asc(tasks.id));
}

/** Events this sponsor/partner is linked to (the other side of the link). */
export type SponsorEventRow = Awaited<ReturnType<typeof getSponsorEvents>>[number];

export async function getSponsorEvents(sponsorId: number) {
  return db
    .select({
      id: events.id,
      name: events.name,
      status: events.status,
      startDate: events.startDate,
      supportTypes: events.supportTypes,
    })
    .from(events)
    .where(and(eq(events.archived, false), eq(events.relatedSponsorId, sponsorId)))
    .orderBy(desc(events.startDate));
}

/** Uploaded documents/images attached to a sponsor. */
export type AttachmentRow = Awaited<ReturnType<typeof getSponsorAttachments>>[number];

export async function getSponsorAttachments(sponsorId: number) {
  return db
    .select()
    .from(attachments)
    .where(
      and(
        eq(attachments.archived, false),
        eq(attachments.entityType, "sponsor"),
        eq(attachments.entityId, sponsorId),
      ),
    )
    .orderBy(asc(attachments.sortOrder), asc(attachments.id));
}

// ===========================================================================
// Usage stats (admin)
// ===========================================================================

export async function getUsageSummary() {
  const today = todayISO();
  const [s] = await db
    .select({
      total: count(),
      mcp: sql<number>`count(*) filter (where ${usageEvents.source} = 'mcp')`,
      dashboard: sql<number>`count(*) filter (where ${usageEvents.source} = 'dashboard')`,
      today: sql<number>`count(*) filter (where ${usageEvents.createdAt} >= ${today})`,
      activeMembers: sql<number>`count(distinct ${usageEvents.actorLabel})`,
    })
    .from(usageEvents);
  return {
    total: num(s?.total), mcp: num(s?.mcp), dashboard: num(s?.dashboard),
    today: num(s?.today), activeMembers: num(s?.activeMembers),
  };
}

export async function getUsageByMember() {
  return db
    .select({
      actorLabel: usageEvents.actorLabel,
      actorType: usageEvents.actorType,
      total: count(),
      dashboard: sql<number>`count(*) filter (where ${usageEvents.source} = 'dashboard')`,
      mcp: sql<number>`count(*) filter (where ${usageEvents.source} = 'mcp')`,
      creates: sql<number>`count(*) filter (where ${usageEvents.action} = 'create')`,
      updates: sql<number>`count(*) filter (where ${usageEvents.action} = 'update')`,
      lastActive: sql<string>`max(${usageEvents.createdAt})`,
    })
    .from(usageEvents)
    .groupBy(usageEvents.actorLabel, usageEvents.actorType)
    .orderBy(desc(count()))
    .limit(100);
}

export async function getRecentActivity(limit = 30) {
  return db.select().from(usageEvents).orderBy(desc(usageEvents.createdAt)).limit(limit);
}

// ===========================================================================
// By-id loaders + <select> option lists (for the CRUD forms)
// ===========================================================================

export async function getProjectById(id: number) {
  const [row] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return row ?? null;
}
export async function getTaskById(id: number) {
  const [row] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return row ?? null;
}
export async function getBoardById(id: number) {
  const [row] = await db.select().from(taskBoards).where(eq(taskBoards.id, id)).limit(1);
  return row ?? null;
}
export async function getMeetingById(id: number) {
  const [row] = await db.select().from(meetings).where(eq(meetings.id, id)).limit(1);
  return row ?? null;
}
export async function getDocumentById(id: number) {
  const [row] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return row ?? null;
}

export type MediaItem = Awaited<ReturnType<typeof getMedia>>[number];

/** The entity kinds that can own uploaded media (mirrors dsec-api ENTITY_TYPES). */
export type MediaEntityType = "event" | "project" | "sponsor" | "speaker";

/** Images attached to an entity, ordered for the dashboard gallery. */
export async function getMedia(entityType: MediaEntityType, entityId: number) {
  return db
    .select()
    .from(mediaAssets)
    .where(
      and(
        eq(mediaAssets.archived, false),
        eq(mediaAssets.entityType, entityType),
        eq(mediaAssets.entityId, entityId),
      ),
    )
    .orderBy(asc(mediaAssets.sortOrder), asc(mediaAssets.id));
}

/** A sponsor's brand logo (single image, role="logo"), or null. */
export async function getSponsorLogo(sponsorId: number): Promise<MediaItem | null> {
  const rows = await getMedia("sponsor", sponsorId);
  return rows.find((m) => m.role === "logo") ?? rows[0] ?? null;
}

export type Option = { id: number; name: string };

export async function getPersonOptions(): Promise<Option[]> {
  return db.select({ id: people.id, name: people.name }).from(people)
    .where(eq(people.archived, false)).orderBy(asc(people.name));
}
export async function getEventOptions(): Promise<Option[]> {
  return db.select({ id: events.id, name: events.name }).from(events)
    .where(eq(events.archived, false)).orderBy(desc(events.startDate));
}
export async function getProjectOptions(): Promise<Option[]> {
  return db.select({ id: projects.id, name: projects.name }).from(projects)
    .where(eq(projects.archived, false)).orderBy(asc(projects.name));
}
export async function getBoardOptions(): Promise<Option[]> {
  return db.select({ id: taskBoards.id, name: taskBoards.name }).from(taskBoards)
    .where(eq(taskBoards.archived, false)).orderBy(asc(taskBoards.name));
}
export async function getMeetingOptions(): Promise<Option[]> {
  return db.select({ id: meetings.id, name: meetings.title }).from(meetings)
    .where(eq(meetings.archived, false)).orderBy(desc(meetings.meetingDate));
}
