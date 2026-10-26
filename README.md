# Proof

Proof is a Next.js App Router application for logging one thing you shipped each day. It includes a working seeded preview, Supabase email/OAuth auth and Postgres persistence, public builder pages, share-card image generation, and Stripe-powered Pro billing.

## Stack

- Next.js App Router, React, TypeScript
- Tailwind CSS and shadcn/ui-compatible components
- Supabase Auth, Postgres, and row-level security
- Stripe Checkout, Billing Portal, and signed webhooks
- `next/og` (`ImageResponse`) for share images
- Framer Motion for restrained transitions

## Run the preview

1. Install Node.js 20.9 or later.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and add your Supabase project URL and anon/publishable key. Set `NEXT_PUBLIC_SITE_URL` to your local origin for local billing tests; leave it empty for browser-origin auth redirects.
4. Run `npm run dev` and open [http://localhost:3000](http://localhost:3000).

The dashboard uses realistic, seeded Alex Morgan demo data when Supabase is not configured. Demo entries are kept in this browser. The app never sends demo entries to a server. Visit `/demo` for the seeded preview; `/alex-morgan` is the sample public profile.

## Configure Supabase Auth and Postgres

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL Editor. It creates the profile/ship/subscription tables, RLS policies, timezone-aware ship/rest-day RPCs, reporting/reminder tables, and the public `avatars` storage bucket with per-user upload rules. For an existing installation, run [`supabase/migrations/20261025_part1_pro_billing.sql`](./supabase/migrations/20261025_part1_pro_billing.sql) and then [`supabase/migrations/20261025_part2_trust_timezone.sql`](./supabase/migrations/20261025_part2_trust_timezone.sql).
3. Add the project URL and anon/publishable key to `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Add the service role key to `SUPABASE_SERVICE_ROLE_KEY`. Keep this key server-only; never prefix it with `NEXT_PUBLIC_`.
5. Configure Auth redirects as described in [Auth setup](#auth-setup). The canonical production origin is `https://www.tryproof.net`; the apex host permanently redirects to it.
6. Enable email in **Authentication → Providers**. Proof uses passwordless magic links; the first successful email sign-in automatically creates an account and public profile.
7. For GitHub, create a GitHub OAuth App. Set its callback URL to `https://<project-ref>.supabase.co/auth/v1/callback`, then paste the app's client ID and client secret into Supabase's GitHub provider settings.
8. For Google, create a Web OAuth client in Google Cloud. Add `https://<project-ref>.supabase.co/auth/v1/callback` as an authorized redirect URI, then paste the client ID and secret into Supabase's Google provider settings. Publish/configure the OAuth consent screen for the users you intend to allow.
9. Set `NEXT_PUBLIC_SITE_URL` to `https://www.tryproof.net` in production and to the local origin when testing billing locally.

The GitHub and Google buttons work after the corresponding provider credentials and redirect URLs are configured. New social/email sign-ins create a profile automatically. People can personalize their display name, username, one-line intro, bio, location, website, and profile photo in Settings; profile photos accept JPG/PNG/WebP up to 5 MB. Email/OAuth routes require Supabase configuration. Authenticated profile and ship writes are owner-scoped by RLS; public profile and avatar reads are intentional.

### Auth setup

Set the canonical URL and provider redirects consistently; a mismatch between apex and `www` can prevent the auth cookie from being set on the callback host.

- **Production URL:** `NEXT_PUBLIC_SITE_URL=https://www.tryproof.net`. The app permanently redirects `tryproof.net` to `www.tryproof.net`.
- **Supabase → Authentication → URL Configuration:** set **Site URL** to `https://www.tryproof.net` and add `https://www.tryproof.net/auth/callback` to **Redirect URLs**. For local testing, add the local callback origin you use and set `NEXT_PUBLIC_SITE_URL` to that same origin.
- **GitHub OAuth App:** set its authorization callback URL to `https://<project-ref>.supabase.co/auth/v1/callback`, then configure the matching client ID and secret in Supabase’s GitHub provider.
- **Google OAuth client:** add `https://<project-ref>.supabase.co/auth/v1/callback` as an authorized redirect URI, then configure the matching client ID and secret in Supabase’s Google provider.
- **Email sign-in/confirmation:** Supabase email links return to `/auth/callback` on `NEXT_PUBLIC_SITE_URL`; allow that callback in the redirect URL list.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. It must not use a `NEXT_PUBLIC_` prefix.

The migration adds timezone-aware daily ship logging, up to two rest days per calendar month, public-profile visibility controls, report storage, and reminder preferences. The ship and rest-day RPCs serialize changes against the account profile so a ship and rest day cannot both be recorded for the same local date. Profile reports are rate-limited in the database by an HMAC of the request IP; set the hosting platform to supply a trustworthy `x-forwarded-for` header.

## Configure Stripe

1. Create recurring monthly ($8) and yearly ($60) Proof Pro prices in Stripe. For local testing, use Stripe test-mode prices.
2. Set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_MONTHLY`, and `STRIPE_PRICE_YEARLY` in the server environment. Keep the secret key server-side.
3. Register `https://www.tryproof.net/api/stripe/webhook` for `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed`.
4. Set the endpoint signing secret as `STRIPE_WEBHOOK_SECRET`. The webhook verifies signatures and stores processed event IDs; subscription plan/status data is written only by its server-side service-role client.
5. Configure Stripe's customer portal to allow payment-method updates, plan changes, cancellations, and invoice history.
6. To test locally, use Stripe test keys and prices, set `NEXT_PUBLIC_SITE_URL` to your local app origin, then run `stripe listen --forward-to localhost:3000/api/stripe/webhook`. Put the signing secret printed by the CLI in `STRIPE_WEBHOOK_SECRET`.

Checkout and the billing portal require an authenticated Supabase user. A past-due subscription retains Pro access for up to seven days after its current period ends, with a billing notice and portal link. Webhook requests are verified against the raw request body. Pro state is synchronized only by the server-side Stripe webhook.

## Production notes

- Create a Vercel project from this folder and configure the same environment variables in each deployment environment.
- Set the Supabase project's site URL to your production origin and add production/local callback URLs to its redirect allow-list.
- The public share image is `/api/cards/<username>?format=landscape` (1200×630) or `?format=portrait` (1080×1350). Public profiles expose a canonical `/[username]` URL and an Open Graph image.
- Share cards use the included Proof theme by default. Pro accounts can select the mono/grid themes and remove Proof branding with the card controls.
- Review the generated [`/privacy`](./app/privacy/page.tsx), [`/terms`](./app/terms/page.tsx), and [`/support`](./app/support/page.tsx) content with qualified counsel and replace the support contact address before production.
- The Proof Tree grows category-colored leaves from the shipping log and appears on the dashboard and public profile. Pro adds a monthly canopy report with month-over-month growth, strongest work lane, and next milestone alongside 30, 90, and 365-day shipping analytics, builder XP, levels, and milestone badges. Analytics do not track profile visitors.
- Demo data is generated for the preview and not written to Supabase. A signed-in account starts with its own database-backed log.

### Optional email reminders

1. Set `RESEND_API_KEY` and a verified sender in `REMINDER_FROM_EMAIL`.
2. Set a long random `CRON_SECRET` in the deployment environment.
3. Schedule an hourly `POST` request to `/api/reminders/send` with the header `Authorization: Bearer <CRON_SECRET>`. The endpoint only sends during each opted-in user's 9 a.m. local hour and skips dates already shipped or marked as rest days.
4. Users opt in from Settings and can unsubscribe through the one-click link included with each message. Reminder delivery requires a verified Resend sender and the scheduler; it is disabled by default.

### Account data controls

Signed-in users can export profile data and ships as JSON or CSV, and request account deletion from Settings. Deletion cancels an associated Stripe subscription before removing the Stripe customer, avatar files, and Supabase Auth account (related profile/log data cascade). Verify billing and retention requirements before enabling this workflow in production.

## Check the app

```bash
npm run typecheck
npm run build
```

The build and server-rendered public pages work without Supabase or Stripe credentials. Sign-in, account persistence, checkout, portal, reminders, and signed webhook delivery need real provider configuration for end-to-end testing.
