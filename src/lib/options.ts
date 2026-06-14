// Controlled vocabularies for the club domain. Used to populate form <select>s
// and to drive status colours. Values match what the dashboard queries expect.

export const EVENT_STATUSES = [
  "Idea",
  "Planning",
  "Confirmed",
  "Completed",
  "Cancelled",
] as const;

export const EVENT_TYPES = [
  "Social",
  "Networking",
  "Workshop",
  "Flagship",
  "Meeting",
  "Outreach",
  "Other",
] as const;

export const DUSA_STATUSES = [
  "Not Started",
  "Submitted",
  "Approved",
  "Rejected",
  "Not Required",
] as const;

export const EVENT_FORMATS = ["In-person", "Online", "Hybrid"] as const;

export const PERSON_TYPES = [
  "Exec",
  "Committee Lead",
  "Committee Member",
  "General Member",
  "External Contact",
] as const;

export const PERSON_STATUSES = ["Active", "Inactive", "Alumni", "Prospect"] as const;

export const COMMITTEES = [
  "Executive",
  "Events",
  "Marketing",
  "Sponsorship",
  "Technical",
  "Operations",
] as const;

export const SPONSOR_STAGES = [
  "Prospect",
  "Contacted",
  "Negotiating",
  "Secured",
  "Declined",
] as const;

export const SPONSOR_TIERS = ["Bronze", "Silver", "Gold", "Platinum"] as const;

export const FINANCE_TYPES = [
  "Grant",
  "Sponsorship Income",
  "Reimbursement",
  "Other Expense",
] as const;

export const FINANCE_STATUSES = [
  "Requested",
  "Invoiced",
  "Pending",
  "Approved",
  "Paid",
  "Rejected",
] as const;

// Status -> badge variant, for consistent colour across the app.
export type BadgeVariant = "neutral" | "accent" | "success" | "warning" | "danger";

export function dusaVariant(status: string | null | undefined): BadgeVariant {
  switch (status) {
    case "Approved":
    case "Not Required":
      return "success";
    case "Submitted":
      return "accent";
    case "Rejected":
      return "danger";
    default:
      return "warning"; // Not Started / unknown
  }
}

export function eventStatusVariant(status: string | null | undefined): BadgeVariant {
  switch (status) {
    case "Confirmed":
      return "success";
    case "Planning":
      return "accent";
    case "Idea":
      return "warning";
    case "Cancelled":
      return "danger";
    default:
      return "neutral"; // Completed
  }
}

export function financeStatusVariant(status: string | null | undefined): BadgeVariant {
  switch (status) {
    case "Paid":
      return "success";
    case "Rejected":
      return "danger";
    case "Approved":
    case "Invoiced":
      return "accent";
    default:
      return "warning"; // Requested / Pending
  }
}
