<!-- See the ../guides/writing-the-cypress-changelog.md for details on writing the changelog. -->
## 13.15.1

_Released 10/1/2024 (PENDING)_

**Bugfixes:**

- Patched [find-process](https://github.com/yibn2008/find-process) to fix an issue where trying to clean up browser profiles can throw an error on Windows. Addresses [#30378](https://github.com/cypress-io/cypress/issues/30378).

**Misc:**

- Cypress now consumes [geckodriver](https://firefox-source-docs.mozilla.org/testing/geckodriver/index.html) to help automate the Firefox browser instead of [marionette-client](https://github.com/cypress-io/marionette-client). Addresses [#30217](https://github.com/cypress-io/cypress/issues/30217).
- Pass spec information to protocol's `beforeSpec` to improve troubleshooting when reporting on errors. Addressed in [#30316](https://github.com/cypress-io/cypress/pull/30316).

**Dependency Updates:**

- Updated `simple-git` from `3.16.0` to `3.25.0`. Addressed in [#30076](https://github.com/cypress-io/cypress/pull/30076).

## 13.15.0

_Released 9/25/2024_

**Features:**

- Cypress now displays more actionable errors when a Test Replay upload takes too long, and more verbose messages when uncategorized errors occur during the upload process. Addressed in [#30235](https://github.com/cypress-io/cypress/pull/30235).

**Bugfixes:**

- Fixed an issue where Firefox was incorrectly mutating the state of click events on checkboxes after Firefox version `129` and up. Addressed in [#30245](https://github.com/cypress-io/cypress/pull/30245).
- Fixed a regression introduced in 13.13.0 where 'Open in IDE' would not work for filepaths containing spaces and various other characters on Windows. Addresses [#29820](https://github.com/cypress-io/cypress/issues/29820).

**Misc:**

- Pass along the related log to the `createSnapshot` function for protocol usage. Addressed in [#30244](https://github.com/cypress-io/cypress/pull/30244).

**Dependency Updates:**

- Update `@cypress/request` from `3.0.1` to `3.0.4`. Addressed in [#30194](https://github.com/cypress-io/cypress/pull/30194).
- Updated `express` from `4.19.2` to `4.21.0`. This removes the [CVE-2024-43796](https://www.cve.org/CVERecord?id=CVE-2024-43796), [CVE-2024-45590](https://www.cve.org/CVERecord?id=CVE-2024-45590), and [CVE-2024-43800](https://www.cve.org/CVERecord?id=CVE-2024-43800) vulnerabilities being reported in security scans. Addresses [#30241](https://github.com/cypress-io/cypress/pull/30241).
- Update `launch-editor` from `2.8.0` to `2.9.1`. Addressed in [#30247](https://github.com/cypress-io/cypress/pull/30247).
- Updated `loader-utils` from `1.4.0` to `1.4.2`. This removes the [CVE-2022-37601](https://nvd.nist.gov/vuln/detail/CVE-2022-37601) vulnerability being reported in security scans. Addresses [#28208](https://github.com/cypress-io/cypress/issues/28208).
- Updated `send` from `0.17.1` to `0.19.0`. This removes the [CVE-2024-43799](https://www.cve.org/CVERecord?id=CVE-2024-43799) vulnerability being reported in security scans. Addressed in [#30241](https://github.com/cypress-io/cypress/pull/30241).

## 13.14.2

_Released 9/4/2024_

**Bugfixes:**

- Fixed an issue where Cypress could crash with a `WebSocket Connection Closed` error. Fixes [#30100](https://github.com/cypress-io/cypress/issues/30100).
- Fixed an issue where `cy.screenshot()` was timing out and Cypress was failing to start due to `GLib-GIO-ERROR` error. Reverts [#30109](https://github.com/cypress-io/cypress/pull/30109), the change to allow HiDPI screen for Wayland users. Fixes [#30172](https://github.com/cypress-io/cypress/issues/30172) and [#30160](https://github.com/cypress-io/cypress/issues/30160).

## 13.14.1

_Released 8/29/2024_

**Bugfixes:**

- Fixed an issue where no description was available for the `experimentalJustInTimeCompile` feature inside the Cypress application settings page. Addresses [#30126](https://github.com/cypress-io/cypress/issues/30126).

## 13.14.0

_Released 8/27/2024_

**Performance:**

- Fixed a potential memory leak in the Cypress server when re-connecting to an unintentionally disconnected CDP connection. Fixes [#29744](https://github.com/cypress-io/cypress/issues/29744). Addressed in [#29988](https://github.com/cypress-io/cypress/pull/29988).

**Features:**

- Added new
  [`experimentalJustInTimeCompile`](https://docs.cypress.io/guides/references/experiments#Configuration)
  configuration option for component testing. This option will only compile resources directly related to your spec, compiling them 'just-in-time' before spec execution. This should result in improved memory management and performance for component tests in `cypress open` and `cypress run` modes, in particular for large component testing suites. [`experimentalJustInTimeCompile`](https://docs.cypress.io/guides/references/experiments#Configuration) is currently supported for [`webpack`](https://www.npmjs.com/package/webpack) and [`vite`](https://www.npmjs.com/package/vite). Addresses [#29244](https://github.com/cypress-io/cypress/issues/29244).
- `.type({upArrow})` and `.type({downArrow})` now also works for date, month, week, time, datetime-local and range input types. Addresses [#29665](https://github.com/cypress-io/cypress/issues/29665).
- Added a `CYPRESS_SKIP_VERIFY` flag to enable suppressing Cypress verification checks. Addresses [#22243](https://github.com/cypress-io/cypress/issues/22243).
- Updated the protocol to allow making Cloud API requests. Addressed in [#30066](https://github.com/cypress-io/cypress/pull/30066).
- Passing `--browser` flag alone will automatically launch browser after being guided through project and/or testing type selection. Addressed in [#28538](https://github.com/cypress-io/cypress/pull/28538).

**Bugfixes:**

- Fixed an issue where files outside the Cypress project directory were not calculating the bundle output path correctly for the `file:preprocessor`. Addresses [#8599](https://github.com/cypress-io/cypress/issues/8599).
- Fixed an issue where Cypress would not run if Node.js version `22.7.0` was being used with TypeScript and ES Modules. Fixes [#30084](https://github.com/cypress-io/cypress/issues/30084).
- Correctly determines current browser family when choosing between `unload` and `pagehide` options in App Runner. Fixes [#29880](https://github.com/cypress-io/cypress/issues/29880).

**Misc:**

- Allow HiDPI screen running Wayland to use Cypress window/browser by adding `--ozone-platform-hint=auto` flag to Electron's runtime argument. Addresses [#20891](https://github.com/cypress-io/cypress/issues/20891).

**Dependency Updates:**

- Updated `detect-port` from `1.3.0` to `1.6.1`. Addressed in [#30038](https://github.com/cypress-io/cypress/pull/30038).

## 13.13.3

_Released 8/14/2024_

**Bugfixes:**

- A console error will no longer display in Chrome about a deprecated unload call originating from jQuery. Addressed in [#29944](https://github.com/cypress-io/cypress/pull/29944).
- Fixed an issue where certain Test Replay upload error messages were too vague. Connection failures now report the precise system error, and the stall error message is reported rather than the vague, "The user aborted a request." Addressed in [#29959](https://github.com/cypress-io/cypress/pull/29959).

**Misc:**

- Updated `cypress open` hints displayed after Cypress binary install. Addresses [#29935](https://github.com/cypress-io/cypress/issues/29935).

**Dependency Updates:**

- Updated `image-size` from `0.8.3` to `1.1.1`. Addressed in [#30023](https://github.com/cypress-io/cypress/pull/30023).

## 13.13.2

_Released 7/31/2024_

**Performance:**

- Fixed a memory leak with command logs with Test Replay enabled. Addressed in [#29939](https://github.com/cypress-io/cypress/pull/29939).
- Improved performance of `reduce` in a method within our proxy. Addressed in [#29887](https://github.com/cypress-io/cypress/pull/29887).

**Bugfixes:**

- Fixed an issue where Yarn PnP was not working correctly with Cypress and `@cypress/webpack-batteries-included-preprocessor`. Fixes [#27947](https://github.com/cypress-io/cypress/issues/27947).

**Dependency Updates:**

- Updated `@cypress/request` from `3.0.0` to `3.0.1`. Addresses [#29863](https://github.com/cypress-io/cypress/issues/29863).
- Updated `chrome-remote-interface` from `0.33.0` to `0.33.2`. Addressed in [#29932](https://github.com/cypress-io/cypress/pull/29932).
- Updated `mime` from `2.4.4` to `2.6.0`. Addressed in [#29870](https://github.com/cypress-io/cypress/pull/29870).
- Updated `strip-ansi` from `6.0.0` to `6.0.1`. Addressed in [#29931](https://github.com/cypress-io/cypress/pull/29931).

## 13.13.1

_Released 7/16/2024_

**Bugfixes:**

- Fixed an issue where unhandled `WebSocket connection closed` exceptions would be thrown when CDP connections rapidly connect, disconnect, and connect again while there are pending commands. Fixes [#29572](https://github.com/cypress-io/cypress/issues/29572).
- CLI output properly displays non-JSON response bodies when a Test Replay upload attempt returns a non-JSON response body for a non-200 status code. Addressed in [#29801](https://github.com/cypress-io/cypress/pull/29801).
- Fixed an issue where the ReadStream used to upload a Test Replay recording could erroneously be re-used when retrying in cases of retryable upload failures. Fixes [#29227](https://github.com/cypress-io/cypress/issues/29227).
- Fixed an issue where command snapshots were not being captured within the `cy.origin()` command within Test Replay. Addressed in [#29828](https://github.com/cypress-io/cypress/pull/29828).

**Dependency Updates:**

- Updated `jquery` from `3.1.1` to `3.4.1`. Addresses [#29822](https://github.com/cypress-io/cypress/issues/29822). Addressed in [#29837](https://github.com/cypress-io/cypress/pull/29837).
- Replaced `json-lint` with `json-parse-even-better-errors`. This removes the [CVE-2021-23358](https://nvd.nist.gov/vuln/detail/CVE-2021-23358) vulnerability being reported in security scans. Addresses [#28207](https://github.com/cypress-io/cypress/issues/28207).
- Updated `minimatch` from `3.0.4` to `3.1.2`. Addressed in [#29821](https://github.com/cypress-io/cypress/pull/29821).

## 13.13.0

_Released 7/01/2024_

**Performance:**

- Improved performance of `experimentalSourceRewriting` option. Fixed in [#29540](https://github.com/cypress-io/cypress/pull/29540).

**Features:**

- Adds Signal support for Angular Component Testing versions 17.2 and up. Addresses [#29264](https://github.com/cypress-io/cypress/issues/29264).

**Bugfixes:**

- Fixed an issue where Chrome launch instances would not recreate the browser CRI client correctly after recovering from an unexpected browser closure. Fixes [#27657](https://github.com/cypress-io/cypress/issues/27657). Fixed in [#29663](https://github.com/cypress-io/cypress/pull/29663).
- Fixed an issue where Firefox 129 (Firefox Nightly) would not launch with Cypress. Fixes [#29713](https://github.com/cypress-io/cypress/issues/29713). Fixed in [#29720](https://github.com/cypress-io/cypress/pull/29720).

**Dependency Updates:**

- Updated `launch-editor` from `2.3.0` to `2.8.0`. Addressed in [#29770](https://github.com/cypress-io/cypress/pull/29770).
- Updated `memfs` from `3.4.12` to `3.5.3`. Addressed in [#29746](https://github.com/cypress-io/cypress/pull/29746).
- Updated `tmp` from `0.2.1` to `0.2.3`. Addresses [#29693](https://github.com/cypress-io/cypress/issues/29693).
- Updated `ws` from `5.2.3` to `5.2.4`. Addressed in [#29698](https://github.com/cypress-io/cypress/pull/29698).

## 13.12.0

_Released 6/18/2024_

**Features:**

- Added Component Testing support for Angular version 18. Addresses [#29309](https://github.com/cypress-io/cypress/issues/29309).

**Bugfixes:**

- We now trigger `input` and `change` events when typing `{upArrow}` and `{downArrow}` via `.type()` on `input[type=number]` elements. Fixes [#29611](https://github.com/cypress-io/cypress/issues/29611)
- Fixed an issue where auto scrolling the reporter would sometimes be disabled without the user's intent. Fixes [#25084](https://github.com/cypress-io/cypress/issues/25084).
- Fixed an issue where `inlineSourceMaps` was still being used when `sourceMaps` was provided in a users typescript config for typescript version 5. Fixes [#26203](https://github.com/cypress-io/cypress/issues/26203).
- When capture protocol script fails verification, an appropriate error is now displayed. Previously, an error regarding Test Replay archive location was shown. Addressed in [#29603](https://github.com/cypress-io/cypress/pull/29603).
- Fixed an issue where receiving HTTP responses with invalid headers raised an error. Now cypress removes the invalid headers and gives a warning in the console with debug mode on. Fixes [#28865](https://github.com/cypress-io/cypress/issues/28865).

**Misc:**

- Report afterSpec durations to Cloud API when running in record mode with Test Replay enabled. Addressed in [#29500](https://github.com/cypress-io/cypress/pull/29500).

**Dependency Updates:**

- Updated firefox-profile from `4.3.1` to `4.6.0`. Addressed in [#29662](https://github.com/cypress-io/cypress/pull/29662).
- Updated typescript from `4.7.4` to `5.3.3`. Addressed in [#29568](https://github.com/cypress-io/cypress/pull/29568).
- Updated url-parse from `1.5.9` to `1.5.10`. Addressed in [#29650](https://github.com/cypress-io/cypress/pull/29650).

## 13.11.0

_Released 6/4/2024_

**Performance:**

- Improved performance when setting console props within `Cypress.log`. Addressed in [#29501](https://github.com/cypress-io/cypress/pull/29501).

**Features:**

- Added support for [Next.js 14](https://nextjs.org/blog/next-14) for component testing. Addresses [#28185](https://github.com/cypress-io/cypress/issues/28185).
- Added an `IGNORE_CHROME_PREFERENCES` environment variable to ignore Chrome preferences when launching Chrome. Addresses [#29330](https://github.com/cypress-io/cypress/issues/29330).

**Bugfixes:**

- Fixed a situation where the Launchpad would hang if the project config had not been loaded when the Launchpad first queries the current project. Fixes [#29486](https://github.com/cypress-io/cypress/issues/29486).
- Pre-emptively fix behavior with Chrome for when `unload` events are forcefully deprecated by using `pagehide` as a proxy. Fixes [#29241](https://github.com/cypress-io/cypress/issues/29241).


**Misc:**

- Enhanced the type definitions available to `cy.intercept` and `cy.wait`. The `body` property of both the request and response in an interception can optionally be specified with user-defined types. Addresses [#29507](https://github.com/cypress-io/cypress/issues/29507).

## 13.10.0

_Released 5/21/2024_

**Features:**

- Added support for `vite` `v5` to `@cypress/vite-dev-server`. Addresses [#28347](https://github.com/cypress-io/cypress/issues/28347).

**Bugfixes:**

- Fixed an issue where orphaned Electron processes were inadvertently terminating the browser's CRI client. Fixes [#28397](https://github.com/cypress-io/cypress/issues/28397). Fixed in [#29515](https://github.com/cypress-io/cypress/pull/29515).
- Fixed an issue where Cypress would use the wrong URL to upload Test Replay recordings when it wasn't able to determine the upload URL. It now displays an error when the upload URL cannot be determined, rather than a "Request Entity Too Large" error. Addressed in [#29512](https://github.com/cypress-io/cypress/pull/29512).
- Fixed an issue where Cypress was unable to search in the Specs list for files or folders containing numbers. Fixes [#29034](https://github.com/cypress-io/cypress/issues/29034).
- Fixed an issue setting the `x-cypress-file-path` header when there are invalid header characters in the file path. Fixes [#25839](https://github.com/cypress-io/cypress/issues/25839).
- Fixed the display of some command assertions. Fixed in [#29517](https://github.com/cypress-io/cypress/pull/29517).

**Dependency Updates:**

- Updated js-cookie from `2.2.1` to `3.0.5`. Addressed in [#29497](https://github.com/cypress-io/cypress/pull/29497).
- Updated randomstring from `1.1.5` to `1.3.0`. Addressed in [#29503](https://github.com/cypress-io/cypress/pull/29503).

## 13.9.0

_Released 5/7/2024_

**Features:**

- Added more descriptive error messages when Test Replay fails to record or upload. Addresses [#29022](https://github.com/cypress-io/cypress/issues/29022).

**Bugfixes:**

- Fixed a bug where promises rejected with `undefined` were failing inside `cy.origin()`. Addresses [#23937](https://github.com/cypress-io/cypress/issues/23937).
- We now pass the same default Chromium flags to Electron as we do to Chrome. As a result of this change, the application under test's `navigator.webdriver` property will now correctly be `true` when testing in Electron. Fixes [#27939](https://github.com/cypress-io/cypress/issues/27939).
- Fixed network issues in requests using fetch for users where Cypress is run behind a proxy that performs HTTPS decryption (common among corporate proxies). Fixes [#29171](https://github.com/cypress-io/cypress/issues/29171).
- Fixed an issue where extra windows weren't being closed between specs in Firefox causing potential issues in subsequent specs. Fixes [#29473](https://github.com/cypress-io/cypress/issues/29473).

**Misc:**

- Improved accessibility of the Cypress App in some areas. Addressed in [#29322](https://github.com/cypress-io/cypress/pull/29322).

**Dependency Updates:**

- Updated electron from `27.1.3` to `27.3.10` to address [CVE-2024-3156](https://nvd.nist.gov/vuln/detail/CVE-2024-3156). Addressed in [#29431](https://github.com/cypress-io/cypress/pull/29431).

## 13.8.1

_Released 4/23/2024_

**Performance:**

- Fixed a performance issue with activated service workers that aren't controlling clients which could lead to correlation timeouts. Fixes [#29333](https://github.com/cypress-io/cypress/issues/29333) and [#29126](https://github.com/cypress-io/cypress/issues/29126).

**Bugfixes:**

- Fixed a regression introduced in [`13.6.0`](https://docs.cypress.io/guides/references/changelog#13-6-0) where Cypress would occasionally exit with status code 1, even when a test run was successful, due to an unhandled WebSocket exception (`Error: WebSocket connection closed`). Addresses [#28523](https://github.com/cypress-io/cypress/issues/28523).
- Fixed an issue where Cypress would hang on some commands when an invalid `timeout` option was provided. Fixes [#29323](https://github.com/cypress-io/cypress/issues/29323).

**Misc:**

- `.its()` type now excludes null and undefined. Fixes [#28872](https://github.com/cypress-io/cypress/issues/28872).

**Dependency Updates:**

- Updated zod from `3.20.3` to `3.22.5`. Addressed in [#29367](https://github.com/cypress-io/cypress/pull/29367).

## 13.8.0

_Released 4/18/2024_

**Features:**

- Added support for `webpack-dev-server` `v5` to `@cypress/webpack-dev-server`. Addresses [#29305](https://github.com/cypress-io/cypress/issues/29305).

**Bugfixes:**

- Fixed a regression introduced in [`13.7.3`](https://docs.cypress.io/guides/references/changelog#13-7-3) where Cypress could hang handling long assertion messages. Fixes [#29350](https://github.com/cypress-io/cypress/issues/29350).

**Misc:**

- The [`SEMAPHORE_GIT_PR_NUMBER`](https://docs.semaphoreci.com/ci-cd-environment/environment-variables/#semaphore_git_pr_number) environment variable from [Semaphore](https://semaphoreci.com/) CI is now captured to display the linked PR number in the Cloud. Addressed in [#29314](https://github.com/cypress-io/cypress/pull/29314).

## 13.7.3

_Released 4/11/2024_

**Bugfixes:**

- Fixed an issue where asserts with custom messages weren't displaying properly. Fixes [#29167](https://github.com/cypress-io/cypress/issues/29167).
- Fixed and issue where Cypress launch arguments were not being escaped correctly with multiple values inside quotes. Fixes [#27454](https://github.com/cypress-io/cypress/issues/27454).

**Misc:**

- Updated the Chrome flags to not show the "Enhanced Ad Privacy" dialog. Addresses [#29199](https://github.com/cypress-io/cypress/issues/29199).
- Suppresses benign warnings that reference Vulkan on GPU-less hosts. Addresses [#29085](https://github.com/cypress-io/cypress/issues/29085). Addressed in [#29278](https://github.com/cypress-io/cypress/pull/29278).

## 13.7.2

_Released 4/2/2024_

**Performance:**

- Improvements to Test Replay upload resiliency. Fixes [#28890](https://github.com/cypress-io/cypress/issues/28890). Addressed in [#29174](https://github.com/cypress-io/cypress/pull/29174)

**Bugfixes:**

- Fixed an issue where Cypress was not executing beyond the first spec in `cypress run` for versions of Firefox 124 and up when a custom user agent was provided. Fixes [#29190](https://github.com/cypress-io/cypress/issues/29190).
- Fixed a bug where fields using arrays in `cypress.config` are not correctly processed. Fixes [#27103](https://github.com/cypress-io/cypress/issues/27103). Fixed in [#27312](https://github.com/cypress-io/cypress/pull/27312).
- Fixed a hang where Cypress would run indefinitely while recording to the cloud when CDP disconnects during the middle of a test. Fixes [#29209](https://github.com/cypress-io/cypress/issues/29209).
- Fixed a bug where option values containing quotation marks could not be selected. Fixes [#29213](https://github.com/cypress-io/cypress/issues/29213)

**Dependency Updates:**

- Updated express from `4.17.3` to `4.19.2`. Addressed in [#29211](https://github.com/cypress-io/cypress/pull/29211).

## 13.7.1

_Released 3/21/2024_

**Bugfixes:**

- Fixed an issue where Cypress was not executing beyond the first spec in `cypress run` for versions of Firefox 124 and up. Fixes [#29172](https://github.com/cypress-io/cypress/issues/29172).
- Fixed an issue blurring shadow dom elements. Fixed in [#29125](https://github.com/cypress-io/cypress/pull/29125).

**Dependency Updates:**

- Updated jose from `4.11.2` to `4.15.5`. Addressed in [#29086](https://github.com/cypress-io/cypress/pull/29086).

## 13.7.0

_Released 3/13/2024_

**Features:**

- Added shadow DOM snapshot support within Test Replay in order to highlight elements correctly within the Cypress reporter. Addressed in [#28823](https://github.com/cypress-io/cypress/pull/28823).
- Added TypeScript support for [Vue 2.7+](https://github.com/vuejs/vue/blob/main/CHANGELOG.md#270-2022-07-01). Addresses [#28591](https://github.com/cypress-io/cypress/issues/28591).
- Adds additional context to error messages displayed when Test Replay artifacts fail to upload. Addressed in [#28986](https://github.com/cypress-io/cypress/pull/28986)

**Performance:**

- Fixed a performance regression from [`13.6.3`](https://docs.cypress.io/guides/references/changelog#13-6-3) where unhandled service worker requests may not correlate correctly. Fixes [#28868](https://github.com/cypress-io/cypress/issues/28868).
- Reduces the number of attempts to retry failed Test Replay artifact uploads from 8 to 3, to reduce time spent on artifact upload attempts that will not succeed. Addressed in [#28986](https://github.com/cypress-io/cypress/pull/28986)

**Bugfixes:**

- Changed screenshot capture behavior in Chromium to activate the main Cypress tab before capturing. This prevents screenshot capture from timing out in certain situations. Fixed in [#29038](https://github.com/cypress-io/cypress/pull/29038). Fixes [#5016](https://github.com/cypress-io/cypress/issues/5016)
- Fixed an issue where `.click()` commands on children of disabled elements would still produce "click" events -- even without `{ force: true }`. Fixes [#28788](https://github.com/cypress-io/cypress/issues/28788).
- Changed RequestBody type to allow for boolean and null literals to be passed as body values. [#28789](https://github.com/cypress-io/cypress/issues/28789)

**Misc:**

- Changed Component Testing scaffolding instruction to `pnpm add` to add framework dependencies when a project uses pnpm as package manager. Addresses [#29052](https://github.com/cypress-io/cypress/issues/29052).
- Command messages in the Cypress command logs will now truncate display at 100 lines instead of 50. Fixes [#29023](https://github.com/cypress-io/cypress/issues/29023).
- Capture the `beforeTest` timestamp inside the browser for the purposes of accurately determining test start for Test Replay. Addressed in [#29061](https://github.com/cypress-io/cypress/pull/29061).

**Dependency Updates:**

- Updated jimp from `0.14.0` to `0.22.12`. Addressed in [#29055](https://github.com/cypress-io/cypress/pull/29055).
- Updated http-proxy-middleware from `2.0.4` to `2.0.6`. Addressed in [#28902](https://github.com/cypress-io/cypress/pull/28902).
- Updated signal-exit from `3.0.3` to `3.0.7`. Addressed in [#28979](https://github.com/cypress-io/cypress/pull/28979).

## 13.6.6

_Released 2/22/2024_

**Bugfixes:**

- Fixed an issue where `cypress verify` was failing for `nx` users. Fixes [#28982](https://github.com/cypress-io/cypress/issues/28982).

## 13.6.5

_Released 2/20/2024_

**Bugfixes:**

- Fixed tests hanging when the Chrome browser extension is disabled. Fixes [#28392](https://github.com/cypress-io/cypress/issues/28392).
- Fixed an issue which caused the browser to relaunch after closing the browser from the Launchpad. Fixes [#28852](https://github.com/cypress-io/cypress/issues/28852).
- Fixed an issue with the unzip promise never being rejected when an empty error happens. Fixed in [#28850](https://github.com/cypress-io/cypress/pull/28850).
- Fixed a regression introduced in [`13.6.3`](https://docs.cypress.io/guides/references/changelog#13-6-3) where Cypress could crash when processing service worker requests through our proxy. Fixes [#28950](https://github.com/cypress-io/cypress/issues/28950).
- Fixed incorrect type definition of `dom.getContainsSelector`. Fixed in [#28339](https://github.com/cypress-io/cypress/pull/28339).

**Misc:**

- Improved accessibility of the Cypress App in some areas. Addressed in [#28774](https://github.com/cypress-io/cypress/pull/28774).
- Changed references of LayerCI to webapp.io. Addressed in [#28874](https://github.com/cypress-io/cypress/pull/28874).

**Dependency Updates:**

- Upgraded `electron` from `25.8.4` to `27.1.3`.
- Upgraded bundled Node.js version from `18.15.0` to `18.17.0`.
- Upgraded bundled Chromium version from `114.0.5735.289` to `118.0.5993.117`.
- Updated buffer from `5.6.0` to `5.7.1`. Addressed in [#28934](https://github.com/cypress-io/cypress/pull/28934).
- Updated [`duplexify`](https://www.npmjs.com/package/duplexify) from `4.1.1` to `4.1.2`. Addressed in [#28941](https://github.com/cypress-io/cypress/pull/28941).
- Updated [`is-ci`](https://www.npmjs.com/package/is-ci) from `3.0.0` to `3.0.1`. Addressed in [#28933](https://github.com/cypress-io/cypress/pull/28933).

## 13.6.4

_Released 1/30/2024_

**Performance:**

- Fixed a performance regression from [`13.3.2`](https://docs.cypress.io/guides/references/changelog#13.3.2) where aborted requests may not correlate correctly. Fixes [#28734](https://github.com/cypress-io/cypress/issues/28734).

**Bugfixes:**

- Fixed an issue with capturing assets for Test Replay when service workers are registered in Cypress support files. This issue would cause styles to not render properly in Test Replay. Fixes [#28747](https://github.com/cypress-io/cypress/issues/28747).

**Misc:**

- Added missing properties to the `Cypress.spec` interface for TypeScript users. Addresses [#27835](https://github.com/cypress-io/cypress/issues/27835).

## 13.6.3

_Released 1/16/2024_

**Bugfixes:**

- Force `moduleResolution` to `node` when `typescript` projects are detected to correctly run Cypress. This change should not have a large impact as `commonjs` is already forced when `ts-node` is registered. This fix does not impact the ESM Typescript configuration loader. Fixes [#27731](https://github.com/cypress-io/cypress/issues/27731).
- No longer wait for additional frames when recording a video for a spec that was skipped by the Cloud due to Auto Cancellation. Fixes [#27898](https://github.com/cypress-io/cypress/issues/27898).
- Now `node_modules` will not be ignored if a project path or a provided path to spec files contains it. Fixes [#23616](https://github.com/cypress-io/cypress/issues/23616).
- Updated display of assertions and commands with a URL argument to escape markdown formatting so that values are displayed as is and assertion values display as bold. Fixes [#24960](https://github.com/cypress-io/cypress/issues/24960) and [#28100](https://github.com/cypress-io/cypress/issues/28100).
- When generating assertions via Cypress Studio, the preview of the generated assertions now correctly displays the past tense of 'expected' instead of 'expect'. Fixed in [#28593](https://github.com/cypress-io/cypress/pull/28593).
- Fixed a regression in [`13.6.2`](https://docs.cypress.io/guides/references/changelog#13.6.2) where the `body` element was not highlighted correctly in Test Replay. Fixed in [#28627](https://github.com/cypress-io/cypress/pull/28627).
- Correctly sync `Cypress.currentRetry` with secondary origin so test retries that leverage `cy.origin()` render logs as expected. Fixes [#28574](https://github.com/cypress-io/cypress/issues/28574).
- Fixed an issue where some cross-origin logs, like assertions or cy.clock(), were getting too many dom snapshots. Fixes [#28609](https://github.com/cypress-io/cypress/issues/28609).
- Fixed asset capture for Test Replay for requests that are routed through service workers. This addresses an issue where styles were not being applied properly in Test Replay and `cy.intercept()` was not working properly for requests in this scenario. Fixes [#28516](https://github.com/cypress-io/cypress/issues/28516).
- Fixed an issue where visiting an `http://` site would result in an infinite reload/redirect loop in Chrome 114+. Fixes [#25891](https://github.com/cypress-io/cypress/issues/25891).
- Fixed an issue where requests made from extra tabs do not include their original headers. Fixes [#28641](https://github.com/cypress-io/cypress/issues/28641).
- Fixed an issue where `cy.wait()` would sometimes throw an error reading a property of undefined when returning responses. Fixes [#28233](https://github.com/cypress-io/cypress/issues/28233).

**Performance:**

- Fixed a performance regression from [`13.3.2`](https://docs.cypress.io/guides/references/changelog#13.3.2) where requests may not correlate correctly when test isolation is off. Fixes [#28545](https://github.com/cypress-io/cypress/issues/28545).

**Dependency Updates:**

- Remove dependency on `@types/node` package. Addresses [#28473](https://github.com/cypress-io/cypress/issues/28473).
- Updated [`@cypress/unique-selector`](https://www.npmjs.com/package/@cypress/unique-selector) to include a performance optimization. It's possible this could improve performance of the selector playground. Addressed in [#28571](https://github.com/cypress-io/cypress/pull/28571).
- Replace [`CircularJSON`](https://www.npmjs.com/package/circular-json) with its successor [`flatted`](https://www.npmjs.com/package/flatted) version `3.2.9`. This resolves decoding issues observed in complex objects sent from the browser. Addressed in [#28683](https://github.com/cypress-io/cypress/pull/28683).
- Updated [`better-sqlite3`](https://www.npmjs.com/package/better-sqlite3) from `8.7.0` to `9.2.2` to fix macOS Catalina issues. Addresses [#28697](https://github.com/cypress-io/cypress/issues/28697).

**Misc:**

- Improved accessibility of some areas of the Cypress App. Addressed in [#28628](https://github.com/cypress-io/cypress/pull/28628).
- Updated some documentation links to go through on.cypress.io. Addressed in [#28623](https://github.com/cypress-io/cypress/pull/28623).


## 13.6.2

_Released 12/26/2023_

**Bugfixes:**

- Fixed a regression in [`13.6.1`](https://docs.cypress.io/guides/references/changelog#13.6.1) where a malformed URI would crash Cypress. Fixes [#28521](https://github.com/cypress-io/cypress/issues/28521).
- Fixed a regression in [`12.4.0`](https://docs.cypress.io/guides/references/changelog#12.4.0) where erroneous `<br>` tags were displaying in error messages in the Command Log making them less readable. Fixes [#28452](https://github.com/cypress-io/cypress/issues/28452).

**Performance:**

- Improved performance when finding unique selectors for command log snapshots for Test Replay. Addressed in [#28536](https://github.com/cypress-io/cypress/pull/28536).

**Dependency Updates:**

- Updated ts-node from `10.9.1` to `10.9.2`. Cypress will longer error during `cypress run` or `cypress open` when using Typescript 5.3.2+ with `extends` in `tsconfig.json`. Addresses [#28385](https://github.com/cypress-io/cypress/issues/28385).

## 13.6.1

_Released 12/5/2023_

**Bugfixes:**

- Fixed an issue where pages or downloads opened in a new tab were missing basic auth headers. Fixes [#28350](https://github.com/cypress-io/cypress/issues/28350).
- Fixed an issue where request logging would default the `message` to the `args` of the currently running command even though those `args` would not apply to the request log and are not displayed. If the `args` are sufficiently large (e.g. when running the `cy.task` from the [code-coverage](https://github.com/cypress-io/code-coverage/) plugin) there could be performance/memory implications. Addressed in [#28411](https://github.com/cypress-io/cypress/pull/28411).
- Fixed an issue where commands would fail with the error `must only be invoked from the spec file or support file` if the project's `baseUrl` included basic auth credentials. Fixes [#27457](https://github.com/cypress-io/cypress/issues/27457) and [#28336](https://github.com/cypress-io/cypress/issues/28336).
- Fixed an issue where some URLs would timeout in pre-request correlation. Addressed in [#28427](https://github.com/cypress-io/cypress/pull/28427).
- Cypress will now correctly log errors and debug logs on Linux machines. Fixes [#5051](https://github.com/cypress-io/cypress/issues/5051) and [#24713](https://github.com/cypress-io/cypress/issues/24713).

**Misc:**

- Artifact upload duration is now reported to Cypress Cloud. Fixes [#28238](https://github.com/cypress-io/cypress/issues/28238). Addressed in [#28418](https://github.com/cypress-io/cypress/pull/28418).

## 13.6.0

_Released 11/21/2023_

**Features:**

- Added an activity indicator to CLI output when artifacts (screenshots, videos, or Test Replay) are being uploaded to the cloud. Addresses [#28239](https://github.com/cypress-io/cypress/issues/28239). Addressed in [#28277](https://github.com/cypress-io/cypress/pull/28277).
- When artifacts are uploaded to the Cypress Cloud, the duration of each upload will be displayed in the terminal. Addresses [#28237](https://github.com/cypress-io/cypress/issues/28237).

**Bugfixes:**

- We now allow absolute paths when setting `component.indexHtmlFile` in the Cypress config. Fixes [#27750](https://github.com/cypress-io/cypress/issues/27750).
- Fixed an issue where dynamic intercept aliases now show with alias name instead of "no alias" in driver. Addresses [#24653](https://github.com/cypress-io/cypress/issues/24653)
- Fixed an issue where [aliasing individual requests](https://docs.cypress.io/api/commands/intercept#Aliasing-individual-requests) with `cy.intercept()` led to an error when retrieving all of the aliases with `cy.get(@alias.all)` . Addresses [#25448](https://github.com/cypress-io/cypress/issues/25448)
- The URL of the application under test and command error "Learn more" links now open externally instead of in the Cypress-launched browser. Fixes [#24572](https://github.com/cypress-io/cypress/issues/24572).
- Fixed issue where some URLs would timeout in pre-request correlation. Addressed in [#28354](https://github.com/cypress-io/cypress/pull/28354).

**Misc:**

- Browser tabs and windows other than the Cypress tab are now closed between tests in Chromium-based browsers. Addressed in [#28204](https://github.com/cypress-io/cypress/pull/28204).
- Cypress now ensures the main browser tab is active before running each command in Chromium-based browsers. Addressed in [#28334](https://github.com/cypress-io/cypress/pull/28334).

**Dependency Updates:**

- Upgraded [`chrome-remote-interface`](https://www.npmjs.com/package/chrome-remote-interface) from `0.31.3` to `0.33.0` to increase the max payload from 100MB to 256MB. Addressed in [#27998](https://github.com/cypress-io/cypress/pull/27998).

## 13.5.1

_Released 11/14/2023_

**Bugfixes:**

- Fixed a regression in [`13.5.0`](https://docs.cypress.io/guides/references/changelog#13.5.0) where requests cached within a given spec may take longer to load than they did previously. Addresses [#28295](https://github.com/cypress-io/cypress/issues/28295).
- Fixed an issue where pages opened in a new tab were missing response headers, causing them not to load properly. Fixes [#28293](https://github.com/cypress-io/cypress/issues/28293) and [#28303](https://github.com/cypress-io/cypress/issues/28303).
- We now pass a flag to Chromium browsers to disable default component extensions. This is a common flag passed during browser automation. Fixed in [#28294](https://github.com/cypress-io/cypress/pull/28294).

## 13.5.0

_Released 11/8/2023_

**Features:**

 - Added Component Testing support for [Angular](https://angular.io/) version 17. Addresses [#28153](https://github.com/cypress-io/cypress/issues/28153).

**Bugfixes:**

- Fixed an issue in chromium based browsers, where global style updates can trigger flooding of font face requests in DevTools and Test Replay. This can affect performance due to the flooding of messages in CDP. Fixes [#28150](https://github.com/cypress-io/cypress/issues/28150) and [#28215](https://github.com/cypress-io/cypress/issues/28215).
- Fixed a regression in [`13.3.3`](https://docs.cypress.io/guides/references/changelog#13.3.3) where Cypress would hang on loading shared workers when using `cy.reload` to reload the page. Fixes [#28248](https://github.com/cypress-io/cypress/issues/28248).
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

- Fixed a regression in [`13.3.2`](https://docs.cypress.io/guides/references/changelog#13.3.2) where Cypress would crash with 'Inspected target navigated or closed' or 'Session with given id not found'. Fixes [#28141](https://github.com/cypress-io/cypress/issues/28141) and [#28148](https://github.com/cypress-io/cypress/issues/28148).

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
