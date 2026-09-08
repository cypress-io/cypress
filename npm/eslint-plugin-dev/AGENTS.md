# @cypress/eslint-plugin-dev

`@cypress/eslint-plugin-dev` is a published npm package providing shared ESLint rules and configurations used internally across Cypress development packages. It is intended exclusively for use within the Cypress monorepo and its internal tooling — it is not the user-facing Cypress ESLint plugin (which lives in a separate `eslint-plugin-cypress` repository).

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
- The custom rules exist because stock ESLint has no equivalent. `arrow-body-multiline-braces` wraps `arrow-body-style` to report only on multiline arrows, and `skip-comment` requires an explanation on `.skip` rather than banning it the way `mocha/no-pending-tests` does. Exclusive tests are covered by `mocha/no-exclusive-tests`, so there is no custom rule for them.
- Peer dependencies cover ESLint 8.x only (`eslint: "^= 8.0.0"`); not compatible with ESLint 9 flat config in its consumer role.
