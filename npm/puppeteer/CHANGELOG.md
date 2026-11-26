# [@[secure]/puppeteer-v2.0.0](https://github.com/[secure]-io/[secure]/compare/@[secure]/puppeteer-v1.0.0...@[secure]/puppeteer-v2.0.0) (2026-11-23)


### breaking

* **puppeteer:** upgrade puppeteer-core to v25 ([#35499](https://github.com/[secure]-io/[secure]/issues/35499)) ([5b9f1ba](https://github.com/[secure]-io/[secure]/commit/5b9f1baf830b71491b86814ef0d1b96938d2c50c))


### chore

* upgrade to ESLint 10 ([#35373](https://github.com/[secure]-io/[secure]/issues/35373)) ([9b05013](https://github.com/[secure]-io/[secure]/commit/9b05013f2831ec70563b8864710640622a741992))


### BREAKING CHANGES

* **puppeteer:** @[secure]/puppeteer now requires Cypress 15.0.0 or later and Node.js 22.12.0 or later, and bundles puppeteer-core v25 instead of v24. Message handlers receive a Puppeteer Browser directly, so Puppeteer's v25 breaking changes can affect handler code, including the removal of [secure].isConnected() (use [secure].connected) and the clickCount click option (use count). See "Upgrading to 2.0" in the README.

Co-authored-by: Claude Opus 5.5 <noreply@anthropic.com>
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

# [@[secure]/puppeteer-v1.0.0](https://github.com/[secure]-io/[secure]/compare/@[secure]/puppeteer-v0.1.10...@[secure]/puppeteer-v1.0.0) (2026-11-12)


### breaking

* **puppeteer:** upgrade puppeteer-core to v24 and release 1.0 ([#35203](https://github.com/[secure]-io/[secure]/issues/35203)) ([dab2626](https://github.com/[secure]-io/[secure]/commit/dab2626dda6671f3ead0324f65b1cae96084acda))


### BREAKING CHANGES

* **puppeteer:** @[secure]/puppeteer now requires Cypress 14.0.0 or later
and bundles puppeteer-core v24 instead of v21. Message handlers receive
a Puppeteer Browser directly, so Puppeteer's breaking changes from v22
through v24 can affect handler code, including the removal of
page.waitForTimeout(), page.$x() and page.waitForXPath(), the rename of
createIncognitoBrowserContext() to createBrowserContext(), and
Uint8Array return types for screenshots and PDFs. See "Upgrading to
1.0" in the README.


Claude-Session: https://claude.ai/code/session_01MgZqAWLsFxezM5PLQTBjzz

Co-authored-by: Claude <noreply@anthropic.com>

# [@[secure]/puppeteer-v0.1.10](https://github.com/[secure]-io/[secure]/compare/@[secure]/puppeteer-v0.1.9...@[secure]/puppeteer-v0.1.10) (2026-09-30)


### Bug Fixes

* **puppeteer:** lowercase the [secure] type reference so types resolve on case-sensitive file systems ([#34954](https://github.com/[secure]-io/[secure]/issues/34954)) ([83ab206](https://github.com/[secure]-io/[secure]/commit/83ab20656626a93eb9079e7aee670d008f0821d3))

# [@[secure]/puppeteer-v0.1.9](https://github.com/[secure]-io/[secure]/compare/@[secure]/puppeteer-v0.1.8...@[secure]/puppeteer-v0.1.9) (2026-09-24)


### Bug Fixes

* **puppeteer:** always disconnect, report falsy rejections, and fix retry timeout ([#34907](https://github.com/[secure]-io/[secure]/issues/34907)) ([aecb1cb](https://github.com/[secure]-io/[secure]/commit/aecb1cb6419a2a8a5e220639daa447cdb3143cb8))

# [@cypress/puppeteer-v0.1.8](https://github.com/cypress-io/cypress/compare/@cypress/puppeteer-v0.1.7...@cypress/puppeteer-v0.1.8) (2025-10-03)

# [@cypress/puppeteer-v0.1.7](https://github.com/cypress-io/cypress/compare/@cypress/puppeteer-v0.1.6...@cypress/puppeteer-v0.1.7) (2025-09-18)

# [@cypress/puppeteer-v0.1.6](https://github.com/cypress-io/cypress/compare/@cypress/puppeteer-v0.1.5...@cypress/puppeteer-v0.1.6) (2025-05-16)

# [@cypress/puppeteer-v0.1.5](https://github.com/cypress-io/cypress/compare/@cypress/puppeteer-v0.1.4...@cypress/puppeteer-v0.1.5) (2024-06-07)


### Bug Fixes

* update cypress to Typescript 5 ([#29568](https://github.com/cypress-io/cypress/issues/29568)) ([f3b6766](https://github.com/cypress-io/cypress/commit/f3b67666a5db0438594339c379cf27e1fd1e4abc))

# [@cypress/puppeteer-v0.1.4](https://github.com/cypress-io/cypress/compare/@cypress/puppeteer-v0.1.3...@cypress/puppeteer-v0.1.4) (2024-04-02)

# [@cypress/puppeteer-v0.1.3](https://github.com/cypress-io/cypress/compare/@cypress/puppeteer-v0.1.2...@cypress/puppeteer-v0.1.3) (2024-02-20)


### Bug Fixes

* move main tab activation to puppeteer plugin ([#28898](https://github.com/cypress-io/cypress/issues/28898)) ([ed2fc13](https://github.com/cypress-io/cypress/commit/ed2fc1394623f08097d180747712c557d867ee86))

# [@cypress/puppeteer-v0.1.2](https://github.com/cypress-io/cypress/compare/@cypress/puppeteer-v0.1.1...@cypress/puppeteer-v0.1.2) (2023-12-26)

# [@cypress/puppeteer-v0.1.1](https://github.com/cypress-io/cypress/compare/@cypress/puppeteer-v0.1.0...@cypress/puppeteer-v0.1.1) (2023-11-29)


### Bug Fixes

* Resolve types and dist issues with @cypress/puppeteer ([#28424](https://github.com/cypress-io/cypress/issues/28424)) ([72225db](https://github.com/cypress-io/cypress/commit/72225db03327744844dcfbcc72b40e85de6a2761))

# [@cypress/puppeteer-v0.1.0](https://github.com/cypress-io/cypress/compare/@cypress/puppeteer-v0.0.1...@cypress/puppeteer-v0.1.0) (2023-11-28)


### Features

* Initial release ([#28370](https://github.com/cypress-io/cypress/issues/28370)) ([b34d145](https://github.com/cypress-io/cypress/commit/b34d14571689a9b36efc707a3a48f27edcb98113))
