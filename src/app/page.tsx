import { PixelDuck, type DuckName } from "@/components/pixel-duck";
import { getUpcomingEvents } from "@/lib/api";
import { site } from "@/lib/content";

function formatDate(iso: string | null): string {
  if (!iso) return "Date TBC";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

const features: { duck: DuckName; title: string; blurb: string }[] = [
  { duck: "duck-laptop", title: "Your Profile", blurb: "Headshot, bio, and links — the same profile that powers the public team page." },
  { duck: "duck-trophy", title: "Events & RSVPs", blurb: "See what's on, RSVP, and grab your ticket — synced live from the club calendar." },
  { duck: "duck-rocket", title: "Projects", blurb: "Browse active builds, find a team, and track what the club is shipping." },
  { duck: "duck-coffee", title: "Membership", blurb: "Your DUSA membership status, perks, and renewals in one place." },
];

const EVENT_DUCKS: DuckName[] = ["duck-trophy", "duck-rocket", "duck-coffee", "duck-laptop"];

export default async function PortalHome() {
  const events = await getUpcomingEvents(4);

  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-12 sm:px-6">
        <div className="grid items-center gap-8 md:grid-cols-[1.3fr_1fr]">
          <div className="animate-rise">
            <p className="eyebrow">DSEC // Members</p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-3d-pink sm:text-5xl">
              Member Portal
            </h1>
            <p className="mt-5 max-w-md text-lg text-paper/80">
              Welcome to the DSEC member portal — your home for events, projects, and your
              membership. We&apos;re just getting started; more lands here soon.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <span className="btn btn-pink cursor-not-allowed opacity-70" aria-disabled="true">
                Sign in · coming soon
              </span>
              <a href={site.website} target="_blank" rel="noreferrer noopener" className="btn btn-ghost">
                Visit dsec.club ↗
              </a>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <PixelDuck name="duck-wave" alt="A pixel-art duck waving hello" size={220} priority bob />
          </div>
        </div>
      </section>

      <div className="skyline my-2" aria-hidden="true" />

      {/* Feature preview */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="eyebrow">What&apos;s coming</p>
        <h2 className="mt-2 font-display text-2xl font-bold">Built for members</h2>
        <div className="stagger mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="pixel-card pixel-hover p-5">
              <PixelDuck name={f.duck} alt="" size={64} />
              <h3 className="mt-3 font-display text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-paper/70">{f.blurb}</p>
              <span className="pixel-tag mt-4">Coming soon</span>
            </div>
          ))}
        </div>
      </section>

      {/* Live events strip — proves the shared-API wiring */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Live from the club</p>
            <h2 className="mt-2 font-display text-2xl font-bold">Upcoming events</h2>
          </div>
          <a
            href={`${site.website}/events`}
            target="_blank"
            rel="noreferrer noopener"
            className="font-mono text-sm font-bold uppercase tracking-wide text-blue transition-colors hover:text-pink"
          >
            All events ↗
          </a>
        </div>

        {events === null ? (
          <p className="pixel-card mt-6 p-5 font-mono text-sm text-paper/70">
            Couldn&apos;t reach the club API. Set <span className="text-sky">DSEC_API_URL</span> and make
            sure dsec-api is running.
          </p>
        ) : events.length === 0 ? (
          <div className="pixel-card mt-6 flex items-center gap-4 p-5">
            <PixelDuck name="duck-coffee" alt="" size={56} />
            <p className="text-sm text-paper/70">No upcoming events posted yet — check back soon.</p>
          </div>
        ) : (
          <div className="stagger mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {events.map((e, i) => (
              <article key={e.slug} className="pixel-card pixel-hover overflow-hidden">
                <div className="flex h-28 items-center justify-center bg-panel-2">
                  <PixelDuck name={EVENT_DUCKS[i % EVENT_DUCKS.length]} alt="" size={60} />
                </div>
                <div className="border-t-[3px] border-paper p-4">
                  <p className="font-mono text-xs uppercase tracking-wide text-sky">{formatDate(e.date)}</p>
                  <h3 className="mt-1 font-display text-base font-bold leading-snug">{e.title}</h3>
                  {(e.venue || e.type) && (
                    <p className="mt-1 text-xs text-paper/60">
                      {[e.type, e.venue].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
