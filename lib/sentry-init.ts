import * as Sentry from "@sentry/nextjs";

// Errors only: no tracing, no session replay, no default PII (IP addresses, cookies, user details).
export function initSentry(dsn: string | undefined) {
  Sentry.init({
    dsn,
    enabled: Boolean(dsn),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0,
    beforeSend(event) {
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
        delete event.request.data;
      }
      delete event.user;
      return event;
    },
  });
}
