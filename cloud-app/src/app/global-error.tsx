"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          fontFamily: "system-ui, sans-serif",
          background: "#0f0a1a",
          color: "#e6e1f0",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "32rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Iris Gateway is offline
          </h1>
          <p style={{ fontSize: "0.875rem", opacity: 0.75, marginBottom: "1.5rem" }}>
            A critical error broke the application. Reload the page or come back in a moment.
          </p>
          {error.digest ? (
            <p style={{ fontFamily: "monospace", fontSize: "0.75rem", opacity: 0.5, marginBottom: "1.5rem" }}>
              ref: {error.digest}
            </p>
          ) : null}
          <button
            onClick={reset}
            style={{
              background: "#7c3aed",
              color: "#fff",
              border: "none",
              padding: "0.5rem 1.25rem",
              borderRadius: "0.5rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
