import { site } from "@/lib/content";

export function PortalFooter() {
  return (
    <footer className="mt-auto border-t-[3px] border-paper bg-void text-paper">
      <div className="h-3 stripes opacity-90" />
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <span className="font-display text-xl font-bold text-yellow">{site.name}</span>
          <span className="font-mono text-xs text-paper/60">{"// member portal"}</span>
        </div>
        <nav className="flex flex-wrap gap-4 font-mono text-xs text-paper/70">
          <a href={site.website} target="_blank" rel="noreferrer noopener" className="slide-link hover:text-yellow">
            dsec.club
          </a>
          <a href={site.discord} target="_blank" rel="noreferrer noopener" className="slide-link hover:text-yellow">
            Discord
          </a>
          <a href={site.github} target="_blank" rel="noreferrer noopener" className="slide-link hover:text-yellow">
            GitHub
          </a>
          <a href={`mailto:${site.email}`} className="slide-link hover:text-yellow">
            {site.email}
          </a>
        </nav>
      </div>
      <div className="border-t border-paper/15">
        <div className="mx-auto max-w-6xl px-4 py-4 font-mono text-xs text-paper/50 sm:px-6">
          © {new Date().getFullYear()} DSEC · Members only
        </div>
      </div>
    </footer>
  );
}
