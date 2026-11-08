#!/usr/bin/env bash
# One-shot gate: types, lint, unit tests, then a production build.
# A real PostgreSQL is required for anything database-backed; e2e needs one too.
set -euo pipefail

echo "→ typecheck"
npm run typecheck

echo "→ lint"
npm run lint

echo "→ unit tests"
npm test

echo "→ build"
npm run build

echo
echo "All gates passed."
echo "Next, against a built app:  npx next start -p 3100"
echo "Then:                       npx playwright test"
