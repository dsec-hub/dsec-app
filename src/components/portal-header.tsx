"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { signOutAction } from "@/app/actions";
import { nav, site } from "@/lib/content";

/**
 * Mirrors dsec-website's SiteHeader exactly — same chrome, same nav links, same
 * Sign in / Join CTAs — so crossing from dsec.club to the portal is seamless.
 * The nav points to the public site (absolute, same tab); the only difference is
 * the auth cluster: a signed-in member sees Dashboard + Sign out instead of Sign in/Join.
 * `email` is resolved server-side in the root layout (this is a client component
 * for the mobile menu toggle).
 */
export function PortalHeader({ email }: { email: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-paper bg-panel/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* The DSEC mark returns to the public site (dsec.club), matching the
            website's logo-home behaviour and keeping the cross-site feel seamless. */}
        <a href={site.website} className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center border-[3px] border-paper shadow-[3px_3px_0_0_var(--color-paper)] transition-transform duration-150 ease-[var(--ease-out-strong)] group-hover:-translate-y-0.5 group-active:translate-y-0.5">
            <Image src="/logo-s.svg" alt="" width={22} height={56} className="h-6 w-auto" aria-hidden="true" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">{site.name}</span>
        </a>

        <nav className="hidden items-center gap-3 md:flex lg:gap-4">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-3 py-2 font-mono text-sm font-bold uppercase tracking-wide text-paper transition-colors hover:text-blue"
            >
              {item.label}
            </a>
          ))}
          {email ? (
            <>
              <form action={signOutAction} className="ml-3">
                <button type="submit" className="btn btn-ghost !py-2.5 !text-sm">
                  Sign out
                </button>
              </form>
              <Link href="/dashboard" className="btn btn-pink !py-2.5 !text-sm">
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost ml-3 !py-2.5 !text-sm">
                Sign in
              </Link>
              <a href={`${site.website}/join`} className="btn btn-pink !py-2.5 !text-sm">
                Join
              </a>
            </>
          )}
        </nav>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center border-[3px] border-paper bg-panel shadow-[3px_3px_0_0_var(--color-paper)] transition-transform duration-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none md:hidden"
        >
          <span className="font-mono text-lg font-bold leading-none">{open ? "×" : "≡"}</span>
        </button>
      </div>

      {open && (
        <div className="menu-drop border-t-[3px] border-paper bg-panel md:hidden">
          <nav className="stagger mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="slide-link py-1 font-mono text-sm font-bold uppercase tracking-wide"
              >
                › {item.label}
              </a>
            ))}
            {email ? (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)} className="btn btn-pink mt-2 justify-center">
                  Dashboard
                </Link>
                <form action={signOutAction} className="mt-2">
                  <button type="submit" className="btn btn-ghost w-full justify-center">
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="btn btn-ghost mt-2 justify-center">
                  Sign in
                </Link>
                <a href={`${site.website}/join`} onClick={() => setOpen(false)} className="btn btn-pink justify-center">
                  Join
                </a>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
