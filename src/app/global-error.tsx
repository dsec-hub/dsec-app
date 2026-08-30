"use client";

/**
 * Catches failures in the ROOT layout itself. Because that layout has crashed,
 * this file must render its own <html>/<body> — and stays deliberately
 * dependency-free (inline styles, no @/ imports) since the failure it handles
 * may be caused by one of those imports.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-AU">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "3rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#0a0a0a",
          color: "#f5efe2",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>DSEC is having a moment</h1>
        <p style={{ maxWidth: "28rem", margin: 0, opacity: 0.75 }}>
          Something broke badly enough that we could not render the page.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: "0.5rem",
            padding: "0.6rem 1.2rem",
            fontWeight: 700,
            color: "#fff",
            background: "#e91e63",
            border: "3px solid #f5efe2",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        {error.digest ? (
          <p style={{ margin: 0, fontFamily: "monospace", fontSize: "11px", opacity: 0.45 }}>
            Reference: {error.digest}
          </p>
        ) : null}
      </body>
    </html>
  );
}
