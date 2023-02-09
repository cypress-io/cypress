 <!-- See the ../guides/writing-the-cypress-changelog.md for details on writing the changelog. -->
## 12.6.0

_Released 02/14/2023 (PENDING)_

**Bugfixes:**

 - Fixed an issue with the Cloud project selection modal not showing the correct prompts. Fixes [#25520](https://github.com/cypress-io/cypress/issues/25520).
 - Fixed an issue where cookies were being duplicated with the same hostname, but a prepended dot. Fixed an issue where cookies may not be expiring correctly. Fixes [#25174](https://github.com/cypress-io/cypress/issues/25174), [#25205](https://github.com/cypress-io/cypress/issues/25205) and [#25495](https://github.com/cypress-io/cypress/issues/25495).

**Features:**

- Added the "Open in IDE" feature for failed tests reported from the Debug page. Addressed in [#25691](https://github.com/cypress-io/cypress/pull/25691).

**Misc:**

- Improved the layout of the Debug Page on smaller viewports when there is a pending run. Addresses [#25664](https://github.com/cypress-io/cypress/issues/25664).
- Improved the layout of the Debug Page when displaying informational messages. Addresses [#25669](https://github.com/cypress-io/cypress/issues/25669).
- Icons in Debug page will no longer shrink at small viewports. Addresses [#25665](https://github.com/cypress-io/cypress/issues/25665).
- Increased the spacing between elements and their associated tooltip and added borders around artifact links on the Debug Page. Addresses [#25666](https://github.com/cypress-io/cypress/issues/25666).

**Dependency Updates:**

- Upgrade [`debug`][(https://www.npmjs.com/package/debug) to `4.3.4`. Addressed in [#25699](https://github.com/cypress-io/cypress/pull/25699).

## 12.5.1

_Released 02/10/2023_

**Bugfixes:**

- Fixed a regression introduced in Cypress [12.5.0](https://docs.cypress.io/guides/references/changelog#12-5-0) where the `runnable` was not included in the [`test:after:run`](https://docs.cypress.io/api/events/catalog-of-events) event. Fixes [#25663](https://github.com/cypress-io/cypress/issues/25663).

**Dependency Updates:**

- Upgraded [`simple-git`](https://github.com/steveukx/git-js) from `3.15.0` to `3.16.0` to address this [security vulnerability](https://github.com/advisories/GHSA-9p95-fxvg-qgq2) where Remote Code Execution (RCE) via the clone(), pull(), push() and listRemote() methods due to improper input sanitization was possible. Addressed in [#25603](https://github.com/cypress-io/cypress/pull/25603).

## 12.5.0

_Released 01/31/2023_

**Features:**

- Easily debug failed CI test runs recorded to the Cypress Cloud from your local Cypress app with the new Debug page. Please leave any feedback [here](https://github.com/cypress-io/cypress/discussions/25649). Your feedback will help us make decisions to improve the Debug experience. For more details, see [our blog post](https://on.cypress.io/debug-page-release). Addressed in [#25488](https://github.com/cypress-io/cypress/pull/25488).

**Performance:**

- Improved memory consumption in `run` mode by removing reporter logs for successful tests. Fixes [#25230](https://github.com/cypress-io/cypress/issues/25230).

**Bugfixes:**

- Fixed an issue where alternative Microsoft Edge Beta, Canary, and Dev binary versions were not being discovered by Cypress. Fixes [#25455](https://github.com/cypress-io/cypress/issues/25455).

**Dependency Updates:**

- Upgraded [`underscore.string`](https://github.com/esamattis/underscore.string/blob/HEAD/CHANGELOG.markdown) from `3.3.5` to `3.3.6` to reference rebuilt assets after security patch to fix regular expression DDOS exploit. Addressed in [#25574](https://github.com/cypress-io/cypress/pull/25574).

## 12.4.1

_Released 01/27/2023_

**Bugfixes:**

- Fixed a regression from Cypress [12.4.0](https://docs.cypress.io/guides/references/changelog#12-4-0) where Cypress was not exiting properly when running multiple Component Testing specs in `electron` in `run` mode. Fixes [#25568](https://github.com/cypress-io/cypress/issues/25568).

**Dependency Updates:**

- Upgraded [`ua-parser-js`](https://github.com/faisalman/ua-parser-js) from `0.7.24` to `0.7.33` to address this [security vulnerability](https://github.com/faisalman/ua-parser-js/security/advisories/GHSA-fhg7-m89q-25r3) where crafting a very-very-long user-agent string with specific pattern, an attacker can turn the script to get stuck processing for a very long time which results in a denial of service (DoS) condition. Addressed in [#25561](https://github.com/cypress-io/cypress/pull/25561).

## 12.4.0

_Released 1/24/2023_

**Features:**

- Added official support for Vite 4 in component testing. Addresses
  [#24969](https://github.com/cypress-io/cypress/issues/24969).
- Added new
  [`experimentalMemoryManagement`](/guides/references/experiments#Configuration)
  configuration option to improve memory management in Chromium-based browsers.
  Enable this option with `experimentalMemoryManagement=true` if you have
  experienced "Out of Memory" issues. Addresses
  [#23391](https://github.com/cypress-io/cypress/issues/23391).
- Added new
  [`experimentalSkipDomainInjection`](/guides/references/experiments#Experimental-Skip-Domain-Injection)
  configuration option to disable Cypress from setting `document.domain` on
  injection, allowing users to test Salesforce domains. If you believe you are
  having `document.domain` issues, please see the
  [`experimentalSkipDomainInjection`](/guides/references/experiments#Experimental-Skip-Domain-Injection)
  guide. This config option is end-to-end only. Addresses
  [#2367](https://github.com/cypress-io/cypress/issues/2367),
  [#23958](https://github.com/cypress-io/cypress/issues/23958),
  [#24290](https://github.com/cypress-io/cypress/issues/24290), and
  [#24418](https://github.com/cypress-io/cypress/issues/24418).
- The [`.as`](/api/commands/as) command now accepts an options argument,
  allowing an alias to be stored as type "query" or "static" value. This is
  stored as "query" by default. Addresses
  [#25173](https://github.com/cypress-io/cypress/issues/25173).
- The `cy.log()` command will now display a line break where the `\n` character
  is used. Addresses
  [#24964](https://github.com/cypress-io/cypress/issues/24964).
- [`component.specPattern`](/guides/references/configuration#component) now
  utilizes a JSX/TSX file extension when generating a new empty spec file if
  project contains at least one file with those extensions. This applies only to
  component testing and is skipped if
  [`component.specPattern`](/guides/references/configuration#component) has been
  configured to exclude files with those extensions. Addresses
  [#24495](https://github.com/cypress-io/cypress/issues/24495).
- Added support for the `data-qa` selector in the
  [Selector Playground](guides/core-concepts/cypress-app#Selector-Playground) in
  addition to `data-cy`, `data-test` and `data-testid`. Addresses
  [#25305](https://github.com/cypress-io/cypress/issues/25305).

**Bugfixes:**

- Fixed an issue where component tests could incorrectly treat new major
  versions of certain dependencies as supported. Fixes
  [#25379](https://github.com/cypress-io/cypress/issues/25379).
- Fixed an issue where new lines or spaces on new lines in the Command Log were
  not maintained. Fixes
  [#23679](https://github.com/cypress-io/cypress/issues/23679) and
  [#24964](https://github.com/cypress-io/cypress/issues/24964).
- Fixed an issue where Angular component testing projects would fail to
  initialize if an unsupported browserslist entry was specified in the project
  configuration. Fixes
  [#25312](https://github.com/cypress-io/cypress/issues/25312).

**Misc**

- Video output link in `cypress run` mode has been added to it's own line to
  make the video output link more easily clickable in the terminal. Addresses
  [#23913](https://github.com/cypress-io/cypress/issues/23913).
