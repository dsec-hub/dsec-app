import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { site } from "@/lib/content";
import { sanitizeCallbackUrl } from "@/lib/login-redirect";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // A player sent here from games.dsec.club carries ?callbackUrl=<games URL>; we
  // validate it and hand it through the form so login drops them back there.
  const cbRaw = (await searchParams).callbackUrl;
  const callbackUrl = sanitizeCallbackUrl(Array.isArray(cbRaw) ? cbRaw[0] : cbRaw);

  // Belt-and-suspenders: the proxy already bounces signed-in users off /login.
  const session = await auth();
  if (session?.user) redirect(callbackUrl ?? "/");

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Illustration column */}
        <div className="animate-rise flex flex-col items-center text-center lg:items-start lg:text-left">
          <div className="pixel-card-lg w-full max-w-sm overflow-hidden">
            <div className="bg-void p-5">
              <Image
                src="/pixel/login-scene.png"
                alt="A pixel-art duck signing in at a retro computer showing a padlock"
                width={928}
                height={1152}
                priority
                className="mx-auto h-auto w-full"
              />
            </div>
          </div>
          <p className="eyebrow mt-5">DSEC // Members</p>
          <h2 className="mt-1 font-display text-2xl font-bold">Your club, behind the duck</h2>
          <p className="mt-2 max-w-sm text-sm text-paper/70">
            Open-source projects, member tools, and the members&apos; Discord — for paid DSEC members.
          </p>
        </div>

        {/* Sign-in column */}
        <div className="animate-rise w-full">
          <p className="eyebrow">Welcome</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-3d-pink sm:text-4xl">Member sign-in</h1>

          <div className="pixel-card mt-5 p-6">
            {/* The one rule that makes verification work — make it impossible to miss. */}
            <div className="border-[3px] border-yellow bg-panel-2 p-4">
              <p className="font-display text-sm font-bold text-yellow">Use your DUSA membership email</p>
              <p className="mt-1.5 text-sm text-paper/80">
                Sign in with the <strong>same email you used to buy your DSEC membership on DUSA</strong> —
                we&apos;ll email you a one-time code. Deakin students only.
              </p>
            </div>

            <div className="mt-6">
              <LoginForm callbackUrl={callbackUrl} />
            </div>

            <p className="mt-5 text-center font-mono text-xs text-paper/55">
              By signing in you confirm you&apos;re a current Deakin student.
            </p>
          </div>

          <p className="mt-6 text-sm text-paper/70">
            Not a member yet?{" "}
            <a href={site.dusa} target="_blank" rel="noreferrer noopener" className="font-bold text-sky underline-offset-2 hover:underline">
              Get a DSEC membership on DUSA ↗
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
