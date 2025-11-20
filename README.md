# gginvoice

Invoice management SaaS starter built with Next.js 14, TypeScript, Prisma, tRPC, and NextAuth (Google OAuth).

## At a Glance

- Next.js App Router + pnpm
- PostgreSQL via Prisma ORM
- Auth with NextAuth.js + Google OAuth
- UI powered by Tailwind CSS and shadcn/ui

## Prerequisites (macOS)

- **Docker Desktop** (provides Docker Engine + Compose)
  ```bash
  brew install --cask docker
  ```
  Launch Docker Desktop once to finish installation and ensure the engine is running.
- **Node.js 18+ & Corepack (pnpm)**
  ```bash
  brew install node@20
  corepack enable
  corepack prepare pnpm@latest --activate
  ```
- **OpenSSL** (used for generating secure secrets)
  ```bash
  brew install openssl
  ```

## First-Time Setup

1. **Clone & install dependencies**
   ```bash
   git clone <repo-url>
   cd gginvoice
   pnpm install
   ```
2. **Create environment file**
   ```bash
   cp .env.example .env.local
   ```
   - Add Google OAuth and Stripe credentials (see sections below).
3. **Start PostgreSQL via Docker Compose**
   ```bash
   docker compose up -d postgres
   ```
4. **Apply database migrations**
   ```bash
   pnpm prisma migrate dev
   ```
5. **Start the app**
   ```bash
   pnpm dev
   ```
   Visit `http://localhost:3000` and authenticate with Google.

## Daily Workflow

```bash
docker compose up -d postgres  # ensure Postgres container is running
pnpm install                   # sync new dependencies
pnpm prisma migrate dev        # sync schema changes
pnpm dev                       # launch Next.js
```

Stop services with `ctrl+c` for Next.js and `docker compose down` to stop the database container.

## Environment Variables

Essentials for `.env.local`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/gginvoice"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
STRIPE_PUBLISHABLE_KEY="pk_live_or_test_key"
STRIPE_SECRET_KEY="sk_live_or_test_key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
```

Add PostHog to capture anonymous and authenticated journeys:

```
NEXT_PUBLIC_POSTHOG_API_KEY="phc_project_api_key"
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
```

## Analytics (PostHog)

- After setting the PostHog environment variables above, the bundled `PosthogProvider` (already wrapped inside `AuthSessionProvider`) initializes PostHog on the client.
- It automatically identifies authenticated users using their NextAuth user ID and captures `$pageview` events for navigation.

## Google OAuth Credentials

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project (or reuse an existing one).
3. Enable the **Google Identity Services** API.
4. Navigate to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
5. Choose **Web application** and add the following authorized URIs:
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
6. Copy the **Client ID** and **Client Secret** into `.env.local`.

## Stripe Credentials (latest Stripe dashboard)

1. Log in to the [Stripe Dashboard](https://dashboard.stripe.com/).
2. Switch to the desired mode (Test or Live).
3. Go to **Developers → API keys** and create a **restricted key** or use the default.
   - Publishable key → `STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`
4. For webhooks:
   - Install the Stripe CLI: `brew install stripe/stripe-cli/stripe`
   - Authenticate: `stripe login`
   - Forward events locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   - Copy the generated signing secret to `STRIPE_WEBHOOK_SECRET`.

## Helpful Commands

- `pnpm build` – production build
- `pnpm start` – run the compiled build
- `pnpm lint` – run ESLint
- `pnpm prisma studio` – open the Prisma data browser
- `pnpm prisma migrate reset` – reset database and reapply migrations (local only)

## Project Structure

```
src/
├── app/             # routes and API handlers
├── components/      # shared UI + layout pieces
├── server/          # tRPC routers and server utilities
├── lib/             # auth, db, and helpers
└── prisma/          # schema and migrations
```

## Deployment Checklist

1. Provision a managed PostgreSQL instance and set `DATABASE_URL` accordingly.
2. Configure Google OAuth and Stripe callbacks with your production domain.
3. Set environment variables in your hosting platform (e.g. Vercel).
4. Run `pnpm prisma migrate deploy` followed by `pnpm build` and `pnpm start` (or let your platform handle these steps).

Licensed under MIT.