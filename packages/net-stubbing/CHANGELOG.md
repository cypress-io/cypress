# @packages/net-stubbing

## 13.7.0

### Minor Changes

- 6571021: **Bugfixes:**

  - No longer wait for additional frames when recording a video for a spec that was skipped by the Cloud due to Auto Cancellation. Fixes [#27898](https://github.com/cypress-io/cypress/issues/27898).
  - Now `node_modules` will not be ignored if a project path or a provided path to spec files contains it. Fixes [#23616](https://github.com/cypress-io/cypress/issues/23616).
  - Updated display of assertions and commands with a URL argument to escape markdown formatting so that values are displayed as is and assertion values display as bold. Fixes [#24960](https://github.com/cypress-io/cypress/issues/24960) and [#28100](https://github.com/cypress-io/cypress/issues/28100).
  - When generating assertions via Cypress Studio, the preview of the generated assertions now correctly displays the past tense of 'expected' instead of 'expect'. Fixed in [#28593](https://github.com/cypress-io/cypress/pull/28593).
  - Fixed a regression in [`13.6.2`](https://docs.cypress.io/guides/references/changelog/13.6.2) where the `body` element was not highlighted correctly in Test Replay. Fixed in [#28627](https://github.com/cypress-io/cypress/pull/28627).
  - Correctly sync `Cypress.currentRetry` with secondary origin so test retries that leverage `cy.origin()` render logs as expected. Fixes [#28574](https://github.com/cypress-io/cypress/issues/28574).
  - Fixed an issue where some cross-origin logs, like assertions or cy.clock(), were getting too many dom snapshots. Fixes [#28609](https://github.com/cypress-io/cypress/issues/28609).
  - Fixed asset capture for Test Replay for requests that are routed through service workers. This addresses an issue where styles were not being applied properly in Test Replay and `cy.intercept` was not working properly for requests in this scenario. Fixes [#28516](https://github.com/cypress-io/cypress/issues/28516).
  - Fixed an issue where visiting an `http://` site would result in an infinite reload/redirect loop in Chrome 114+. Fixes [#25891](https://github.com/cypress-io/cypress/issues/25891).

  **Performance:**

  - Fixed a performance regression from [`13.3.2`](https://docs.cypress.io/guides/references/changelog/13.3.2) where requests may not correlate correctly when test isolation is off. Fixes [#28545](https://github.com/cypress-io/cypress/issues/28545).

  **Dependency Updates:**

  - Remove dependency on `@types/node` package. Addresses [#28473](https://github.com/cypress-io/cypress/issues/28473).
  - Updated `@cypress/unique-selector` to include a performance optimization. It's possible this could improve performance of the selector playground. Addressed in [#28571](https://github.com/cypress-io/cypress/pull/28571).
  - Replace [`CircularJSON`](https://www.npmjs.com/package/circular-json) with its successor [`flatted`](https://www.npmjs.com/package/flatted) version `3.2.9`. This resolves decoding issues observed in complex objects sent from the browser. Addressed in [#28683](https://github.com/cypress-io/cypress/pull/28683).

  **Misc:**

  - Improved accessibility of some areas of the Cypress App. Addressed in [#28628](https://github.com/cypress-io/cypress/pull/28628).
  - Updated some documentation links to go through on.cypress.io. Addressed in [#28623](https://github.com/cypress-io/cypress/pull/28623).
