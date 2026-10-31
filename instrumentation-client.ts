import * as Sentry from "@sentry/nextjs";

import { initSentry } from "@/lib/sentry-init";

initSentry(process.env.NEXT_PUBLIC_SENTRY_DSN);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
