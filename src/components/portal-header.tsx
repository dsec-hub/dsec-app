import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/content";

export function PortalHeader() {
  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-paper bg-panel/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center border-[3px] border-paper shadow-[3px_3px_0_0_var(--color-paper)] transition-transform duration-150 ease-[var(--ease-out-strong)] group-hover:-translate-y-0.5 group-active:translate-y-0.5">
            <Image src="/logo-s.svg" alt="" width={22} height={56} className="h-6 w-auto" aria-hidden="true" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">{site.name}</span>
          <span className="pixel-tag ml-1 hidden sm:inline-flex">Member Portal</span>
        </Link>

        <nav className="flex items-center gap-3">
          <a
            href={site.website}
            target="_blank"
            rel="noreferrer noopener"
            className="hidden font-mono text-sm font-bold uppercase tracking-wide text-paper transition-colors hover:text-blue sm:inline"
          >
            dsec.club ↗
          </a>
          {/* Member sign-in is the next milestone — shown disabled for now. */}
          <span
            className="btn btn-ghost cursor-not-allowed opacity-70 !py-2.5 !text-sm"
            aria-disabled="true"
            title="Member sign-in is coming soon"
          >
            Sign in · soon
          </span>
        </nav>
      </div>
    </header>
  );
}
