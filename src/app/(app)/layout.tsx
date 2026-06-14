import { auth, signOut } from "@/auth";
import { NavLinks } from "@/components/nav-links";
import { buttonGhost } from "@/components/ui";
import { cn, initials } from "@/lib/format";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const name = session?.user?.name ?? session?.user?.email ?? "User";

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface/40 p-4 md:flex">
        <div className="px-3 py-2">
          <div className="text-sm font-semibold tracking-tight">DSEC</div>
          <div className="text-xs text-muted">Exec Dashboard</div>
        </div>
        <div className="mt-4 flex-1">
          <NavLinks className="flex-col" />
        </div>
        <div className="border-t border-border pt-3">
          <div className="flex items-center gap-2.5 px-3 py-1.5">
            <div className="grid size-7 place-items-center rounded-full bg-elevated text-xs text-muted">
              {initials(name)}
            </div>
            <div className="min-w-0 flex-1 truncate text-sm">{name}</div>
          </div>
          <SignOut className="mt-1" />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between gap-3 border-b border-border bg-surface/40 px-4 py-2 md:hidden">
        <span className="text-sm font-semibold tracking-tight">DSEC</span>
        <NavLinks className="flex-row overflow-x-auto" />
        <SignOut />
      </header>

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6">{children}</div>
      </main>
    </div>
  );
}

function SignOut({ className }: { className?: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/signin" });
      }}
    >
      <button className={cn(buttonGhost, "w-full justify-start px-3", className)}>
        Sign out
      </button>
    </form>
  );
}
