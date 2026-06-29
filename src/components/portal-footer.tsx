import {
  site,
  socialHref,
  SOCIAL_LABELS,
  type SocialKey,
  type Socials,
} from "@/lib/content";

/**
 * Mirrors dsec-website's SiteFooter exactly so the portal is visually continuous
 * with the public site. The "Site" links live on dsec.club, so they're absolute
 * (same tab); the "Connect" column is built from the club's API-served socials
 * (resolved upstream with the site.* fallback), so a handle changes in one place.
 */
const siteLinks = [
  { href: `${site.website}/projects`, label: "Projects" },
  { href: `${site.website}/events`, label: "Events" },
  { href: `${site.website}/join`, label: "For students" },
  { href: `${site.website}/sponsor`, label: "Sponsor us" },
  { href: `${site.website}/about`, label: "About" },
  { href: `${site.website}/contact`, label: "Contact" },
];

// "Connect" column order — email first (primary contact), then platforms.
const FOOTER_SOCIAL_ORDER: SocialKey[] = [
  "email",
  "discord",
  "instagram",
  "linkedin",
  "github",
];

export function PortalFooter({ socials = {} }: { socials?: Socials }) {
  const connectLinks = FOOTER_SOCIAL_ORDER.filter((k) => socials[k]).map((k) => ({
    href: socialHref(k, socials[k] as string),
    // Email shows the address; the rest show the platform name.
    label: k === "email" ? (socials[k] as string) : SOCIAL_LABELS[k],
    external: k !== "email",
  }));
  return (
    <footer className="mt-auto border-t-[3px] border-paper bg-void text-paper">
      <div className="h-3 stripes opacity-90" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold text-yellow">{site.name}</span>
            <span className="font-mono text-xs text-paper/60">{"// ducks who ship"}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-paper/70">
            {site.longName}. A project-led student club at {site.campus}. Affiliated with DUSA.
          </p>
        </div>

        <nav className="flex flex-col gap-2">
          <p className="eyebrow !text-paper/50">Site</p>
          {siteLinks.map((l) => (
            <a key={l.label} href={l.href} className="slide-link text-sm hover:text-yellow">
              {l.label}
            </a>
          ))}
        </nav>

        <nav className="flex flex-col gap-2">
          <p className="eyebrow !text-paper/50">Connect</p>
          {connectLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.external ? "_blank" : undefined}
              rel={l.external ? "noreferrer noopener" : undefined}
              className="slide-link text-sm hover:text-yellow"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="border-t border-paper/15">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 font-mono text-xs text-paper/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} DSEC · {socials.email ?? site.email}</span>
          <span>Built in public. Sponsorship invoiced via DUSA (+GST).</span>
        </div>
      </div>
    </footer>
  );
}
