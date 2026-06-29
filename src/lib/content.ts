/**
 * Portal-wide constants. The member portal shares DSEC's brand + design system
 * with dsec-website but is its own surface (app.dsec.club). Kept intentionally
 * small for now — feature pages will add their own data loaders.
 */

export const site = {
  name: "DSEC",
  longName: "Deakin Software Engineering Club",
  portalName: "Member Portal",
  email: "admin@dsec.club",
  // Public site URL — configured via env (NEXT_PUBLIC_ so client components like
  // the navbar can read it), so local dev can point the DSEC links at a local
  // website. Falls back to production.
  website: process.env.NEXT_PUBLIC_WEBSITE_URL || "https://dsec.club",
  // Games surface (games.dsec.club). Same env pattern as `website` so local dev
  // can point at the locally running dsec-games app. Falls back to production.
  games: process.env.NEXT_PUBLIC_GAMES_URL || "https://games.dsec.club",
  // Where students BUY membership (Deakin students only). The portal points here
  // for anyone who isn't a member yet, and members must sign in with the email
  // they used on this page.
  dusa: "https://www.dusa.org.au/clubs/deakin-software-engineering-club-dsec",
  discord: "https://discord.gg/REPLACE-permanent-invite", // PLACEHOLDER
  github: "https://github.com/dsec-hub",
  linkedin: "https://www.linkedin.com/company/REPLACE", // PLACEHOLDER
  instagram: "https://instagram.com/REPLACE", // PLACEHOLDER
  campus: "Deakin University · Burwood",
};

/**
 * The club's canonical socials — the single set served by dsec-api (the public
 * link-tree feed) and used wherever the portal shows social links (the footer).
 * Edited once by the committee in dsec-hub, so a handle changes in one place.
 * `email` is a bare address; the rest are absolute http(s) URLs.
 */
export type SocialKey = "instagram" | "discord" | "linkedin" | "github" | "email";

/** Only the platforms that actually have a (non-placeholder) value are present. */
export type Socials = Partial<Record<SocialKey, string>>;

export const SOCIAL_LABELS: Record<SocialKey, string> = {
  instagram: "Instagram",
  discord: "Discord",
  linkedin: "LinkedIn",
  github: "GitHub",
  email: "Email",
};

/** Hardcoded fallback, read from the real `site.*` values. Used only when the
 *  dsec-api feed is unset/down or a social hasn't been set yet; placeholder
 *  (…REPLACE) / empty values are dropped by `resolveSocials`. */
const FALLBACK_SOCIALS: Record<SocialKey, string> = {
  instagram: site.instagram,
  discord: site.discord,
  linkedin: site.linkedin,
  github: site.github,
  email: site.email,
};

/** Merge live API socials with the fallback, dropping empty/"REPLACE" values.
 *  The API wins, so the committee can override everything from dsec-hub. */
export function resolveSocials(
  api: Partial<Record<SocialKey, string | null>> | undefined,
): Socials {
  const out: Socials = {};
  for (const key of Object.keys(SOCIAL_LABELS) as SocialKey[]) {
    const live = (api?.[key] ?? "").trim();
    const value = live || FALLBACK_SOCIALS[key] || "";
    if (value && !value.includes("REPLACE")) out[key] = value;
  }
  return out;
}

/** The href for a social: `email` becomes a mailto:, the rest pass through. */
export function socialHref(key: SocialKey, value: string): string {
  return key === "email" ? `mailto:${value}` : value;
}

/**
 * Top-nav links — the SAME set as dsec-website's nav, so the portal navbar
 * matches the public site. Those pages live on dsec.club, so they're absolute
 * links out to the website (the portal's own member content stays gated).
 */
export const nav = [
  { href: `${site.website}/projects`, label: "Projects" },
  { href: `${site.website}/events`, label: "Events" },
  { href: `${site.website}/sponsor`, label: "Sponsor us" },
  { href: `${site.website}/about`, label: "About" },
  { href: `${site.website}/contact`, label: "Contact" },
];
