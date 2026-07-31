# @packages/icons

Cypress icon and image assets — application icons, favicons, and the Cypress logo — along with build scripts that produce browser-consumable and OS-native image files (SVG, PNG, ICO). Consumed by packages that need to embed Cypress branding in UI or in packaged binaries.

## Key Commands

```bash
# Build all icon assets (runs build-assets, cjs, and esm targets)
yarn workspace @packages/icons build

# Run a specific test file
yarn workspace @packages/icons test -- test/icons.spec.ts

# Run tests matching a glob pattern
yarn workspace @packages/icons test -- "test/**/*.spec.ts"
```

## Architecture

```
assets/
  cypress.iconset/   macOS iconset (multiple resolutions) for the Dock icon
  favicon/           Web favicon assets
  icons/             SVG and PNG source icons
  logo/              Cypress wordmark and logomark assets
scripts/
  build.ts           Converts SVGs/PNGs to browser-ready dist files (uses tsx)
  ico.ts             Converts PNGs to Windows .ico format (uses to-ico)
dist/               Compiled output: browser-ready icon files
index.ts            Public entry: exports resolved paths to each icon asset
index.d.ts          TypeScript declarations for the icon path exports
```

## Gotchas / Notes

- The `build-assets` step must complete before `build:cjs` / `build:esm` because the TypeScript sources reference files that are generated into `dist/` during the asset build.
- There is no `README.md` in this package — the `readme.md` file visible at the package root is the icons package's own readme (lowercase filename).
- Icons are published as resolved file paths (not inlined data URIs), so consumers receive the path and must serve or bundle the files themselves.

## Integration Points

- Consumed by **@packages/electron** for the application Dock/taskbar icon when packaging the binary.
- Consumed by **@packages/extension** for the browser extension icon and popup theme.
