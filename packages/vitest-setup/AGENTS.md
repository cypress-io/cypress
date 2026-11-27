# @packages/vitest-setup

Shared vitest setup for every workspace that runs vitest. Its `sanitize-env` global setup strips the inherited environment down to a short allowlist (`src/env-allowlist.ts`) before any worker starts, so a CI secret or a developer's own `CYPRESS_*`, `DEBUG` or proxy setting can neither show up in a failing assertion's diff nor change what the code under test does.

## Using it

Every `vitest.config.*` in the repo lists it, and `test/vitest-configs.spec.ts` fails if one doesn't:

```ts
test: {
  globalSetup: ['@packages/vitest-setup/sanitize-env'],
}
```

Add `"@packages/vitest-setup": "0.0.0-development"` to the workspace's `devDependencies`.

## Notes

- It runs in vitest's main process, so workers inherit the sanitized environment. Variables set in the config's `test.env`, `vi.stubEnv` and vitest's own worker variables (`VITEST`, `NODE_ENV`, and so on) are applied after it and are unaffected.
- A test that needs a variable sets it with `test.env` or `vi.stubEnv` rather than relying on the host. Add to the allowlist only what Node or the OS needs to start processes and find temp directories.
- The Windows entries are matched case-insensitively, since Windows variable names are.
