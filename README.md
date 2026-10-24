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
3. Copy `.env.example` to `.env.local` and add your Supabase project URL and anon/publishable key.
4. Run `npm run dev` and open [http://localhost:3000](http://localhost:3000).

The dashboard uses realistic, seeded Alex Morgan demo data when Supabase is not configured. Demo entries are kept in this browser. The app never sends demo entries to a server. Visit `/welcome` for the product landing page; `/alex-morgan` is the sample public profile.

## Configure Supabase Auth and Postgres

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL Editor. It creates the profile/ship/subscription tables, RLS policies, and the public `avatars` storage bucket with per-user upload rules. If you already ran an earlier version of the schema, run this updated script again to add the new profile fields and avatar policies.
3. Add the project URL and anon/publishable key to `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Add the service role key to `SUPABASE_SERVICE_ROLE_KEY`. Keep this key server-only; never prefix it with `NEXT_PUBLIC_`.
5. In **Authentication → URL Configuration**, set the Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to the redirect allow-list. If you open the local app at `http://127.0.0.1:3000`, add `http://127.0.0.1:3000/auth/callback` as well. The app uses `NEXT_PUBLIC_APP_URL` as its canonical auth redirect origin, so keep it aligned with a URL in the allow-list. Add the production callback and set the production Site URL before launch.
6. Enable email in **Authentication → Providers**. Proof uses passwordless magic links; the first successful email sign-in automatically creates an account and public profile.
7. For GitHub, create a GitHub OAuth App. Set its callback URL to `https://<project-ref>.supabase.co/auth/v1/callback`, then paste the app's client ID and client secret into Supabase's GitHub provider settings.
8. For Google, create a Web OAuth client in Google Cloud. Add `https://<project-ref>.supabase.co/auth/v1/callback` as an authorized redirect URI, then paste the client ID and secret into Supabase's Google provider settings. Publish/configure the OAuth consent screen for the users you intend to allow.
9. Set `NEXT_PUBLIC_APP_URL` to the deployed origin before production use.

The GitHub and Google buttons work after the corresponding provider credentials and redirect URLs are configured. New social/email sign-ins create a profile automatically. People can personalize their display name, username, one-line intro, bio, location, website, and profile photo in Settings; profile photos accept JPG/PNG/WebP up to 5 MB. Email/OAuth routes require Supabase configuration. Authenticated profile and ship writes are owner-scoped by RLS; public profile and avatar reads are intentional.

## Configure Stripe

1. Create monthly ($8) and yearly ($60) recurring prices for Proof Pro.
2. Set `STRIPE_SECRET_KEY`, `STRIPE_PRO_MONTHLY_PRICE_ID`, and `STRIPE_PRO_YEARLY_PRICE_ID`.
3. Register a webhook to `https://<your-domain>/api/stripe/webhook` for `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`.
4. Set the endpoint's signing secret as `STRIPE_WEBHOOK_SECRET`.
5. Configure Stripe's customer portal to allow subscription updates and cancellation.

Checkout and the billing portal require an authenticated Supabase user. Webhook requests are verified against the raw request body. Pro state is synchronized only by the server-side Stripe webhook.

## Production notes

- Create a Vercel project from this folder and configure the same environment variables in each deployment environment.
- Set the Supabase project's site URL to your production origin and add production/local callback URLs to its redirect allow-list.
- The public share image is `/api/cards/<username>?format=landscape` (1200×630) or `?format=portrait` (1080×1350). Public profiles expose a canonical `/[username]` URL and an Open Graph image.
- Share cards use the included Proof theme by default. Pro accounts can select the mono/grid themes and remove Proof branding with the card controls.
- The Pro custom-domain field saves the requested host. Pointing DNS, domain ownership verification, TLS provisioning, and custom-host routing must also be configured at the hosting provider before directing production users to it.
- The Proof Tree grows category-colored leaves from the shipping log and appears on the dashboard and public profile. Pro adds a monthly canopy report with month-over-month growth, strongest work lane, and next milestone alongside 30, 90, and 365-day shipping analytics, builder XP, levels, and milestone badges. Analytics do not track profile visitors.
- Demo data is generated for the preview and not written to Supabase. A signed-in account starts with its own database-backed log.

## Check the app

```bash
npm run typecheck
npm run build
```

The build and server-rendered public pages work without Supabase or Stripe credentials. Sign-in, account persistence, checkout, portal, and signed webhook delivery need real provider configuration for end-to-end testing.

## Five improvements to make next

1. Verify custom-domain ownership and automate DNS, TLS, and host routing.
2. Add profile-visit and share-card impression analytics with privacy-conscious opt-in.
3. Add account export, deletion, and data-retention controls.
4. Add integration tests for auth, daily ship upserts, streak boundaries, and Stripe webhook events.
5. Add configurable reminders and timezone-aware daily ship cutoffs.
