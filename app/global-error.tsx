"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: "#09090b", color: "#fafafa", fontFamily: "system-ui, sans-serif", display: "grid", minHeight: "100vh", placeItems: "center", textAlign: "center" }}>
        <main>
          <h1>That page didn’t load.</h1>
          <p>Your work is safe. Try again in a moment.</p>
          <button onClick={reset} type="button">Try again</button>
        </main>
      </body>
    </html>
  );
}
