# Cloud URLs

The map of Cypress Cloud base URLs per environment, and the helpers that resolve which environment a process should talk to.

## Overview

Several parts of the monorepo need to know where Cypress Cloud lives: the server's GraphQL layer (`@packages/data-context`), the schema-fetching gulp tasks, and the published `cypress` CLI. This package is the single source of truth for those URLs so the endpoints cannot drift between the server and the CLI bundle.

It has no runtime dependencies, so it inlines cleanly into the published CLI via rollup.

## API Reference

### CLOUD_URLS

The environment → base URL map.

```typescript
import { CLOUD_URLS, CloudEnv } from '@packages/cloud-urls'

CLOUD_URLS.production // 'https://cloud.cypress.io'
```

### resolveCloudEnv

Resolves which Cloud environment the app should target, from `CYPRESS_INTERNAL_CLOUD_ENV` or `CYPRESS_INTERNAL_ENV`, defaulting to `development` (a local Cloud at `localhost:3000`).

```typescript
import { resolveCloudEnv } from '@packages/cloud-urls'

resolveCloudEnv() // reads process.env
resolveCloudEnv({ CYPRESS_INTERNAL_ENV: 'staging' }) // 'staging'
```

### eventCollectorEnv / eventCollectorUrl

Resolve the environment and endpoint for the event collector. These default to `production` — real users have no `CYPRESS_INTERNAL_*` vars set, and their events must land on the real collector. `CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV` overrides the target; values that don't name a Cloud environment are ignored.

```typescript
import { eventCollectorUrl } from '@packages/cloud-urls'

eventCollectorUrl() // 'https://cloud.cypress.io/anon-collect'
eventCollectorUrl(true) // 'https://cloud.cypress.io/machine-collect'
```

## Testing

```bash
yarn workspace @packages/cloud-urls test -- run
```
