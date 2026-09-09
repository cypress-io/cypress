# @cypress/eslint-plugin-dev

`@cypress/eslint-plugin-dev` is a private, unpublished package providing the shared eslintrc presets that the monorepo packages still on ESLint 8 lint against. It is not the user-facing Cypress ESLint plugin (which lives in a separate `eslint-plugin-cypress` repository).

It is on its way out. `@packages/eslint-config` is the ESLint 9 flat config that every package is migrating to, and this package is deleted once nothing references it. Do not add rules here — add them there.

## Key Commands

```sh
yarn lint           # ESLint on this package itself
yarn lint-fix       # ESLint with --fix
yarn test -- <path-to-spec>                     # run a specific vitest spec file
yarn test -- "<glob-pattern>"                   # run vitest specs matching a glob
```

## Architecture

- `lib/index.js` — main entry point; exports the ESLint plugin (rules and configs)
- `lib/custom-rules/` — custom ESLint rules authored for Cypress internals

## Gotchas / Notes

- This is an internal development tool only. Do not recommend it to Cypress end users; they should use `eslint-plugin-cypress` instead.
- The two custom rules are mirrored in `@packages/eslint-config` under the same `@cypress/dev` namespace, so packages get identical behavior whichever config they are on. A change to one belongs in both until this package is gone.
- The custom rules exist because stock ESLint has no equivalent. `arrow-body-multiline-braces` wraps `arrow-body-style` to report only on multiline arrows, and `skip-comment` requires an explanation on `.skip` rather than banning it the way `mocha/no-pending-tests` does. Exclusive tests are covered by `mocha/no-exclusive-tests`, so there is no custom rule for them.
- The flat-config copy of `arrow-body-multiline-braces` cannot share this one's implementation: it reaches the built-in rule through `Linter#getRules()`, which throws under flat config.
- Peer dependencies cover ESLint 8.x only (`eslint: "^= 8.0.0"`); not compatible with ESLint 9 flat config in its consumer role.
