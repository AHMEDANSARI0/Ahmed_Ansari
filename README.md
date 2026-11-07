# Ahmed Ansari — AI Automation Engineer Portfolio

Production application: public portfolio plus an owner-controlled CMS.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16.4 (App Router, Turbopack), React 19, TypeScript strict |
| Styling | Tailwind CSS 4, design tokens in `app/globals.css` |
| Data | Neon PostgreSQL, Drizzle ORM + versioned SQL migrations |
| Auth | Argon2id (`@node-rs/argon2`), DB-backed sessions, HttpOnly cookies |
| Validation | Zod schemas shared between server actions and forms |
| Storage | Driver abstraction: local filesystem (dev) / Vercel Blob (prod) |
| Tests | Vitest (unit), Playwright (e2e, desktop + mobile) |

## Requirements

- Node.js 20.9 or newer
- A Neon PostgreSQL database (free tier is enough)

## Local setup

```bash
npm install

cp .env.example .env.local
# fill DATABASE_URL and DATABASE_URL_DIRECT
# set SESSION_SECRET to the output of: openssl rand -base64 48

npm run db:migrate      # applies drizzle/ migrations
npm run db:seed         # reference content: sections, projects, services, roles
npm run admin:create    # provisions the owner account (prompts for email + password)

npm run dev
```

Public site: `http://localhost:3000`
Admin: `http://localhost:3000/admin`

### Optional: fully local database

If you do not want to touch Neon while developing:

```bash
npm run db:dev          # embedded PostgreSQL (PGlite) on port 55432
```

Then point `DATABASE_URL` and `DATABASE_URL_DIRECT` at
`postgresql://postgres@127.0.0.1:55432/postgres` and run the migration and seed commands.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (flat config, Next core web vitals + TS rules) |
| `npm run typecheck` | `tsc --noEmit` with strict mode |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Build + Playwright suite (desktop and mobile projects) |
| `npm run db:generate` | Generate a migration from schema changes |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed reference content (idempotent) |
| `npm run db:studio` | Drizzle Studio |
| `npm run admin:create` | Create or reset the owner account |

## Project layout

```
app/
  (public pages live at the root)
  admin/
    login/            public sign-in route
    (panel)/          authenticated shell: dashboard, inquiries, activity, account, security, settings
  api/                route handlers (added per phase)
components/
  admin/              shell, sidebar, page primitives, auth affordances
  ui/                 button, field, badge, toast
lib/
  actions/            server actions, one module per domain
  auth/               password hashing, sessions, guards
  config/             typed configuration objects and Zod schemas
  db/                 schema, connection, migrations target
  permissions/        role to permission mapping
  security/           csrf, rate limiting, action guards
  services/           read models used by server components
  validations/        shared Zod schemas
drizzle/              generated SQL migrations
scripts/              migrate, seed, admin provisioning, local database
tests/                unit and e2e suites
proxy.ts              network boundary: admin route protection
```

## Security model

- No public registration route exists. The owner account is created from the CLI only.
- Passwords are hashed with Argon2id (19 MiB, 2 iterations, parallelism 1).
- Sessions are opaque 32 byte tokens; only a SHA-256 HMAC of the token is stored.
- Session cookies: `HttpOnly`, `SameSite=Lax`, `Secure` in production, 12 hour lifetime.
- Every mutating server action requires a signed CSRF token (cookie + form field or header).
- Login throttling: six failures per identifier inside 15 minutes blocks further attempts.
  Network level limiting runs separately on a sliding bucket table.
- Authorization is enforced server side on every action (`requireActionContext`) and every page.
- Uploaded files are validated on the server in the media module (phase 4).
- Errors surface generic messages; details are logged server side only.
- Security headers are set in `next.config.ts`; secrets never reach client bundles.

## Deployment (Vercel + Neon)

1. Push the repository to GitHub.
2. Create a Neon project, copy the pooled and direct connection strings.
3. Import the repository in Vercel, framework preset Next.js.
4. Add environment variables in Vercel:
   `DATABASE_URL`, `DATABASE_URL_DIRECT`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`,
   `STORAGE_DRIVER=blob`, `BLOB_READ_WRITE_TOKEN` (if using Vercel Blob),
   and the optional `AI_*` variables.
5. Run migrations and seed once from a trusted machine pointing at the production database:
   ```bash
   npm run db:migrate
   npm run db:seed
   npm run admin:create
   ```
6. Deploy.

Notes:

- `DATABASE_URL` must be the pooled endpoint so serverless invocations reuse connections.
- `SESSION_SECRET` must be identical across deployments; changing it invalidates sessions.
- The serverless filesystem is ephemeral, so `STORAGE_DRIVER=local` is development only.

## Optional services and free tier limits

| Service | Purpose | Free tier notes |
| --- | --- | --- |
| Neon | PostgreSQL | Storage and compute hour limits; scales to zero when idle |
| Vercel Blob | Media storage | Small storage and bandwidth allowance |
| OpenAI compatible API | Portfolio assistant | Paid per token; the assistant stays disabled when unset |
| Resend | Inquiry notification email | 100 emails per day |

Every optional integration fails gracefully when its credentials are absent.

## Phase status

| Phase | Scope | State |
| --- | --- | --- |
| 1 | Foundation: schema, migrations, seed, auth, admin shell, settings, tests | Complete |
| 2 | Public site: hero, sections, project pages, contact, SEO, pattern, motion | Planned |
| 3 | Particle portrait engine, design and animation studios, section manager | Planned |
| 4 | Project manager, media library, lead CRM, analytics, SEO manager, backup | Planned |
| 5 | AI assistant, automation lab, hardening, performance, deployment docs | Planned |

## Test coverage

```bash
npm test          # 22 unit tests: csrf, password policy, schemas, permissions, config
npm run test:e2e  # authentication, authorization, settings persistence, public pages, mobile
```
