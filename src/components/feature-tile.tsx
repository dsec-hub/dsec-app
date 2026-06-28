import Link from "next/link";

import { PixelDuck, type DuckName } from "@/components/pixel-duck";

function LockIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="10" rx="1" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export type FeatureTileProps = {
  title: string;
  blurb: string;
  duck: DuckName;
  /** Locked = members-only / coming-soon: dimmed, non-interactive, lock badge. */
  locked?: boolean;
  badge?: string;
  href?: string;
  /** Render `href` as a plain external anchor (new tab) rather than a Link. */
  external?: boolean;
};

/**
 * A dashboard feature card. Most tiles are `locked` for now — the portal shell
 * is intentionally "lots of locked signs" until each perk is wired up. Live
 * tiles pass an `href` (internal Link, or `external`) and omit `locked`.
 *
 * The bottom affordance carries the hierarchy: live tiles get a loud filled-pink
 * CTA with a nudging arrow (the whole card is the link, so this is a visual cue,
 * not a nested control); locked tiles get a quiet ghost status pill that reads as
 * a label, never a disabled button. Both pin to a shared baseline so the row of
 * CTAs lines up regardless of blurb length.
 */
export function FeatureTile({ title, blurb, duck, locked, badge, href, external }: FeatureTileProps) {
  const isLocked = locked || !href;

  const inner = (
    <>
      <div className="flex items-start justify-between">
        <PixelDuck name={duck} alt="" size={56} square />
        {isLocked ? (
          <span className="inline-flex items-center text-paper/45" title="Members-only — coming soon">
            <LockIcon />
          </span>
        ) : null}
      </div>
      <h3 className="mt-3 font-display text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-paper/70">{blurb}</p>

      {isLocked ? (
        <span className="mt-auto inline-flex w-fit items-center gap-1.5 border-2 border-paper/25 px-3 pb-1.5 pt-2 font-mono text-[0.7rem] font-bold uppercase leading-none tracking-[0.08em] text-paper/75">
          {badge ?? "Members-only · Soon"}
        </span>
      ) : (
        <span className="mt-auto inline-flex w-fit items-center gap-2 border-2 border-pink bg-pink px-3.5 pb-1.5 pt-2 font-mono text-[0.7rem] font-bold uppercase leading-none tracking-[0.08em] text-white">
          {badge ?? "Open"}
          <span aria-hidden className="text-sm transition-transform duration-150 ease-out group-hover:translate-x-1">
            →
          </span>
        </span>
      )}
    </>
  );

  if (isLocked) {
    return (
      <div
        className="pixel-card flex h-full flex-col p-5 opacity-65 cursor-not-allowed"
        aria-disabled="true"
      >
        {inner}
      </div>
    );
  }

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="pixel-card pixel-hover group flex h-full flex-col p-5"
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className="pixel-card pixel-hover group flex h-full flex-col p-5">
      {inner}
    </Link>
  );
}
