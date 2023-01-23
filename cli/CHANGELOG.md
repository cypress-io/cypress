 <!-- See the ../guides/writing-the-cypress-changelog.md for details on writing the changelog. -->
## 12.4.0

__Released 01/17/2023 (PENDING)__

**Features:**

- Introduced a new new experimental flag, called [`experimentalSkipDomainInjection`](/guides/references/experiments#experimental-skip-domain-injection), to disable Cypress from setting `document.domain` on injection of any pages that url hostname matches the array of string or glob pattern provided. When there is a match, all subdomain navigation and cross-origin navigation that matches this configuration, will require the use of [`cy.origin()`](/api/commands/origin) interact with the page. This option was added resolve known issues observed in testing Google and Salesforce applications. Addresses [#2367](https://github.com/cypress-io/cypress/issues/2367), [#23958](https://github.com/cypress-io/cypress/issues/23958), [#24290](https://github.com/cypress-io/cypress/issues/24290) and [#24418](https://github.com/cypress-io/cypress/issues/24418).
- Utilize a JSX/TSX file extension when generating a new empty spec file if project contains at least one file with those extensions. This applies only to component testing and is skipped if [`component.specPattern`](/api/commands/session) has been configured to exclude files with those extensions. Addresses [#24495](https://github.com/cypress-io/cypress/issues/24495).

 <!-- this was reverted https://github.com/cypress-io/cypress/pull/25445
      ...changelog changes likely don't cover this scenario.
  - <Insert change details>. Addressed in [#24760](https://github.com/cypress-io/cypress/pull/24760).
  -->

**Bugfixes:**

-  Fixed an issue with Component Testing project setup which could incorrectly treat new major versions of [`webpack`](https://www.npmjs.com/package/webpack), [`typescript`](https://www.npmjs.com/package/typescript), [`@angular/cli`](https://www.npmjs.com/package/@angular/cli), [`@angular-devkit/build-angular`](https://www.npmjs.com/package/@angular-devkit/build-angular), [`@angular/core`](https://www.npmjs.com/package/@angular/core), [`@angular/common`](https://www.npmjs.com/package/@angular/common) and [`@angular/platform-browser-dynamic`](https://www.npmjs.com/package/@angular/platform-browser-dynamic) as supported. Fixes [#25379](https://github.com/cypress-io/cypress/issues/25379).
- Fixed a formatting issue where spaces and tabs on newlines in Command Log text were not maintained. Fixes [#23679](https://github.com/cypress-io/cypress/issues/23679).
