import { site } from "@/lib/content";

/**
 * Mirrors dsec-website's SiteFooter exactly so the portal is visually continuous
 * with the public site. The "Site" links live on dsec.club, so they're absolute
 * (same tab); "Connect" links are external as on the website.
 */
const siteLinks = [
  { href: `${site.website}/projects`, label: "Projects" },
  { href: `${site.website}/events`, label: "Events" },
  { href: `${site.website}/join`, label: "For students" },
  { href: `${site.website}/sponsor`, label: "Sponsor us" },
  { href: `${site.website}/about`, label: "About" },
  { href: `${site.website}/contact`, label: "Contact" },
];

const connectLinks = [
  { href: `mailto:${site.email}`, label: site.email },
  { href: site.discord, label: "Discord" },
  { href: site.github, label: "GitHub" },
  { href: site.linkedin, label: "LinkedIn" },
];

export function PortalFooter() {
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
              target="_blank"
              rel="noreferrer noopener"
              className="slide-link text-sm hover:text-yellow"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="border-t border-paper/15">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 font-mono text-xs text-paper/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} DSEC · {site.email}</span>
          <span>Built in public. Sponsorship invoiced via DUSA (+GST).</span>
        </div>
      </div>
    </footer>
  );
}
