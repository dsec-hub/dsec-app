import "server-only";

/**
 * Branded HTML shell for portal emails — the "DSEC OS" arcade look from the
 * member portal, rebuilt for email clients: near-black canvas, cream (#f5efe2)
 * hard borders, the chunky cream offset shadow, pink/yellow neon accents and a
 * monospace display face. Everything is table-based with inline styles so it
 * survives Gmail/Outlook; the duck logo and web font are progressive niceties
 * that degrade to a text wordmark + Courier on clients that strip them.
 *
 * Keep emails reusing renderEmail() so the brand stays consistent as we add
 * more of them (welcome, membership confirmed, …).
 */

const C = {
  bg: "#0a0a0a", // page
  void: "#050505", // deepest wells / code box / footer
  panel: "#111111", // card surface
  paper: "#f5efe2", // cream — text, borders, the offset "shadow"
  paperMuted: "#b9b3a6", // dimmed cream for secondary copy
  pink: "#e91e63", // Action Pink — CTAs
  yellow: "#ffcf33", // duck identity
  sky: "#00bcd4", // CRT cyan — eyebrows / links
  ink: "#0a0714", // dark text on bright fills
} as const;

// NB: single-quote every font name — these strings get interpolated into
// double-quoted style="…" attributes, so a double quote here would terminate
// the attribute early and silently drop the rest of the CSS declaration.
const DISPLAY = `'Silkscreen', 'Courier New', Courier, monospace`;
const BODY = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;
const MONO = `'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace`;

/** Escape user/DB-supplied text before dropping it into the HTML body. */
export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Public origin of the portal, for absolute asset URLs (emails can't use relative). */
function baseUrl(): string {
  const raw =
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_WEBSITE_URL ||
    "";
  return raw.replace(/\/+$/, "");
}

/** A bulletproof pixel button (table-cell fill so Outlook renders the padding). */
export function emailButton(href: string, label: string, color: "pink" | "yellow" = "pink"): string {
  const fill = color === "yellow" ? C.yellow : C.pink;
  const text = color === "yellow" ? C.ink : "#ffffff";
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
      <tr>
        <td align="center" bgcolor="${fill}" style="border:3px solid ${C.paper};box-shadow:4px 4px 0 0 ${C.paper};">
          <a href="${href}" target="_blank"
             style="display:inline-block;padding:13px 26px;font-family:${DISPLAY};font-size:13px;font-weight:700;
                    letter-spacing:1px;text-transform:uppercase;color:${text};text-decoration:none;">${esc(label)}</a>
        </td>
      </tr>
    </table>`;
}

/** A void-well box for a one-time code — big monospace digits, cream border. */
export function codeBox(code: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 24px;">
      <tr>
        <td align="center" bgcolor="${C.void}"
            style="border:3px solid ${C.paper};box-shadow:4px 4px 0 0 ${C.paper};padding:30px 16px;">
          <div style="font-family:${MONO};font-size:40px;font-weight:700;line-height:1;
                      letter-spacing:14px;color:${C.yellow};text-indent:14px;">${esc(code)}</div>
        </td>
      </tr>
    </table>`;
}

/** A label/value row used in the internal alert email. */
export function infoRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:4px 0;font-family:${MONO};font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${C.sky};white-space:nowrap;vertical-align:top;">${esc(label)}</td>
      <td style="padding:4px 0 4px 14px;font-family:${BODY};font-size:14px;color:${C.paper};">${esc(value)}</td>
    </tr>`;
}

type EmailOpts = {
  /** Hidden inbox-preview line. */
  preview: string;
  /** Small cyan eyebrow above the heading, e.g. "MEMBER PORTAL". */
  eyebrow?: string;
  /** Display heading (monospace). */
  heading: string;
  /** Pre-built inner HTML (paragraphs, codeBox, button, infoRow rows in a table…). */
  body: string;
};

/**
 * Wrap inner body HTML in the full branded document. Returns a complete
 * `<!doctype html>` string ready to hand to Resend's `html` field.
 */
export function renderEmail({ preview, eyebrow, heading, body }: EmailOpts): string {
  const base = baseUrl();
  // Text wordmark only — no logo image.
  const brand = `<div style="font-family:${DISPLAY};font-size:30px;font-weight:700;letter-spacing:3px;color:${C.paper};">DSEC<span style="color:${C.yellow};">.</span></div>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>DSEC</title>
  <link href="https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
  <style>
    body { margin:0 !important; padding:0 !important; width:100% !important; background:${C.bg}; }
    a { color:${C.sky}; }
    @media (max-width:520px){ .px-wrap{ width:100% !important; } .px-pad{ padding:32px 24px !important; } }
  </style>
</head>
<body style="margin:0;padding:0;background:${C.bg};">
  <span style="display:none !important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${esc(preview)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bg}" style="background:${C.bg};">
    <tr>
      <td align="center" style="padding:44px 16px;">
        <table role="presentation" class="px-wrap" width="480" cellpadding="0" cellspacing="0" border="0" style="width:480px;max-width:480px;">

          <!-- Brand -->
          <tr><td align="center" style="padding-bottom:30px;">${brand}</td></tr>

          <!-- Panel: pixel-card -->
          <tr>
            <td bgcolor="${C.panel}" class="px-pad"
                style="background:${C.panel};border:3px solid ${C.paper};box-shadow:6px 6px 0 0 ${C.paper};padding:44px 40px;">
              ${eyebrow ? `<div style="font-family:${MONO};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:${C.sky};margin:0 0 16px;">${esc(eyebrow)}</div>` : ""}
              <h1 style="margin:0 0 24px;font-family:${DISPLAY};font-size:21px;line-height:1.3;font-weight:700;color:${C.paper};">${esc(heading)}</h1>
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:34px 12px 6px;">
              <div style="font-family:${MONO};font-size:11px;letter-spacing:2px;color:#6f6a60;text-transform:uppercase;">ducks who ship</div>
              <div style="font-family:${BODY};font-size:12px;color:#6f6a60;padding-top:10px;">
                DSEC — Deakin Software Engineering Club${base ? ` &middot; <a href="${base}" target="_blank" style="color:#8a857a;text-decoration:underline;">app.dsec.club</a>` : ""}
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Shared paragraph helper so body copy is consistent. */
export function p(html: string): string {
  return `<p style="margin:0 0 18px;font-family:${BODY};font-size:15px;line-height:1.65;color:${C.paperMuted};">${html}</p>`;
}

export const emailColors = C;
