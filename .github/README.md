# GitHub Actions

The CI workflow could not be committed from the agent session: the GitHub App used for
pushing is not granted the `workflows` permission.

It is reproduced below. Save it as `.github/workflows/ci.yml` and commit it from a machine
where you own the repository credentials — GitHub will then run it on every push.

```yaml
name: CI

on:
  push:
    branches: ["main", "arena/**"]
  pull_request:
    branches: ["main"]

permissions:
  contents: read

jobs:
  quality:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Typecheck
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Unit tests
        run: npm test

      # The build compiles every route with no database present, which is also the
      # fallback path a fresh clone exercises.
      - name: Build
        run: npm run build
```
