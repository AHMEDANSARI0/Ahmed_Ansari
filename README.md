# Ahmed Ansari — portfolio

A server-rendered portfolio with a private admin panel, a Postgres content model, and a
deliberately small client bundle. The public site reads every section, colour, animation
setting and project record from the database, so nothing on screen is hardcoded in JSX.

- **Live:** https://ahmedansari.vercel.app
- **Owner:** Ahmed Ansari — AI automation engineer, Karachi
- **Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind 4 ·
  Drizzle ORM · PostgreSQL (Neon) · GSAP · Vitest · Playwright

---

## 1. What is inside

### Public surface

| Route | What it does |
| --- | --- |
| `/` | Hero, about (+ education timeline), expertise, selected work, services, stack, process, contact |
| `/work` | Filterable case-study archive: stage and stack facets are built from the projects that exist |
| `/work/[slug]` | Case study: problem, architecture, implementation, outcome, capabilities, gallery with a keyboard lightbox |
| `/api/health` | Deployment probe. Returns 200 only when the database answers |
| `/api/analytics` | First-party page-view beacon: no cookies, no third-party script, no stored IP |

### Admin panel (`/admin`)

Login is the only public admin route. Everything else is gated by the proxy and by a
permission check inside each server action.

- **Dashboard** — live counts, recent inquiries, recent activity
- **Inquiries** — status pipeline, notes, mark-all-read, CSV export
- **Analytics** — 7/30/90-day views, daily trend, pages, referrers, devices, owner-traffic exclusion
- **Projects** — create/edit/delete, drafts, SEO overrides, gallery rows, technology selection
- **Media** — upload with magic-byte verification, SHA-256 de-duplication, alt text, usage lookup
- **Education** — institution, programme, years, visibility, ordering; renders as a timeline in About
- **Studios** — Sections, Design, Animation, Portrait: live CSS-variable and canvas previews
- **System** — account, security (session revocation), settings, SEO audit, backups, audit log

### Data

33 tables in `lib/db/schema.ts`, applied through SQL files in `drizzle/`.
Content is cached for 5 minutes and purged by tag + path on every save.

---

## 2. Run it locally

```bash
# 1. install
npm install

# 2. environment
cp .env.example .env.local        # then fill DATABASE_URL and SESSION_SECRET

# 3. database (any Postgres 15+; Neon works)
npm run db:migrate                # applies drizzle/*.sql in journal order
npm run db:seed                   # idempotent content seed

# 4. an admin account
npm run admin:create              # interactive

# 5. dev server
npm run dev                       # http://localhost:3000
```

No database? The public site still renders with the static defaults in `lib/config/*`
instead of crashing — but the admin panel needs a real connection to do anything.

### Embedded database for development

```bash
npm run db:dev                    # PGlite on :55432
```

PGlite is **single-connection**. Playwright workers drop sockets against it, so end-to-end
runs need a real PostgreSQL. Use the embedded one for `npm run dev` only.

---

## 3. Quality gates

```bash
npm run verify        # everything below, in order
npm run typecheck     # tsc --noEmit, strict + noUncheckedIndexedAccess
npm run lint          # eslint, flat config, no `any`
npm test              # vitest: 85 tests, 10 files
npm run build         # production build, 30 routes
npm run test:e2e      # playwright (needs a built app + a real Postgres)
```

Two sandbox notes that cost time to rediscover:

- `next build` fetches Google Fonts at compile time. On a machine without outbound access the
  build fails on `next/font`; that is a network problem, not a code problem.
- The public pages are prerendered with a 5-minute revalidate. **Seed before you build**, or
  the first build bakes in the empty state and keeps serving it until revalidation.

A CI workflow for typecheck, lint, unit tests and the build is in `.github/README.md`; copy it to
`.github/workflows/ci.yml` and commit it once (see why it is not there already).
End-to-end tests are intentionally not in CI: they need a database and are run locally.

---

## 4. Deploying

1. Push this repository; Vercel builds with `npm run build`.
2. Set `DATABASE_URL` and `SESSION_SECRET` in the project environment.
3. Run `npm run db:migrate` once against the production database.
4. Run `npm run admin:create` against it.
5. `curl -i https://<domain>/api/health` → expect `200` with `"database": "reachable"`.

The canonical domain lives in the `site_settings` row (key `global`), not in code, so it can
be changed from `/admin/settings` without a redeploy. `lib/config/site.ts` only supplies the
defaults used when the database is absent.

---

## 5. Security notes

- Argon2id password hashing, opaque session tokens stored as HMAC-SHA256 digests, HttpOnly
  `SameSite=Lax` cookies, 12-hour expiry, per-session revocation.
- Login throttling (6 failures / 15 minutes) and network-level rate limiting.
- Signed double-submit CSRF token: issued by `proxy.ts`, verified inside every mutating action.
- Zod validation plus sanitisation on every write; the contact form adds a honeypot and spam
  heuristics.
- Every admin write is recorded in `audit_logs`.
- Analytics stores a truncated hash that rotates daily. A random browser id in local storage
  lets the owner exclude their own visits; it never leaves first-party requests.

---

## 6. Repo layout

```
app/(site)/          public routes, sitemap, robots, OG image
app/admin/           login + panel (19 pages)
app/api/             analytics beacon, health, admin media/backup routes
components/          sections, motion, background, admin, work, ui
lib/                 config, db, services, actions, validations, security, analytics
drizzle/             SQL migrations + journal
scripts/             migrate, seed, create-admin, dev-db
tests/               unit (vitest) + e2e (playwright)
```

---

## 7. Known gaps

- Project screenshots: `npm run shots:capture` (needs `npx playwright install chromium`) captures a
  cover from each live demo into `public/shots/`. Upload them in `/admin/media` and set them as
  covers in `/admin/projects`. Until then the gallery shows a small technical band, never a stock
  image.
- The CV is intentionally absent (`cv.enabled = false`).
- Owner-traffic exclusion is per browser: a new device has to be excluded once.
- Section reveals use CSS scroll-driven animations where supported and degrade to a static
  render everywhere else (Safari and Firefox today).
