# @packages/extension

The WebExtension loaded by Chrome and Firefox during Cypress test runs. It automates the browser at the extension level — handling new-tab interception and communicating back to the Cypress server via `socket.io`. Supports both Manifest V2 (`app/v2/`) and Manifest V3 (`app/v3/`).

## Key Commands

```bash
# Build both V2 and V3 extension bundles
yarn workspace @packages/extension build

# Run a specific test file
yarn workspace @packages/extension test -- <path-to-spec>

# Run tests matching a glob pattern
yarn workspace @packages/extension test -- "<glob-pattern>"

# Type-check
yarn workspace @packages/extension check-ts
```

## Architecture

```
app/
  v2/
    background.ts       MV2 background page: socket connection, tab management
    client.ts           Content script injected into pages
    init.ts             Extension initialisation logic
    manifest.json       MV2 manifest
  v3/
    content.ts          Content script for MV3
    service-worker.ts   MV3 service worker replacing the background page
    manifest.json       MV3 manifest
  newtab.html / popup.html   Extension UI pages
lib-dist/              Compiled TypeScript library code (published)
app-dist/              Compiled extension bundles (published)
theme/                 Extension icon and popup theme assets
```

## Gotchas / Notes

- Like `@packages/electron`, this package requires `yarn build` after install — the `postinstall` script only prints a reminder.
- The V2 bundle is produced by `webpack-cli` and the V3 bundle by `tsc` directly; the main `build` gulp task orchestrates both.
- The `nx.implicitDependencies` declares `@packages/server` and `@packages/socket` — changes to either of those trigger a rebuild of the extension in CI.

## Integration Points

- Depends on **@packages/socket** at runtime for browser↔server communication.
- Depends on **@packages/icons** for extension icon assets.
- Consumed by **@packages/server** which injects the built extension into browser launch arguments.
