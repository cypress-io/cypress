This package is the single source of truth for Cypress Cloud base URLs per environment and the helpers that resolve which environment a process targets. It is consumed by `@packages/data-context`, the gulp GraphQL tasks, and the published `cypress` CLI, which inlines it via rollup.

**Key Commands**

```bash
# Build TypeScript to dist/
yarn workspace @packages/cloud-urls build

# Run the tests once
yarn workspace @packages/cloud-urls test -- run
```

**Architecture**

- `lib/index.ts` — `CLOUD_URLS` map, `CloudEnv` type, `resolveCloudEnv()`, `eventCollectorEnv()`, `eventCollectorUrl()`

**Gotchas / Notes**

- This package must stay free of runtime dependencies: the published CLI bundles it with rollup, and any npm dependency here would have to ship as a real dependency of the `cypress` package.
- `resolveCloudEnv` defaults to `development` (the app's dev-mode Cloud at `localhost:3000`); the event collector helpers default to `production` because real users run with no `CYPRESS_INTERNAL_*` vars set and their events must reach the real collector. The differing defaults are intentional.
- Consumers import compiled `dist/` output. After editing `lib/`, rebuild before running dependent packages.
