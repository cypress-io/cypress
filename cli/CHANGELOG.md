<!-- See the ../guides/writing-the-cypress-changelog.md for details on writing the changelog. -->
## 13.5.1

_Released 11/21/2023 (PENDING)_

**Bugfixes:**

- We now pass a flag to Chromium browsers to disable default component extensions. This is a common flag passed during browser automation. Fixed in [#28294](https://github.com/cypress-io/cypress/pull/28294).

## 13.5.0

_Released 11/8/2023_

**Features:**

 - Added Component Testing support for [Angular](https://angular.io/) version 17. Addresses [#28153](https://github.com/cypress-io/cypress/issues/28153).

**Bugfixes:**

- Fixed an issue in chromium based browsers, where global style updates can trigger flooding of font face requests in DevTools and Test Replay. This can affect performance due to the flooding of messages in CDP. Fixes [#28150](https://github.com/cypress-io/cypress/issues/28150) and [#28215](https://github.com/cypress-io/cypress/issues/28215).
- Fixed a regression in [`13.3.3`](https://docs.cypress.io/guides/references/changelog/13.3.3) where Cypress would hang on loading shared workers when using `cy.reload` to reload the page. Fixes [#28248](https://github.com/cypress-io/cypress/issues/28248).
- Fixed an issue where network requests made from tabs, or windows other than the main Cypress tab, would be delayed. Fixes [#28113](https://github.com/cypress-io/cypress/issues/28113).
- Fixed an issue with 'other' targets (e.g. pdf documents embedded in an object tag) not fully loading. Fixes [#28228](https://github.com/cypress-io/cypress/issues/28228) and [#28162](https://github.com/cypress-io/cypress/issues/28162).
- Fixed an issue where clicking a link to download a file could cause a page load timeout when the download attribute was missing. Note: download behaviors in experimental Webkit are still an issue. Fixes [#14857](https://github.com/cypress-io/cypress/issues/14857).
- Fixed an issue to account for canceled and failed downloads to correctly reflect these status in Command log as a download failure where previously it would be pending. Fixed in [#28222](https://github.com/cypress-io/cypress/pull/28222).
- Fixed an issue determining visibility when an element is hidden by an ancestor with a shared edge. Fixes [#27514](https://github.com/cypress-io/cypress/issues/27514).
- We now pass a flag to Chromium browsers to disable Chrome translation, both the manual option and the popup prompt, when a page with a differing language is detected. Fixes [#28225](https://github.com/cypress-io/cypress/issues/28225).
- Stopped processing CDP events at the end of a spec when Test Isolation is off and Test Replay is enabled. Addressed in [#28213](https://github.com/cypress-io/cypress/pull/28213).

## 13.4.0

_Released 10/30/2023_

**Features:**

- Introduced experimental configuration options for advanced retry logic: adds `experimentalStrategy` and `experimentalOptions` keys to the `retry` configuration key. See [Experimental Flake Detection Features](https://docs.cypress.io/guides/references/experiments/#Experimental-Flake-Detection-Features) in the documentation. Addressed in [#27930](https://github.com/cypress-io/cypress/pull/27930).

**Bugfixes:**

- Fixed a regression in [`13.3.2`](https://docs.cypress.io/guides/references/changelog/13.3.2) where Cypress would crash with 'Inspected target navigated or closed' or 'Session with given id not found'. Fixes [#28141](https://github.com/cypress-io/cypress/issues/28141) and [#28148](https://github.com/cypress-io/cypress/issues/28148).

## 13.3.3

_Released 10/24/2023_

**Bugfixes:**

- Fixed a performance regression in `13.3.1` with proxy correlation timeouts and requests issued from web and shared workers. Fixes [#28104](https://github.com/cypress-io/cypress/issues/28104).
- Fixed a performance problem with proxy correlation when requests get aborted and then get miscorrelated with follow up requests. Addressed in [#28094](https://github.com/cypress-io/cypress/pull/28094).
- Fixed a regression in [10.0.0](#10.0.0), where search would not find a spec if the file name contains "-" or "\_", but search prompt contains " " instead (e.g. search file "spec-file.cy.ts" with prompt "spec file"). Fixes [#25303](https://github.com/cypress-io/cypress/issues/25303).

## 13.3.2

_Released 10/18/2023_

**Bugfixes:**

- Fixed a performance regression in `13.3.1` with proxy correlation timeouts and requests issued from service workers. Fixes [#28054](https://github.com/cypress-io/cypress/issues/28054) and [#28056](https://github.com/cypress-io/cypress/issues/28056).
- Fixed an issue where proxy correlation would leak over from a previous spec causing performance problems, `cy.intercept` problems, and Test Replay asset capturing issues. Addressed in [#28060](https://github.com/cypress-io/cypress/pull/28060).
- Fixed an issue where redirects of requests that knowingly don't have CDP traffic should also be assumed to not have CDP traffic. Addressed in [#28060](https://github.com/cypress-io/cypress/pull/28060).
- Fixed an issue with Accept Encoding headers by forcing gzip when no accept encoding header is sent and using identity if gzip is not sent. Fixes [#28025](https://github.com/cypress-io/cypress/issues/28025).

**Dependency Updates:**

- Upgraded [`@babel/core`](https://www.npmjs.com/package/@babel/core) from `7.22.9` to `7.23.2` to address the [SNYK-JS-SEMVER-3247795](https://snyk.io/vuln/SNYK-JS-SEMVER-3247795) security vulnerability. Addressed in [#28063](https://github.com/cypress-io/cypress/pull/28063).
- Upgraded [`@babel/traverse`](https://www.npmjs.com/package/@babel/traverse) from `7.22.8` to `7.23.2` to address the [SNYK-JS-BABELTRAVERSE-5962462](https://snyk.io/vuln/SNYK-JS-BABELTRAVERSE-5962462) security vulnerability. Addressed in [#28063](https://github.com/cypress-io/cypress/pull/28063).
- Upgraded [`react-docgen`](https://www.npmjs.com/package/react-docgen) from `6.0.0-alpha.3` to `6.0.4` to address the [SNYK-JS-BABELTRAVERSE-5962462](https://snyk.io/vuln/SNYK-JS-BABELTRAVERSE-5962462) security vulnerability. Addressed in [#28063](https://github.com/cypress-io/cypress/pull/28063).

## 13.3.1

_Released 10/11/2023_

**Bugfixes:**

- Fixed an issue where requests were correlated in the wrong order in the proxy. This could cause an issue where the wrong request is used for `cy.intercept` or assets (e.g. stylesheets or images) may not properly be available in Test Replay. Addressed in [#27892](https://github.com/cypress-io/cypress/pull/27892).
- Fixed an issue where a crashed Chrome renderer can cause the Test Replay recorder to hang. Addressed in [#27909](https://github.com/cypress-io/cypress/pull/27909).
- Fixed an issue where multiple responses yielded from calls to `cy.wait()` would sometimes be out of order. Fixes [#27337](https://github.com/cypress-io/cypress/issues/27337).
- Fixed an issue where requests were timing out in the proxy. This could cause an issue where the wrong request is used for `cy.intercept` or assets (e.g. stylesheets or images) may not properly be available in Test Replay. Addressed in [#27976](https://github.com/cypress-io/cypress/pull/27976).
- Fixed an issue where Test Replay couldn't record tests due to issues involving `GLIBC`. Fixed deprecation warnings during the rebuild of better-sqlite3. Fixes [#27891](https://github.com/cypress-io/cypress/issues/27891) and [#27902](https://github.com/cypress-io/cypress/issues/27902).
- Enables test replay for executed specs in runs that have a spec that causes a browser crash. Addressed in [#27786](https://github.com/cypress-io/cypress/pull/27786).

## 13.3.0

_Released 09/27/2023_

**Features:**

 - Introduces new layout for Runs page providing additional run information. Addresses [#27203](https://github.com/cypress-io/cypress/issues/27203).

**Bugfixes:**

- Fixed an issue where actionability checks trigger a flood of font requests. Removing the font requests has the potential to improve performance and removes clutter from Test Replay. Addressed in [#27860](https://github.com/cypress-io/cypress/pull/27860).
- Fixed network stubbing not permitting status code 999. Fixes [#27567](https://github.com/cypress-io/cypress/issues/27567). Addressed in [#27853](https://github.com/cypress-io/cypress/pull/27853).

## 13.2.0

_Released 09/12/2023_

**Features:**

 - Adds support for Nx users who want to run Angular Component Testing in parallel. Addressed in [#27723](https://github.com/cypress-io/cypress/pull/27723).

**Bugfixes:**

- Edge cases where `cy.intercept()` would not properly intercept and asset response bodies would not properly be captured for Test Replay have been addressed. Addressed in [#27771](https://github.com/cypress-io/cypress/pull/27771).
- Fixed an issue where `enter`, `keyup`, and `space` events were not triggering `click` events properly in some versions of Firefox. Addressed in [#27715](https://github.com/cypress-io/cypress/pull/27715).
- Fixed a regression in `13.0.0` where tests using Basic Authorization can potentially hang indefinitely on chromium browsers. Addressed in [#27781](https://github.com/cypress-io/cypress/pull/27781).
- Fixed a regression in `13.0.0` where component tests using an intercept that matches all requests can potentially hang indefinitely. Addressed in [#27788](https://github.com/cypress-io/cypress/pull/27788).

**Dependency Updates:**

- Upgraded Electron from `21.0.0` to `25.8.0`, which updates bundled Chromium from `106.0.5249.51` to `114.0.5735.289`. Additionally, the Node version binary has been upgraded from `16.16.0` to `18.15.0`. This does **NOT** have an impact on the node version you are using with Cypress and is merely an internal update to the repository & shipped binary. Addressed in [#27715](https://github.com/cypress-io/cypress/pull/27715). Addresses [#27595](https://github.com/cypress-io/cypress/issues/27595).

## 13.1.0

_Released 08/31/2023_

**Features:**

 - Introduces a status icon representing the `latest` test run in the Sidebar for the Runs Page. Addresses [#27206](https://github.com/cypress-io/cypress/issues/27206).

**Bugfixes:**

- Fixed a regression introduced in Cypress [13.0.0](#13-0-0) where the [Module API](https://docs.cypress.io/guides/guides/module-api), [`after:run`](https://docs.cypress.io/api/plugins/after-run-api), and  [`after:spec`](https://docs.cypress.io/api/plugins/after-spec-api) results did not include the `stats.skipped` field for each run result. Fixes [#27694](https://github.com/cypress-io/cypress/issues/27694). Addressed in [#27695](https://github.com/cypress-io/cypress/pull/27695).
- Individual CDP errors that occur while capturing data for Test Replay will no longer prevent the entire run from being available. Addressed in [#27709](https://github.com/cypress-io/cypress/pull/27709).
- Fixed an issue where the release date on the `v13` landing page was a day behind. Fixed in [#27711](https://github.com/cypress-io/cypress/pull/27711).
- Fixed an issue where fatal protocol errors would leak between specs causing all subsequent specs to fail to upload protocol information. Fixed in [#27720](https://github.com/cypress-io/cypress/pull/27720)
- Updated `plist` from `3.0.6` to `3.1.0` to address [CVE-2022-37616](https://github.com/advisories/GHSA-9pgh-qqpf-7wqj) and [CVE-2022-39353](https://github.com/advisories/GHSA-crh6-fp67-6883). Fixed in [#27710](https://github.com/cypress-io/cypress/pull/27710).

## 13.0.0

_Released 08/29/2023_

**Breaking Changes:**

- The [`video`](https://docs.cypress.io/guides/references/configuration#Videos) configuration option now defaults to `false`. Addresses [#26157](https://github.com/cypress-io/cypress/issues/26157).
- The [`videoCompression`](https://docs.cypress.io/guides/references/configuration#Videos) configuration option now defaults to `false`. Addresses [#26160](https://github.com/cypress-io/cypress/issues/26160).
- The [`videoUploadOnPasses`](https://docs.cypress.io/guides/references/configuration#Videos) configuration option has been removed. Please see our [screenshots & videos guide](https://docs.cypress.io/guides/guides/screenshots-and-videos#Delete-videos-for-specs-without-failing-or-retried-tests) on how to accomplish similar functionality. Addresses [#26899](https://github.com/cypress-io/cypress/issues/26899).
- Requests for assets at relative paths for component testing are now correctly forwarded to the dev server. Fixes [#26725](https://github.com/cypress-io/cypress/issues/26725).
- The [`cy.readFile()`](/api/commands/readfile) command is now retry-able as a [query command](https://on.cypress.io/retry-ability). This should not affect any tests using it; the functionality is unchanged. However, it can no longer be overwritten using [`Cypress.Commands.overwrite()`](/api/cypress-api/custom-commands#Overwrite-Existing-Commands). Addressed in [#25595](https://github.com/cypress-io/cypress/pull/25595).
- The current spec path is now passed from the AUT iframe using a query parameter rather than a path segment. This allows for requests for assets at relative paths to be correctly forwarded to the dev server. Fixes [#26725](https://github.com/cypress-io/cypress/issues/26725).
- The deprecated configuration option `nodeVersion` has been removed. Addresses [#27016](https://github.com/cypress-io/cypress/issues/27016).
- The properties and values returned by the [Module API](https://docs.cypress.io/guides/guides/module-api) and included in the arguments of handlers for the [`after:run`](https://docs.cypress.io/api/plugins/after-run-api) and  [`after:spec`](https://docs.cypress.io/api/plugins/after-spec-api) have been changed to be more consistent. Addresses [#23805](https://github.com/cypress-io/cypress/issues/23805).
- For Cypress Cloud runs with Test Replay enabled, the Cypress Runner UI is now hidden during the run since the Runner will be visible during Test Replay. As such, if video is recorded (which is now defaulted to `false`) during the run, the Runner will not be visible. In addition, if a runner screenshot (`cy.screenshot({ capture: runner })`) is captured, it will no longer contain the Runner.
- The browser and browser page unexpectedly closing in the middle of a test run are now gracefully handled. Addressed in [#27592](https://github.com/cypress-io/cypress/issues/27592).
- Automation performance is now improved by switching away from websockets to direct CDP calls for Chrome and Electron browsers. Addressed in [#27592](https://github.com/cypress-io/cypress/issues/27592).
- Edge cases where `cy.intercept()` would not properly intercept have been addressed. Addressed in [#27592](https://github.com/cypress-io/cypress/issues/27592).
- Node 14 support has been removed and Node 16 support has been deprecated. Node 16 may continue to work with Cypress `v13`, but will not be supported moving forward to closer coincide with [Node 16's end-of-life](https://nodejs.org/en/blog/announcements/nodejs16-eol) schedule. It is recommended that users update to at least Node 18.
- The minimum supported Typescript version is `4.x`.

**Features:**

- Consolidates and improves terminal output when uploading test artifacts to Cypress Cloud. Addressed in [#27402](https://github.com/cypress-io/cypress/pull/27402)

**Bugfixes:**

- Fixed an issue where Cypress's internal `tsconfig` would conflict with properties set in the user's `tsconfig.json` such as `module` and `moduleResolution`. Fixes [#26308](https://github.com/cypress-io/cypress/issues/26308) and [#27448](https://github.com/cypress-io/cypress/issues/27448).
- Clarified Svelte 4 works correctly with Component Testing and updated dependencies checks to reflect this. It was incorrectly flagged as not supported. Fixes [#27465](https://github.com/cypress-io/cypress/issues/27465).
- Resolve the `process/browser` global inside `@cypress/webpack-batteries-included-preprocessor` to resolve to `process/browser.js` in order to explicitly provide the file extension. File resolution must include the extension for `.mjs` and `.js` files inside ESM packages in order to resolve correctly. Fixes[#27599](https://github.com/cypress-io/cypress/issues/27599).
- Fixed an issue where the correct `pnp` process was not being discovered. Fixes [#27562](https://github.com/cypress-io/cypress/issues/27562).
- Fixed incorrect type declarations for Cypress and Chai globals that asserted them to be local variables of the global scope rather than properties on the global object. Fixes [#27539](https://github.com/cypress-io/cypress/issues/27539). Fixed in [#27540](https://github.com/cypress-io/cypress/pull/27540).
- Dev Servers will now respect and use the `port` configuration option if present. Fixes [#27675](https://github.com/cypress-io/cypress/issues/27675).

**Dependency Updates:**

- Upgraded [`@cypress/request`](https://www.npmjs.com/package/@cypress/request) from `^2.88.11` to `^3.0.0` to address the [CVE-2023-28155](https://github.com/advisories/GHSA-p8p7-x288-28g6) security vulnerability. Addresses [#27535](https://github.com/cypress-io/cypress/issues/27535). Addressed in [#27495](https://github.com/cypress-io/cypress/pull/27495).

## 12.17.4

_Released 08/15/2023_

**Bugfixes:**

- Fixed an issue where having `cypress.config` in a nested directory would cause problems with locating the `component-index.html` file when using component testing. Fixes [#26400](https://github.com/cypress-io/cypress/issues/26400).

**Dependency Updates:**

- Upgraded [`webpack`](https://www.npmjs.com/package/webpack) from `v4` to `v5`. This means that we are now bundling your `e2e` tests with webpack 5. We don't anticipate this causing any noticeable changes. However, if you'd like to keep bundling your `e2e` tests with wepback 4 you can use the same process as before by pinning [@cypress/webpack-batteries-included-preprocessor](https://www.npmjs.com/package/@cypress/webpack-batteries-included-preprocessor) to `v2.x.x` and hooking into the [file:preprocessor](https://docs.cypress.io/api/plugins/preprocessors-api#Usage) plugin event. This will restore the previous bundling process. Additionally, if you're using [@cypress/webpack-batteries-included-preprocessor](https://www.npmjs.com/package/@cypress/webpack-batteries-included-preprocessor) already, a new version has been published to support webpack `v5`.
- Upgraded [`tough-cookie`](https://www.npmjs.com/package/tough-cookie) from `4.0` to `4.1.3`, [`@cypress/request`](https://www.npmjs.com/package/@cypress/request) from `2.88.11` to `2.88.12` and [`@cypress/request-promise`](https://www.npmjs.com/package/@cypress/request-promise) from `4.2.6` to `4.2.7` to address a [security vulnerability](https://security.snyk.io/vuln/SNYK-JS-TOUGHCOOKIE-5672873). Fixes [#27261](https://github.com/cypress-io/cypress/issues/27261).

## 12.17.3

_Released 08/01/2023_

**Bugfixes:**

- Fixed an issue where unexpected branch names were being recorded for cypress runs when executed by GitHub Actions. The HEAD branch name will now be recorded by default for pull request workflows if a branch name cannot otherwise be detected from user overrides or from local git data. Fixes [#27389](https://github.com/cypress-io/cypress/issues/27389).

**Performance:**

- Fixed an issue where unnecessary requests were being paused. No longer sends `X-Cypress-Is-XHR-Or-Fetch` header and infers resource type off of the server pre-request object. Fixes [#26620](https://github.com/cypress-io/cypress/issues/26620) and [#26622](https://github.com/cypress-io/cypress/issues/26622).

## 12.17.2

_Released 07/20/2023_

**Bugfixes:**

- Fixed an issue where commands would fail with the error `must only be invoked from the spec file or support file` if their arguments were mutated. Fixes [#27200](https://github.com/cypress-io/cypress/issues/27200).
- Fixed an issue where `cy.writeFile()` would erroneously fail with the error `cy.writeFile() must only be invoked from the spec file or support file`. Fixes [#27097](https://github.com/cypress-io/cypress/issues/27097).
- Fixed an issue where web workers could not be created within a spec. Fixes [#27298](https://github.com/cypress-io/cypress/issues/27298).

## 12.17.1

_Released 07/10/2023_

**Bugfixes:**

- Fixed invalid stored preference when enabling in-app notifications that could cause the application to crash.  Fixes [#27228](https://github.com/cypress-io/cypress/issues/27228).
- Fixed an issue with the Typescript types of [`cy.screenshot()`](https://docs.cypress.io/api/commands/screenshot). Fixed in [#27130](https://github.com/cypress-io/cypress/pull/27130).

**Dependency Updates:**

- Upgraded [`@cypress/request`](https://www.npmjs.com/package/@cypress/request) from `2.88.10` to `2.88.11` to address [CVE-2022-24999](https://www.cve.org/CVERecord?id=CVE-2022-24999) security vulnerability. Addressed in [#27005](https://github.com/cypress-io/cypress/pull/27005).

## 12.17.0

_Released 07/05/2023_

**Features:**

- Cypress Cloud users can now receive desktop notifications about their runs, including when one starts, finishes, or fails. Addresses [#26686](https://github.com/cypress-io/cypress/issues/26686).

**Bugfixes:**

- Fixed issues where commands would fail with the error `must only be invoked from the spec file or support file`. Fixes [#27149](https://github.com/cypress-io/cypress/issues/27149) and [#27163](https://github.com/cypress-io/cypress/issues/27163).
- Fixed a regression introduced in Cypress [12.12.0](#12-12-0) where Cypress may fail to reconnect to the Chrome DevTools Protocol in Electron. Fixes [#26900](https://github.com/cypress-io/cypress/issues/26900).
- Fixed an issue where chrome was not recovering from browser crashes properly. Fixes [#24650](https://github.com/cypress-io/cypress/issues/24650).
- Fixed a race condition that was causing a GraphQL error to appear on the [Debug page](https://docs.cypress.io/guides/cloud/runs#Debug) when viewing a running Cypress Cloud build. Fixed in [#27134](https://github.com/cypress-io/cypress/pull/27134).
- Fixed a race condition in electron where the test window exiting prematurely during the browser launch process was causing the whole test run to fail. Addressed in [#27167](https://github.com/cypress-io/cypress/pull/27167).
- Fixed minor issues with Typescript types in the CLI. Fixes [#24110](https://github.com/cypress-io/cypress/issues/24110).
- Fixed an issue where a value for the Electron debug port would not be respected if defined using the `ELECTRON_EXTRA_LAUNCH_ARGS` environment variable. Fixes [#26711](https://github.com/cypress-io/cypress/issues/26711).

**Dependency Updates:**

- Update dependency semver to ^7.5.3. Addressed in [#27151](https://github.com/cypress-io/cypress/pull/27151).

## 12.16.0

_Released 06/26/2023_

**Features:**

- Added support for Angular 16.1.0 in Cypress Component Testing. Addresses [#27049](https://github.com/cypress-io/cypress/issues/27049).

**Bugfixes:**

- Fixed an issue where certain commands would fail with the error `must only be invoked from the spec file or support file` when invoked with a large argument. Fixes [#27099](https://github.com/cypress-io/cypress/issues/27099).

## 12.15.0

_Released 06/20/2023_

**Features:**

- Added support for running Cypress tests with [Chrome's new `--headless=new` flag](https://developer.chrome.com/articles/new-headless/). Chrome versions 112 and above will now be run in the `headless` mode that matches the `headed` browser implementation. Addresses [#25972](https://github.com/cypress-io/cypress/issues/25972).
- Cypress can now test pages with targeted `Content-Security-Policy` and `Content-Security-Policy-Report-Only` header directives by specifying the allow list via the [`experimentalCspAllowList`](https://docs.cypress.io/guides/references/configuration#Experimental-Csp-Allow-List) configuration option. Addresses [#1030](https://github.com/cypress-io/cypress/issues/1030). Addressed in [#26483](https://github.com/cypress-io/cypress/pull/26483)
- The [`videoCompression`](https://docs.cypress.io/guides/references/configuration#Videos) configuration option now accepts both a boolean or a Constant Rate Factor (CRF) number between `1` and `51`. The `videoCompression` default value is still `32` CRF and when `videoCompression` is set to `true` the default of `32` CRF will be used. Addresses [#26658](https://github.com/cypress-io/cypress/issues/26658).
- The Cypress Cloud data shown on the [Specs](https://docs.cypress.io/guides/core-concepts/cypress-app#Specs) page and [Runs](https://docs.cypress.io/guides/core-concepts/cypress-app#Runs) page will now reflect Cloud Runs that match the current Git tree if Git is being used. Addresses [#26693](https://github.com/cypress-io/cypress/issues/26693).

**Bugfixes:**

- Fixed an issue where video output was not being logged to the console when `videoCompression` was turned off. Videos will now log to the terminal regardless of the compression value. Addresses [#25945](https://github.com/cypress-io/cypress/issues/25945).

**Dependency Updates:**

- Removed [`@cypress/mocha-teamcity-reporter`](https://www.npmjs.com/package/@cypress/mocha-teamcity-reporter) as this package was no longer being referenced. Addressed in [#26938](https://github.com/cypress-io/cypress/pull/26938).

## 12.14.0

_Released 06/07/2023_

**Features:**

- A new testing type switcher has been added to the Spec Explorer to make it easier to move between E2E and Component Testing. An informational overview of each type is displayed if it hasn't already been configured to help educate and onboard new users to each testing type. Addresses [#26448](https://github.com/cypress-io/cypress/issues/26448), [#26836](https://github.com/cypress-io/cypress/issues/26836) and [#26837](https://github.com/cypress-io/cypress/issues/26837).

**Bugfixes:**

- Fixed an issue to now correctly detect Angular 16 dependencies
([@angular/cli](https://www.npmjs.com/package/@angular/cli),
[@angular-devkit/build-angular](https://www.npmjs.com/package/@angular-devkit/build-angular),
[@angular/core](https://www.npmjs.com/package/@angular/core), [@angular/common](https://www.npmjs.com/package/@angular/common),
[@angular/platform-browser-dynamic](https://www.npmjs.com/package/@angular/platform-browser-dynamic))
during Component Testing onboarding. Addresses [#26852](https://github.com/cypress-io/cypress/issues/26852).
- Ensures Git-related messages on the [Runs page](https://docs.cypress.io/guides/core-concepts/cypress-app#Runs) remain dismissed. Addresses [#26808](https://github.com/cypress-io/cypress/issues/26808).

**Dependency Updates:**

- Upgraded [`find-process`](https://www.npmjs.com/package/find-process) from `1.4.1` to `1.4.7` to address this [Synk](https://security.snyk.io/vuln/SNYK-JS-FINDPROCESS-1090284) security vulnerability. Addressed in [#26906](https://github.com/cypress-io/cypress/pull/26906).
- Upgraded [`firefox-profile`](https://www.npmjs.com/package/firefox-profile) from `4.0.0` to `4.3.2` to address security vulnerabilities within sub-dependencies. Addressed in [#26912](https://github.com/cypress-io/cypress/pull/26912).

## 12.13.0

_Released 05/23/2023_

**Features:**

- Adds Git-related messages for the [Runs page](https://docs.cypress.io/guides/core-concepts/cypress-app#Runs) and [Debug page](https://docs.cypress.io/guides/cloud/runs#Debug) when users aren't using Git or there are no recorded runs for the current branch. Addresses [#26680](https://github.com/cypress-io/cypress/issues/26680).

**Bugfixes:**

- Reverted [#26452](https://github.com/cypress-io/cypress/pull/26452) which introduced a bug that prevents users from using End to End with Yarn 3. Fixed in [#26735](https://github.com/cypress-io/cypress/pull/26735). Fixes [#26676](https://github.com/cypress-io/cypress/issues/26676).
- Moved `types` condition to the front of `package.json#exports` since keys there are meant to be order-sensitive. Fixed in [#26630](https://github.com/cypress-io/cypress/pull/26630).
- Fixed an issue where newly-installed dependencies would not be detected during Component Testing setup. Addresses [#26685](https://github.com/cypress-io/cypress/issues/26685).
- Fixed a UI regression that was flashing an "empty" state inappropriately when loading the Debug page. Fixed in [#26761](https://github.com/cypress-io/cypress/pull/26761).
- Fixed an issue in Component Testing setup where TypeScript version 5 was not properly detected. Fixes [#26204](https://github.com/cypress-io/cypress/issues/26204).

**Misc:**

- Updated styling & content of Cypress Cloud slideshows when not logged in or no runs have been recorded. Addresses [#26181](https://github.com/cypress-io/cypress/issues/26181).
- Changed the nomenclature of 'processing' to 'compressing' when terminal video output is printed during a run. Addresses [#26657](https://github.com/cypress-io/cypress/issues/26657).
- Changed the nomenclature of 'Upload Results' to 'Uploading Screenshots & Videos' when terminal output is printed during a run. Addresses [#26759](https://github.com/cypress-io/cypress/issues/26759).

## 12.12.0

_Released 05/09/2023_

**Features:**

- Added a new informational banner to help get started with component testing from an existing end-to-end test suite. Addresses [#26511](https://github.com/cypress-io/cypress/issues/26511).

**Bugfixes:**

- Fixed an issue in Electron where devtools gets out of sync with the DOM occasionally. Addresses [#15932](https://github.com/cypress-io/cypress/issues/15932).
- Updated the Chromium renderer process crash message to be more terse. Addressed in [#26597](https://github.com/cypress-io/cypress/pull/26597).
- Fixed an issue with `CYPRESS_DOWNLOAD_PATH_TEMPLATE` regex to allow multiple replacements. Addresses [#23670](https://github.com/cypress-io/cypress/issues/23670).
- Moved `types` condition to the front of `package.json#exports` since keys there are meant to be order-sensitive. Fixed in [#26630](https://github.com/cypress-io/cypress/pull/26630).

**Dependency Updates:**

- Upgraded [`plist`](https://www.npmjs.com/package/plist) from `3.0.5` to `3.0.6` to address [CVE-2022-26260](https://nvd.nist.gov/vuln/detail/CVE-2022-22912#range-8131646) NVD security vulnerability. Addressed in [#26631](https://github.com/cypress-io/cypress/pull/26631).
- Upgraded [`engine.io`](https://www.npmjs.com/package/engine.io) from `6.2.1` to `6.4.2` to address [CVE-2023-31125](https://github.com/socketio/engine.io/security/advisories/GHSA-q9mw-68c2-j6m5) NVD security vulnerability. Addressed in [#26664](https://github.com/cypress-io/cypress/pull/26664).
- Upgraded [`@vue/test-utils`](https://www.npmjs.com/package/@vue/test-utils) from `2.0.2` to `2.3.2`. Addresses [#26575](https://github.com/cypress-io/cypress/issues/26575).

## 12.11.0

_Released 04/26/2023_

**Features:**

- Adds Component Testing support for Angular 16. Addresses [#26044](https://github.com/cypress-io/cypress/issues/26044).
- The run navigation component on the [Debug page](https://on.cypress.io/debug-page) will now display a warning message if there are more relevant runs than can be displayed in the list. Addresses [#26288](https://github.com/cypress-io/cypress/issues/26288).

**Bugfixes:**

- Fixed an issue where setting `videoCompression` to `0` would cause the video output to be broken. `0` is now treated as false. Addresses [#5191](https://github.com/cypress-io/cypress/issues/5191) and [#24595](https://github.com/cypress-io/cypress/issues/24595).
- Fixed an issue on the [Debug page](https://on.cypress.io/debug-page) where the passing run status would appear even if the Cypress Cloud organization was over its monthly test result limit. Addresses [#26528](https://github.com/cypress-io/cypress/issues/26528).

**Misc:**

- Cleaned up our open telemetry dependencies, reducing the size of the open telemetry modules. Addressed in [#26522](https://github.com/cypress-io/cypress/pull/26522).

**Dependency Updates:**

- Upgraded [`vue`](https://www.npmjs.com/package/vue) from `3.2.31` to `3.2.47`. Addressed in [#26555](https://github.com/cypress-io/cypress/pull/26555).

## 12.10.0

_Released 04/17/2023_

**Features:**

- The Component Testing setup wizard will now show a warning message if an issue is encountered with an installed [third party framework definition](https://on.cypress.io/component-integrations). Addresses [#25838](https://github.com/cypress-io/cypress/issues/25838).

**Bugfixes:**

- Capture the [Azure](https://azure.microsoft.com/) CI provider's environment variable [`SYSTEM_PULLREQUEST_PULLREQUESTNUMBER`](https://learn.microsoft.com/en-us/azure/devops/pipelines/build/variables?view=azure-devops&tabs=yaml#system-variables-devops-services) to display the linked PR number in the Cloud. Addressed in [#26215](https://github.com/cypress-io/cypress/pull/26215).
- Fixed an issue in the onboarding wizard where project framework & bundler would not be auto-detected when opening directly into component testing mode using the `--component` CLI flag. Fixes [#22777](https://github.com/cypress-io/cypress/issues/22777) and [#26388](https://github.com/cypress-io/cypress/issues/26388).
- Updated to use the `SEMAPHORE_GIT_WORKING_BRANCH` [Semphore](https://docs.semaphoreci.com) CI environment variable to correctly associate a Cloud run to the current branch. Previously this was incorrectly associating a run to the target branch. Fixes [#26309](https://github.com/cypress-io/cypress/issues/26309).
- Fix an edge case in Component Testing where a custom `baseUrl` in `tsconfig.json` for Next.js 13.2.0+ is not respected. This was partially fixed in [#26005](https://github.com/cypress-io/cypress/pull/26005), but an edge case was missed. Fixes [#25951](https://github.com/cypress-io/cypress/issues/25951).
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
