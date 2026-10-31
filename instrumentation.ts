import * as Sentry from "@sentry/nextjs";

export async function register() {
  const { initSentry } = await import("@/lib/sentry-init");
  initSentry(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN);
}

export const onRequestError = Sentry.captureRequestError;
