# [@[secure]/vite-plugin-[secure]-esm-v2.0.1](https://github.com/[secure]-io/[secure]/compare/@[secure]/vite-plugin-[secure]-esm-v2.0.0...@[secure]/vite-plugin-[secure]-esm-v2.0.1) (2026-11-17)


### chore

* upgrade to ESLint 10 ([#35373](https://github.com/[secure]-io/[secure]/issues/35373)) ([9b05013](https://github.com/[secure]-io/[secure]/commit/9b05013f2831ec70563b8864710640622a741992))


### BREAKING CHANGES

* is the ESLint 10 minimum; its `recommended` config is
unchanged.

ESLint 10 no longer depends on `@eslint/js`, so the exact pin that kept
the two in lockstep is replaced by a range on the same major.

`eslint-plugin-react` stays at 7.37.5. It declares no ESLint 10 support,
but its recommended rules run on it as long as `settings.react.version`
stays explicit: `'detect'` calls `context.getFilename()`, which ESLint 10
removed. `baseConfig.ts` says so next to the setting, and AGENTS.md
records the expected peer warning and the rules that must stay off.

`yarn lint` reports no new errors: U2 and U3 already cleared the
`eslint-env` comments and the new recommended rules.

AGENTS.md: update the peer version, the `eslint` range in "Adding a
workspace", and the `@eslint/js` and `no-restricted-imports` pin notes.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01WUv8r3qigEUVN4dpuXzbys

* chore: drop rules ESLint 10's recommended now enables and refresh ESLint 9 docs

`@eslint/js` 10 turns on `no-useless-assignment` and `no-unassigned-vars`
in `recommended`, so `baseConfig` no longer sets them itself. Both still
resolve to `error`.

Update the docs that still described ESLint 9: the `.vscode` comment on
`eslint.workingDirectories` (ESLint 10 finds config per file; the setting
still matters because the extension loads ESLint from the working
directory), the example package guide, the eslint-config README, and the
jsonc pin note, whose ESLint 9.38 requirement is now met.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01WUv8r3qigEUVN4dpuXzbys

# [@[secure]/vite-plugin-[secure]-esm-v2.0.0](https://github.com/[secure]-io/[secure]/compare/@[secure]/vite-plugin-[secure]-esm-v1.1.2...@[secure]/vite-plugin-[secure]-esm-v2.0.0) (2026-08-26)


### breaking

* release version 2.0.0 of @[secure]/vite-plugin-[secure]-esm ([cdff502](https://github.com/[secure]-io/[secure]/commit/cdff5029e4f580d9b994053cb8117879039d608a))


### BREAKING CHANGES

* Make @[secure]/vite-plugin-[secure]-esm an ESM only module

# [@cypress/vite-plugin-cypress-esm-v1.1.2](https://github.com/cypress-io/cypress/compare/@cypress/vite-plugin-cypress-esm-v1.1.1...@cypress/vite-plugin-cypress-esm-v1.1.2) (2024-12-03)


### Bug Fixes

* support multiple imports of one module with multiple lines ([#30314](https://github.com/cypress-io/cypress/issues/30314)) ([12df40e](https://github.com/cypress-io/cypress/commit/12df40ed8c1101c5c4053a1fe63c06fcd2809bc7))

# [@cypress/vite-plugin-cypress-esm-v1.1.1](https://github.com/cypress-io/cypress/compare/@cypress/vite-plugin-cypress-esm-v1.1.0...@cypress/vite-plugin-cypress-esm-v1.1.1) (2024-05-10)


### Bug Fixes

* Some fixes and improvements to vite-plugin-cypress-esm ([#29368](https://github.com/cypress-io/cypress/issues/29368)) ([cf88556](https://github.com/cypress-io/cypress/commit/cf88556d4493128a1a031861448285be1e714818))

# [@cypress/vite-plugin-cypress-esm-v1.1.0](https://github.com/cypress-io/cypress/compare/@cypress/vite-plugin-cypress-esm-v1.0.1...@cypress/vite-plugin-cypress-esm-v1.1.0) (2023-08-07)


### Features

* Improve ignore capability to allow module & import matching ([#27461](https://github.com/cypress-io/cypress/issues/27461)) ([1f60dea](https://github.com/cypress-io/cypress/commit/1f60dea61c2c3dd1260f57db631975a1933c266d))

# [@cypress/vite-plugin-cypress-esm-v1.0.1](https://github.com/cypress-io/cypress/compare/@cypress/vite-plugin-cypress-esm-v1.0.0...@cypress/vite-plugin-cypress-esm-v1.0.1) (2023-05-23)


### Bug Fixes

* Vite esm plugin issues ([#26714](https://github.com/cypress-io/cypress/issues/26714)) ([38b9526](https://github.com/cypress-io/cypress/commit/38b952622e034928df0d6e5d571e83c22d98ce86))

# @cypress/vite-plugin-cypress-esm-v1.0.0 (2023-05-04)


### Features

* initial release of cypress/vite-plugin-cypress-esm ([#26663](https://github.com/cypress-io/cypress/issues/26663)) ([42d4f83](https://github.com/cypress-io/cypress/commit/42d4f836cf30069a152cb45ac49af736155e7cc1))
