import type { Metadata } from "next";
import { Silkscreen, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { PortalHeader } from "@/components/portal-header";
import { PortalFooter } from "@/components/portal-footer";

// Same three faces as dsec-website so the portal reads as one brand: Silkscreen
// (chunky bitmap display), Hanken Grotesk (body), JetBrains Mono (utility).
const display = Silkscreen({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const body = Hanken_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://app.dsec.club"),
  title: {
    default: "DSEC Member Portal",
    template: "%s · DSEC Portal",
  },
  description:
    "The member portal for the Deakin Software Engineering Club — events, projects, and your membership in one place.",
  // Members-only surface: keep it out of search results.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-AU"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full`}
    >
      <body className="bg-bg text-paper font-body antialiased min-h-full flex flex-col">
        <a
          href="#main"
          className="absolute left-[-9999px] z-[200] font-mono text-sm focus:left-4 focus:top-4 focus:bg-pink focus:px-4 focus:py-2 focus:text-paper"
        >
          Skip to content
        </a>
        <PortalHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <PortalFooter />
      </body>
    </html>
  );
}
