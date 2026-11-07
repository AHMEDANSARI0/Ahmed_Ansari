## Phase log

### Phase 1 — Foundation (complete)

Delivered and verified:

- Next.js 16.4 / React 19 / TypeScript strict / Tailwind 4 project, ESLint flat config, no `any`.
- 30 table Drizzle schema with enums, composite uniques, indexes and relations.
- Generated SQL migration (`drizzle/0000_init.sql`) applied to a real PostgreSQL 17 instance.
- Idempotent seed: roles, 12 permissions, 8 sections + content, 18 technologies, 6 skill categories, 26 skills, 4 projects, 8 services, experience, education, knowledge base.
- Auth: Argon2id hashing, opaque session tokens (HMAC-SHA256 stored), HttpOnly SameSite=Lax cookies, 12h expiry, revocation, throttling (6 failures / 15 min), network rate limiting.
- CSRF: signed double-submit token issued at the network boundary, verified in every mutating server action.
- Admin panel: login, dashboard (live counts), inquiries placeholder page, activity log, account, security (session revocation), general settings.
- Settings write path: Zod validated, audit logged, cache tags revalidated.
- Security headers, branded 404, error boundary, no public registration.
- Tests: 28 unit (Vitest) + 17 end-to-end (Playwright desktop and mobile) all passing.

Verification performed:

| Check | Result |
| --- | --- |
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm test` | 28 passed |
| `npm run build` | pass, 9 routes |
| `npx playwright test` | 17 passed |
| Migration on empty database | pass |
| Clean-directory patcher run + build | pass |

Recorded limitation:

- Next.js dev mode hydration does not complete inside this sandbox because the HMR websocket is blocked.
  The production build behaves correctly and every interactive test runs against `next start`.
  `npm run dev` on a normal machine is unaffected.

Known gaps for later phases (intentional):

- Public site is a foundation placeholder; the hero, sections and motion system arrive in phase 2.
- `/admin/inquiries` currently returns an empty state widget; the full CRM lands in phase 4.
- Media storage driver, AI assistant and analytics tables exist but have no UI yet.

### Phase 2 — Public site (complete)

Delivered and verified:

- Assembled homepage under `app/(site)`: hero, about, expertise, projects, services, stack, process, contact. Every section reads its copy, ordering, visibility and nav label from the `sections` table.
- Design system driven by settings: colors, triangle-grid background, animation toggles, portrait asset. Changing a setting in admin changes the rendered page.
- Motion: CSS scroll-driven reveals with a static fallback, GSAP hero timeline, magnetic CTAs, scroll progress rail, parallax and count-up primitives. All disabled under `prefers-reduced-motion`.
- Canvas triangle grid: DPR-capped, ResizeObserver driven, rAF paused when the tab is hidden, cursor highlight blended into the pattern.
- Contact pipeline: server action with Zod validation, honeypot, spam heuristics, per-network rate limiting, sanitisation, persistence in `contact_inquiries`, optional Resend notification.
- Case studies: `/work` index and `/work/[slug]` detail generated from the projects tables, with problem / architecture / implementation / outcome, capabilities, gallery and architecture diagram.
- SEO: per-route metadata, canonical URLs, OpenGraph image generated at the edge, Person and CreativeWork JSON-LD, `sitemap.xml`, `robots.txt` (admin and API disallowed).
- Migration `drizzle/0001_section_anchor.sql` aligns section anchors with the public hash contract.

Verification performed:

| Check | Result |
| --- | --- |
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm test` | 28 passed |
| `npm run build` | pass, 17 routes (4 case studies prerendered) |
| `npx playwright test` | 28 passed (desktop + mobile) |
| Inquiry written to PostgreSQL through the real form | pass |
| Lighthouse-critical layout on 390px viewport | no horizontal overflow |

### Phase 3 — Particle reconstruction and studios (complete)

Delivered and verified:

- Particle portrait engine: the uploaded photograph is sampled once into a luminance-weighted
  particle set, then animated on canvas from a scattered cloud into the silhouette. Colours come
  from the pixels; a configurable share is replaced by the accent colour. Separate desktop and
  mobile presets, device detection, DPR capped at 1.5, rAF paused on hidden tabs, assembly
  triggered on load, scroll or hover, and a static render under `prefers-reduced-motion`.
- Design studio: colour system, geometric pattern (type, size, opacity, thickness, cursor radius,
  highlight, drift), typography, layout and button tokens, with a live preview that uses the same
  canvas component and CSS variables as the public page.
- Animation studio: enable, duration, delay, intensity, easing, parallax, magnetic, hover, progress
  rail, mobile and reduced-motion fallback, plus a per-section reveal matrix and a preview that
  replays the real GSAP timeline.
- Portrait studio: source selection, trigger, particle mode, and full parameter control per device
  with a live canvas preview and particle budget readout.
- Section manager: reordering, visibility, nav visibility, anchor editing with collision detection,
  label/heading/description editing and structured content editing.
- Every studio writes through a guarded server action (session, permission, CSRF, Zod) and records
  an audit entry. Saving revalidates both the cache tag and the statically rendered routes.
- Design tokens now actually drive rendering: display font, heading weight and tracking, hero scale,
  section spacing, container width, corner cut and button tracking are consumed as CSS variables.

Verification performed:

| Check | Result |
| --- | --- |
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm test` | 36 passed |
| `npm run build` | pass, 21 routes |
| `npx playwright test` | 38 passed (desktop + mobile) |
| Studio change reaches the public page | verified for colour, motion, portrait and section visibility |

### Phase 4 — Projects, media library, analytics, SEO tools, backup (shipped)

Delivered:

- Project management: list with status/stage/featured badges, create and edit forms with live slug
  generation, validation, technology multi-select, gallery rows, per-project SEO overrides, draft /
  published / archived status, ordering and delete. Drafts are invisible on the public site; every
  write snapshots the record into `content_versions` and records an audit entry.
- Media library: drag-and-drop upload to the storage driver abstraction (local disk in development,
  Vercel Blob in production), magic-byte type verification against the declared MIME type, 8 MB
  ceiling, SHA-256 de-duplication that returns the existing asset instead of storing a second copy,
  dimension probing for JPEG/PNG/WebP/AVIF, alt text and caption editing, usage lookup and delete.
- Inquiries CRM: filterable queue with unread state, status pipeline (new, contacted, qualified,
  converted, archived), internal notes, mark-all-read, mailto reply and CSV export of the filtered set.
- Analytics: first-party page-view beacon with no cookies and no third-party script. Visitors are
  counted with a SHA-256 hash that rotates daily, so there is no durable identifier. The admin page
  renders totals, a daily trend, top pages, referrers and device split over 7/30/90 day windows.
- SEO tools: a live audit that reads the running configuration and published case studies and reports
  missing meta titles, missing descriptions, over-long snippets and missing cover images, with a link
  to the exact screen that fixes each one.
- Backup: JSON export of all content tables over an authenticated route, plus a snapshot log recording
  file name, size and per-table row counts.
- Cache correctness: publishing a draft now purges the case study route itself. A cached 404 from an
  earlier draft visit previously survived for the full ISR window.
- Navigation: Content (Projects, Media), Analytics, SEO and Backups entries, each hidden from roles
  without the matching permission.

Verification performed:

| Check | Result |
| --- | --- |
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm test` | 47 passed |
| `npm run build` | pass, 30 routes |
| `npx playwright test` | 47 passed (desktop + mobile) |
| Beacon to database | page views recorded, aggregated on the admin page |
| Draft publish round trip | 404 before publish, 200 after, listed on /work |

### Phase 5 — AI assistant, Automation Lab, hardening, deployment (next)
