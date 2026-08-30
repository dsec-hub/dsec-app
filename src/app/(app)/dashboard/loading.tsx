/**
 * Dashboard skeleton — shown while the layout + page resolve their DB round-trip
 * and the dsec-api membership-card fetch. Mirrors the real layout (greeting →
 * membership card → perks grid) so the shift when content lands is minimal.
 */
export default function DashboardLoading() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="h-3 w-24 bg-paper/15" />
      <div className="mt-3 h-9 w-64 bg-paper/15" />
      <div className="mt-3 h-4 w-full max-w-xl bg-paper/10" />

      <section className="mt-8">
        <div className="pixel-card-lg p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 border-[3px] border-paper bg-paper/10" />
            <div className="flex-1">
              <div className="h-3 w-28 bg-paper/15" />
              <div className="mt-2 h-5 w-40 bg-paper/15" />
              <div className="mt-2 h-3 w-32 bg-paper/10" />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="h-3 w-28 bg-paper/15" />
        <div className="mt-2 h-7 w-52 bg-paper/15" />
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="pixel-card h-40 p-6">
              <div className="h-10 w-10 bg-paper/10" />
              <div className="mt-4 h-4 w-24 bg-paper/15" />
              <div className="mt-2 h-3 w-full bg-paper/10" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
