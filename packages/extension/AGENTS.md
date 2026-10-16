# @packages/extension

The WebExtension loaded by Chrome and Firefox during Cypress test runs. It automates the browser at the extension level, reaching APIs that CDP and BiDi don't cover.

The two bundles are not two builds of the same thing — each is loaded by exactly one browser and does a different job:

- **`app/v2/` (Manifest V2) — Firefox only**, loaded via `utils.writeExtension` from `@packages/server`'s `firefox.ts`. Connects back to the Cypress server over `socket.io`, pushes cookie and download events, and handles `reset:browser:state` (which BiDi deliberately delegates here).
- **`app/v3/` (Manifest V3) — Chrome only**, loaded via `getPathToV3Extension` from `@packages/server`'s `chrome.ts`. Tracks the main Cypress tab's URL and re-activates that tab, used by `@cypress/puppeteer`. No socket connection.

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
  v2/                   Firefox
    background.ts       MV2 background page: cookie/download events, reset:browser:state
    client.ts           socket.io connection wrapper used by the background page
    init.ts             Connects the background page to the server on load
    manifest.json       MV2 manifest
  v3/                   Chrome
    content.ts          Content script bridging the Cypress page and the service worker
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
