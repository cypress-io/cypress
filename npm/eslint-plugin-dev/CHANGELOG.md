# [@[secure]/eslint-plugin-dev-v7.0.0](https://github.com/[secure]-io/[secure]/compare/@[secure]/eslint-plugin-dev-v6.0.0...@[secure]/eslint-plugin-dev-v7.0.0) (2026-08-26)


### breaking

* remove built-in CoffeeScript support ([#33654](https://github.com/[secure]-io/[secure]/issues/33654)) ([0b7017d](https://github.com/[secure]-io/[secure]/commit/0b7017d15ed1647b82a092fd69fba56dba42db08))


### BREAKING CHANGES

* - **Cypress (semver: major, e.g. 16.0.0):** `cy.fixture()` no longer treats `.coffee` as executable CoffeeScript; those files are handled like other non-specialized extensions (e.g. raw UTF-8) unless you use encoding options.
- **Cypress (semver: major):** The default `@[secure]/webpack-batteries-included-preprocessor` no longer registers `coffee-loader` or ships `coffeescript`. `.coffee` specs/support files will not compile unless users add their own webpack config via `@[secure]/webpack-preprocessor`.
- **`@[secure]/webpack-batteries-included-preprocessor` (semver: minor → treat as breaking for consumers, e.g. 4.2.0):** Removed `coffee-loader` and `coffeescript` dependencies and the `/\.coffee$/` rule from default webpack options.

Migration:
- Use JavaScript or TypeScript for specs, support files, and object fixtures (`.json` / `.js`).
- For CoffeeScript specs, use `@[secure]/webpack-preprocessor` with a custom webpack config that includes `coffee-loader` and `coffeescript`.

Also:
- Rename system-tests fixture `coffee-react-interop` → `react-webpack-interop` and update `es_modules_spec` / `typescript_spec_support_spec`.
- Update errors copy, CLI types examples, app settings tests, driver stack/location tests, v8 snapshot cache workflow Node version, and related docs/changelogs.

* fix failing test

* remove date in CLI

* fix changelog entry

* remove screenshots from some system-test snapshots

* fix snapshot

* remove coffeescript import

* remove webpack-batteries..changelog

* remove migration specific comment

* remove debugger

* revert to pending test

* remove other callbacks

# [@cypress/eslint-plugin-dev-v6.0.0](https://github.com/cypress-io/cypress/compare/@cypress/eslint-plugin-dev-v5.3.3...@cypress/eslint-plugin-dev-v6.0.0) (2024-05-06)


### breaking

* the supported eslint version is 8 for @cypress/eslint-plugin-dev. ([3b799a1](https://github.com/cypress-io/cypress/commit/3b799a158d7af419637d524e811561cd25143c3f))


### BREAKING CHANGES

* The supported eslint version is 8.  @see f14a11aecfbc1e3854daae02b69fb40b4ec801b7 for breaking changes to the plugin.

# [@cypress/eslint-plugin-dev-v5.3.3](https://github.com/cypress-io/cypress/compare/@cypress/eslint-plugin-dev-v5.3.2...@cypress/eslint-plugin-dev-v5.3.3) (2024-01-12)


### Bug Fixes

* allow for versions greater than 4 for eslint-plugin-mocha to prevent force installing dependencies when eslint-plugin-mocha is bumbed in comsumer packages ([#27944](https://github.com/cypress-io/cypress/issues/27944)) ([bf05978](https://github.com/cypress-io/cypress/commit/bf0597847e71f34303364929f9c34cdd6c0e7ad8))

# [@cypress/eslint-plugin-dev-v5.3.2](https://github.com/cypress-io/cypress/compare/@cypress/eslint-plugin-dev-v5.3.1...@cypress/eslint-plugin-dev-v5.3.2) (2022-08-15)


### Bug Fixes

* clear session state when changing specs in open mode ([#23146](https://github.com/cypress-io/cypress/issues/23146)) ([f1122fc](https://github.com/cypress-io/cypress/commit/f1122fcf62c14abddc0ae96116572402c1be2372))

# [@cypress/eslint-plugin-dev-v5.3.1](https://github.com/cypress-io/cypress/compare/@cypress/eslint-plugin-dev-v5.3.0...@cypress/eslint-plugin-dev-v5.3.1) (2022-08-11)


### Bug Fixes

* retry on EMFILE always, lint sync FS calls ([#22175](https://github.com/cypress-io/cypress/issues/22175)) ([d01932b](https://github.com/cypress-io/cypress/commit/d01932bf751a6edf758451d8d19a74fe07e799ea))

# [@cypress/eslint-plugin-dev-v5.3.1](https://github.com/cypress-io/cypress/compare/@cypress/eslint-plugin-dev-v5.3.0...@cypress/eslint-plugin-dev-v5.3.1) (2022-08-10)


### Bug Fixes

* retry on EMFILE always, lint sync FS calls ([#22175](https://github.com/cypress-io/cypress/issues/22175)) ([d01932b](https://github.com/cypress-io/cypress/commit/d01932bf751a6edf758451d8d19a74fe07e799ea))

# [@cypress/eslint-plugin-dev-v5.3.1](https://github.com/cypress-io/cypress/compare/@cypress/eslint-plugin-dev-v5.3.0...@cypress/eslint-plugin-dev-v5.3.1) (2022-06-29)


### Bug Fixes

* retry on EMFILE always, lint sync FS calls ([#22175](https://github.com/cypress-io/cypress/issues/22175)) ([d01932b](https://github.com/cypress-io/cypress/commit/d01932bf751a6edf758451d8d19a74fe07e799ea))

# [@cypress/eslint-plugin-dev-v5.3.0](https://github.com/cypress-io/cypress/compare/@cypress/eslint-plugin-dev-v5.2.0...@cypress/eslint-plugin-dev-v5.3.0) (2022-06-01)


### Features

* Turn "no-useless-constructor" off and enable "ignoreRestSiblings" ([#17875](https://github.com/cypress-io/cypress/issues/17875)) ([94541d4](https://github.com/cypress-io/cypress/commit/94541d4f18591e8fa4b8702c39e92b0a7238aa5d))

# [@cypress/eslint-plugin-dev-v5.2.0](https://github.com/cypress-io/cypress/compare/@cypress/eslint-plugin-dev-v5.1.0...@cypress/eslint-plugin-dev-v5.2.0) (2021-12-16)


### Features

* use hoisted yarn install in binary build ([#17285](https://github.com/cypress-io/cypress/issues/17285)) ([e4f5b10](https://github.com/cypress-io/cypress/commit/e4f5b106d49d6ac0857c5fdac886f83b99558c88))

# [@cypress/eslint-plugin-dev-v5.1.0](https://github.com/cypress-io/cypress/compare/@cypress/eslint-plugin-dev-v5.0.2...@cypress/eslint-plugin-dev-v5.1.0) (2021-02-16)


### Features

* component testing ([#14479](https://github.com/cypress-io/cypress/issues/14479)) ([af26fbe](https://github.com/cypress-io/cypress/commit/af26fbebe6bc609132013a0493a116cc78bb1bd4))

# [@cypress/eslint-plugin-dev-v5.0.2](https://github.com/cypress-io/cypress/compare/@cypress/eslint-plugin-dev-v5.0.1...@cypress/eslint-plugin-dev-v5.0.2) (2020-10-29)


### Bug Fixes

* update bugs link in package.json ([#9015](https://github.com/cypress-io/cypress/issues/9015)) ([34186cb](https://github.com/cypress-io/cypress/commit/34186cb8b76c230a2506cabb0358d44c3205e0c4))
