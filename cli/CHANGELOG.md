<!-- See the ../guides/writing-the-cypress-changelog.md for details on writing the changelog. -->
## 12.10.1

_Released 04/25/2023 (PENDING)_

## 12.10.0

_Released 04/17/2023_

**Features:**

- The Component Testing setup wizard will now show a warning message if an issue is encountered with an installed [third party framework definition](https://on.cypress.io/component-integrations). Addresses [#25838](https://github.com/cypress-io/cypress/issues/25838).

**Bugfixes:**

 - Capture the [Azure](https://azure.microsoft.com/) CI provider's environment variable [`SYSTEM_PULLREQUEST_PULLREQUESTNUMBER`](https://learn.microsoft.com/en-us/azure/devops/pipelines/build/variables?view=azure-devops&tabs=yaml#system-variables-devops-services) to display the linked PR number in the Cloud. Addressed in [#26215](https://github.com/cypress-io/cypress/pull/26215).
 - Fixed an issue in the onboarding wizard where project framework & bundler would not be auto-detected when opening directly into component testing mode using the `--component` CLI flag. Fixes [#22777](https://github.com/cypress-io/cypress/issues/22777) and [#26388](https://github.com/cypress-io/cypress/issues/26388).
 - Updated to use the `SEMAPHORE_GIT_WORKING_BRANCH` [Semphore](https://docs.semaphoreci.com) CI environment variable to correctly associate a Cloud run to the current branch. Previously this was incorrectly associating a run to the target branch. Fixes [#26309](https://github.com/cypress-io/cypress/issues/26309).
 - Fix an edge case in Component Testing where a custom `baseUrl` in `tsconfig.json` for Next.js 13.2.0+ is not respected. This was partially fixed in [#26005](https://github.com/cypress-io/cypress/pull/26005), but an edge case was missed. Fixes [#25951](https://github.com/cypress-io/cypress/issues/25951).
 - Correctly detect and resolve dependencies when configuring Component Testing in projects using Yarn's [Plug'n'Play feature](https://yarnpkg.com/features/pnp). Fixes [#25960](https://github.com/cypress-io/cypress/issues/25960).
 - Fixed an issue where `click` events fired on `.type('{enter}')` did not propagate through shadow roots. Fixes [#26392](https://github.com/cypress-io/cypress/issues/26392).

**Misc:**

- Removed unintentional debug logs. Addressed in [#26411](https://github.com/cypress-io/cypress/pull/26411).
- Improved styling on the [Runs Page](https://docs.cypress.io/guides/core-concepts/cypress-app#Runs). Addresses [#26180](https://github.com/cypress-io/cypress/issues/26180).

**Dependency Updates:**

- Upgraded [`commander`](https://www.npmjs.com/package/commander) from `^5.1.0` to `^6.2.1`. Addressed in [#26226](https://github.com/cypress-io/cypress/pull/26226).
- Upgraded [`minimist`](https://www.npmjs.com/package/minimist) from `1.2.6` to `1.2.8` to address this [CVE-2021-44906](https://github.com/advisories/GHSA-xvch-5gv4-984h) NVD security vulnerability. Addressed in [#26254](https://github.com/cypress-io/cypress/pull/26254).

## 12.9.0

_Released 03/28/2023_

**Features:**

- The [Debug page](https://docs.cypress.io/guides/cloud/runs#Debug) now allows for navigating between all runs recorded for a commit. Addresses [#25899](https://github.com/cypress-io/cypress/issues/25899) and [#26018](https://github.com/cypress-io/cypress/issues/26018).

**Bugfixes:**

 - Fixed a compatibility issue so that component test projects can use [Vite](https://vitejs.dev/) version 4.2.0 and greater. Fixes [#26138](https://github.com/cypress-io/cypress/issues/26138).
 - Fixed an issue where [`cy.intercept()`](https://docs.cypress.io/api/commands/intercept) added an additional `content-length` header to spied requests that did not set a `content-length` header on the original request. Fixes [#24407](https://github.com/cypress-io/cypress/issues/24407).
 - Changed the way that Git hashes are loaded so that non-relevant runs are excluded from the Debug page. Fixes [#26058](https://github.com/cypress-io/cypress/issues/26058).
 - Corrected the [`.type()`](https://docs.cypress.io/api/commands/type) command to account for shadow root elements when determining whether or not focus needs to be simulated before typing. Fixes [#26198](https://github.com/cypress-io/cypress/issues/26198).
 - Fixed an issue where an incorrect working directory could be used for Git operations on Windows. Fixes [#23317](https://github.com/cypress-io/cypress/issues/23317).
 - Capture the [Buildkite](https://buildkite.com/) CI provider's environment variable `BUILDKITE_RETRY_COUNT` to handle CI retries in the Cloud. Addressed in [#25750](https://github.com/cypress-io/cypress/pull/25750).

**Misc:**

 - Made some minor styling updates to the Debug page. Addresses [#26041](https://github.com/cypress-io/cypress/issues/26041).

## 12.8.1

_Released 03/15/2023_

**Bugfixes:**

- Fixed a regression in Cypress [10](https://docs.cypress.io/guides/references/changelog#10-0-0) where the reporter auto-scroll configuration inside user preferences was unintentionally being toggled off. User's must now explicitly enable/disable auto-scroll under user preferences, which is enabled by default. Fixes [#24171](https://github.com/cypress-io/cypress/issues/24171) and [#26113](https://github.com/cypress-io/cypress/issues/26113).

**Dependency Updates:**

- Upgraded [`ejs`](https://www.npmjs.com/package/ejs) from `3.1.6` to `3.1.8` to address this [CVE-2022-29078](https://github.com/advisories/GHSA-phwq-j96m-2c2q) NVD security vulnerability. Addressed in [#25279](https://github.com/cypress-io/cypress/pull/25279).

## 12.8.0

_Released 03/14/2023_

**Features:**

- The [Debug page](https://docs.cypress.io/guides/cloud/runs#Debug) is now able to show real-time results from in-progress runs.  Addresses [#25759](https://github.com/cypress-io/cypress/issues/25759).
- Added the ability to control whether a request is logged to the command log via [`cy.intercept()`](https://docs.cypress.io/api/commands/intercept) by passing `log: false` or `log: true`. Addresses [#7362](https://github.com/cypress-io/cypress/issues/7362).
  - This can be used to override Cypress's default behavior of logging all XHRs and fetches, see the [example](https://docs.cypress.io/api/commands/intercept#Disabling-logs-for-a-request).
- It is now possible to control the number of connection attempts to the browser using the `CYPRESS_CONNECT_RETRY_THRESHOLD` Environment Variable. Learn more [here](https://docs.cypress.io/guides/references/advanced-installation#Environment-variables). Addressed in [#25848](https://github.com/cypress-io/cypress/pull/25848).

**Bugfixes:**

- Fixed an issue where using `Cypress.require()` would throw the error `Cannot find module 'typescript'`. Fixes [#25885](https://github.com/cypress-io/cypress/issues/25885).
- The [`before:spec`](https://docs.cypress.io/api/plugins/before-spec-api) API was updated to correctly support async event handlers in `run` mode. Fixes [#24403](https://github.com/cypress-io/cypress/issues/24403).
- Updated the Component Testing [community framework](https://docs.cypress.io/guides/component-testing/third-party-definitions) definition detection logic to take into account monorepo structures that hoist dependencies. Fixes [#25993](https://github.com/cypress-io/cypress/issues/25993).
- The onboarding wizard for Component Testing will now detect installed dependencies more reliably. Fixes [#25782](https://github.com/cypress-io/cypress/issues/25782).
- Fixed an issue where Angular components would sometimes be mounted in unexpected DOM locations in component tests. Fixes [#25956](https://github.com/cypress-io/cypress/issues/25956).
- Fixed an issue where Cypress component testing would fail to work with [Next.js](https://nextjs.org/) `13.2.1`. Fixes [#25951](https://github.com/cypress-io/cypress/issues/25951).
- Fixed an issue where migrating a project from a version of Cypress earlier than [10.0.0](#10-0-0) could fail if the project's `testFiles` configuration was an array of globs. Fixes [#25947](https://github.com/cypress-io/cypress/issues/25947).

**Misc:**

- Removed "New" badge in the navigation bar for the debug page icon. Addresses [#25925](https://github.com/cypress-io/cypress/issues/25925).
- Removed inline "Connect" buttons within the Specs Explorer. Addresses [#25926](https://github.com/cypress-io/cypress/issues/25926).
- Added an icon for "beta" versions of the Chrome browser. Addresses [#25968](https://github.com/cypress-io/cypress/issues/25968).

**Dependency Updates:**

- Upgraded [`mocha-junit-reporter`](https://www.npmjs.com/package/mocha-junit-reporter) from `2.1.0` to `2.2.0` to be able to use [new placeholders](https://github.com/michaelleeallen/mocha-junit-reporter/pull/163) such as `[suiteFilename]` or `[suiteName]` when defining the test report name. Addressed in [#25922](https://github.com/cypress-io/cypress/pull/25922).

## 12.7.0

_Released 02/24/2023_

**Features:**

- It is now possible to set `hostOnly` cookies with [`cy.setCookie()`](https://docs.cypress.io/api/commands/setcookie) for a given domain. Addresses [#16856](https://github.com/cypress-io/cypress/issues/16856) and [#17527](https://github.com/cypress-io/cypress/issues/17527).
- Added a Public API for third party component libraries to define a Framework Definition, embedding their library into the Cypress onboarding workflow. Learn more [here](https://docs.cypress.io/guides/component-testing/third-party-definitions). Implemented in [#25780](https://github.com/cypress-io/cypress/pull/25780) and closes [#25638](https://github.com/cypress-io/cypress/issues/25638).
- Added a Debug Page tutorial slideshow for projects that are not connected to Cypress Cloud. Addresses [#25768](https://github.com/cypress-io/cypress/issues/25768).
- Improved various error message around interactions with the Cypress cloud. Implemented in [#25837](https://github.com/cypress-io/cypress/pull/25837)
- Updated the "new" status badge for the Debug page navigation link to be less noticeable when the navigation is collapsed. Addresses [#25739](https://github.com/cypress-io/cypress/issues/25739).

**Bugfixes:**

- Fixed various bugs when recording to the cloud. Fixed in [#25837](https://github.com/cypress-io/cypress/pull/25837)
- Fixed an issue where cookies were being duplicated with the same hostname, but a prepended dot. Fixed an issue where cookies may not be expiring correctly. Fixes [#25174](https://github.com/cypress-io/cypress/issues/25174), [#25205](https://github.com/cypress-io/cypress/issues/25205) and [#25495](https://github.com/cypress-io/cypress/issues/25495).
- Fixed an issue where cookies weren't being synced when the application was stable. Fixed in [#25855](https://github.com/cypress-io/cypress/pull/25855). Fixes [#25835](https://github.com/cypress-io/cypress/issues/25835).
- Added missing TypeScript type definitions for the [`cy.reload()`](https://docs.cypress.io/api/commands/reload) command. Addressed in [#25779](https://github.com/cypress-io/cypress/pull/25779).
- Ensure Angular components are mounted inside the correct element. Fixes [#24385](https://github.com/cypress-io/cypress/issues/24385).
- Fix a bug where files outside the project root in a monorepo are not correctly served when using Vite. Addressed in [#25801](https://github.com/cypress-io/cypress/pull/25801).
- Fixed an issue where using [`cy.intercept`](https://docs.cypress.io/api/commands/intercept)'s `req.continue()` with a non-function parameter would not provide an appropriate error message. Fixed in [#25884](https://github.com/cypress-io/cypress/pull/25884).
- Fixed an issue where Cypress would erroneously launch and connect to multiple browser instances. Fixes [#24377](https://github.com/cypress-io/cypress/issues/24377).

**Misc:**

 - Made updates to the way that the Debug Page header displays information. Addresses [#25796](https://github.com/cypress-io/cypress/issues/25796) and [#25798](https://github.com/cypress-io/cypress/issues/25798).

## 12.6.0

_Released 02/15/2023_

**Features:**

- Added a new CLI flag, called [`--auto-cancel-after-failures`](https://docs.cypress.io/guides/guides/command-line#Options), that overrides the project-level ["Auto Cancellation"](https://docs.cypress.io/guides/cloud/smart-orchestration#Auto-Cancellation) value when recording to the Cloud. This gives Cloud users on Business and Enterprise plans the flexibility to alter the auto-cancellation value per run. Addressed in [#25237](https://github.com/cypress-io/cypress/pull/25237).
- It is now possible to overwrite query commands using [`Cypress.Commands.overwriteQuery`](https://on.cypress.io/api/custom-queries). Addressed in [#25078](https://github.com/cypress-io/cypress/issues/25078).
- Added [`Cypress.require()`](https://docs.cypress.io/api/cypress-api/require) for including dependencies within the [`cy.origin()`](https://docs.cypress.io/api/commands/origin) callback. This change removed support for using `require()` and `import()` directly within the callback because we found that it impacted performance not only for spec files using them within the [`cy.origin()`](https://docs.cypress.io/api/commands/origin) callback, but even for spec files that did not use them. Addresses [#24976](https://github.com/cypress-io/cypress/issues/24976).
- Added the ability to open the failing test in the IDE from the Debug page before needing to re-run the test. Addressed in [#24850](https://github.com/cypress-io/cypress/issues/24850).

**Bugfixes:**

- When a Cloud user is apart of multiple Cloud organizations, the [Connect to Cloud setup](https://docs.cypress.io/guides/cloud/projects#Set-up-a-project-to-record) now shows the correct organizational prompts when connecting a new project. Fixes [#25520](https://github.com/cypress-io/cypress/issues/25520).
- Fixed an issue where Cypress would fail to load any specs if the project `specPattern` included a resource that could not be accessed due to filesystem permissions. Fixes [#24109](https://github.com/cypress-io/cypress/issues/24109).
- Fixed an issue where the Debug page would display a different number of specs for in-progress runs than the in-progress specs reported in Cypress Cloud. Fixes [#25647](https://github.com/cypress-io/cypress/issues/25647).
- Fixed an issue in middleware where error-handling code could itself generate an error and fail to report the original issue. Fixes [#22825](https://github.com/cypress-io/cypress/issues/22825).
- Fixed an regression introduced in Cypress [12.3.0](#12-3-0) where custom browsers that relied on process environment variables were not found on macOS arm64 architectures. Fixed in [#25753](https://github.com/cypress-io/cypress/pull/25753).

**Misc:**

- Improved the UI of the Debug page. Addresses [#25664](https://github.com/cypress-io/cypress/issues/25664),  [#25669](https://github.com/cypress-io/cypress/issues/25669), [#25665](https://github.com/cypress-io/cypress/issues/25665), [#25666](https://github.com/cypress-io/cypress/issues/25666), and [#25667](https://github.com/cypress-io/cypress/issues/25667).
- Updated the Debug page sidebar badge to to show 0 to 99+ failing tests, increased from showing 0 to 9+ failing tests, to provide better test failure insights. Addresses [#25662](https://github.com/cypress-io/cypress/issues/25662).

**Dependency Updates:**

- Upgrade [`debug`](https://www.npmjs.com/package/debug) to `4.3.4`. Addressed in [#25699](https://github.com/cypress-io/cypress/pull/25699).

## 12.5.1

_Released 02/02/2023_

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
