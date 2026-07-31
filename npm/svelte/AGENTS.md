# @cypress/svelte

`@cypress/svelte` is a published npm package that provides the `mount` function for mounting Svelte 5+ components inside the Cypress test runner for component testing. It is bundled with the `cypress` binary and does not typically need to be installed separately by end users.

## Key Commands

```sh
yarn build        # rimraf dist + rollup; also syncs to cli/svelte
yarn check-ts     # TypeScript type-check without emitting
yarn lint         # ESLint
```

## Architecture

- `src/index.ts` — public entry point
- `src/mount.ts` — core Svelte component mounting logic

## Gotchas / Notes

- Requires Svelte 5+. Cypress 13 and earlier supported Svelte 4 and below.
- The `postbuild` step syncs `dist/` to `cli/svelte/` — build before testing against the Cypress binary.
- There is no `test` script in this package's `package.json`; component tests are run via Cypress directly.
- Marked with `"!cypress"` as an Nx implicit dependency to avoid circular build ordering issues.

## Integration Points

- Depends on `@cypress/mount-utils` (sibling package) for shared adapter utilities.
