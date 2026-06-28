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
