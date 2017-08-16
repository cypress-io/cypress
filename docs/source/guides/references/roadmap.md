---
title: Roadmap
comments: false
---

# 0.20.0 (Upcoming)

**Features:**

- [x] We have all new docs! Check them out {% url "here" https://docs.cypress.io %}.
- [x] You can now install `cypress` per project as an `npm` package using `npm install cypress`. The installation and use of the {% url "`cypress-cli` npm package" https://www.npmjs.com/package/cypress-cli %} is no longer required.
- [x] New `cy.trigger()` command. Addresses {% issue 406 %}.
- [x] New `cy.scrollTo()` command. Addresses {% issue 497 %} & {% issue 313 %}.
- [x] New `.scrollIntoView()` command. Addresses {% issue 498 %} & {% issue 313 %} & {% issue 519 %}.
- [x] Input ranges are now more easily testable using the new `cy.trigger()` command. See our new recipe for details on how. Addresses {% issue 287 %}.
- [x] Testing drag and drop is now possible using the new `cy.trigger()` command. See our new recipe for details on how. Addresses {% issue 386 %}.
- [x] Update `.click()` command to accept more position arguments. Addresses {% issue 499 %}.
- [x] Add support to {% url `.type()` type %} for inputs of type `date`, `time`, `month`, and `week`. Addresses {% issue 27 %}.
- [x] Update `Cypress._` to use {% url "lodash" https://lodash.com/ %} instead of {% url "Underscore" http://underscorejs.org/ %}. Addresses {% issue 548 %}.
- [x] You can now pass a browser option to `cypress run` as `--browser <browser name>`. Addresses {% issue 462 %}.
- [x] `cypress open` no longer opens a detached process by default. Instead `cypress open` now accepts a new flag `--detached`, which replicates this behavior.
- [x] We have all new {% url "docker examples" docker-images %} you can check out.
- [x] The `cypress` npm package now checks the currently installed version on `install` and `run` and does not re-install Cypress if it is already installed. Addresses {% issue 396 %}.
- [x] We've added a new `Cypress.Commands` interface to handle adding your own custom commands. Addresses {% issue 436 %}.

**Breaking Changes:**

- [x] We've removed the undocumented `cy.chain()` command. You should be able to safely remove this from your code. Addresses {% issue 456 %}.
- [x] If any of an element's parent's overflow is 'hidden', we now calculate if the element is outside of the boundaries of that parent element and validate visibility assertions accordingly. This may cause some tests that were previously passing to now accurately fail. Fixes {% issue 410 %}.
- [x] {% url `.select()` select %} Should Look For Trimmed Value Inside of `<option></option>`. This may change the content argument required to select the option you intended in your {% url `.select()` select %} command. Addresses {% issue 175 %}.
- [x] When passing the option `{ force: true }` to {% url `.click()` click %} and {% url `.type()` type %}, we no longer attempt to scroll the element into view. We've also disabled the check that the element is in view before clicking or typing. Addresses {% issue 553 %}.
- [x] `Cypress.Dom` has been renamed to `Cypress.dom`.

**Deprecations**

- [x] The {% url "`cypress-cli` npm package" https://www.npmjs.com/package/cypress-cli %} has been deprecated. Addresses {% issue 316 %}.
- [ ] The interface for writing custom commands has been deprecated. Please read our docs on the new custom commands interface. Addresses {% issue 436 %} and {% issue 465 %}.
- [x] `Cypress.Log.command` has been renamed to `Cypress.log`.

**Bugfixes:**

- [x] When editing `cypress.json` file, the dead browser page no longer appears. Fixes {% issue 492 %}.
- [x] {% url `.type()` type %} should work on inputs regardless of capitalization of `type` attribute. Fixes {% issue 550 %}.
- [x] Fix issues where {% url `.type()` type %} was not appending text properly. Fixes {% issue 503 %} and {% issue 568 %}.
- [x] Fix issue where {% url `.type()` type %} with `type="email"` inputs were throwing an error. Fixes {% issue 504 %}.
- [x] Fix issue where using {% url `.type()` type %} on an input with a `type` defined in uppercase (`input type="TEXT"`) would throw an error and not type. Fixes {% issue 550 %}.
- [x] Fix issue with `.clear()` and `type="number"` inputs. Fixes {% issue 490 %}.
- [x] Fix issue where {% url `cy.exec()` exec %} was failing when running Cypress in docker. Fixes {% issue 517 %}.
- [x] Cypress CLI no longer requires `git` to install. Fixes {% issue 124 %}
- [x] Improved the reporter's responsive design so controls still show at narrower widths. Fixes {% issue 544 %}.
- [x] Commands text will no long cut off into ellipses when the Command Log is set to a wider width. Fixes {% issue 528 %}.
- [x] Fix issue where setting `fixturesFolder` to `false` would throw an error. Fixes {% issue 450 %}.
- [x] Fix issue where Cypress hanged due to `xvfb` permissions. More intuitive output is given during install failures. Fixes {% issue 330 %}.
- [x] Fix issue with internal timers being inaccurate from within Electron. Fixes {% issue 572 %}.
- [x] Cypress will now scroll past multiple elements that cover up an element to be interacted with. It also now factors in elements with `position: sticky`. Fixes {% issue 571 %}.
- [x] {% url "The checks used to determine an element's actionability" interacting-with-elements#Actionability %} are now run synchronously. This solves some circumstances where the element could have moved or otherwise change between the checks. Fixes {% issue 570 %}.
- [x] Cypress now scrolls all parent containers (not just `window`) when attempting to {% url "check an element's actionability" interacting-with-elements#Actionability %}. Fixes {% issue 569 %}.
- [x] Fix issue where clipped elements with `overflow-y: hidden` were falsely passing as "visible". Fixes {% issue 563 %}.
- [x] When using {% url `.select()` select %} on a select with multiple options with the same value, we now properly set `selectedIndex` and `selectedOptions` on the `select`. Fixes {% issue 554 %}.
- [x] Fix issue where changing any spec file (renaming, adding, deleting) would remove the highlighted styling of the currently active spec file in the Desktop GUI. Fixes {% issue 547 %}.
- [x] We now get the absolute paths of styles to use when displaying snapshots. This will fix situations where some stylesheets were improperly referenced during the snapshot, so did not display styles correctly. Fixes {% issue 525 %}.
- [x] Fixed regression where multiple uses of {% url `cy.server()` server %} in a `before` hook was throwing an error. Fixes {% issue 80 %} and {% issue 510 %}.

**Misc:**

- [x] We've moved our entire codebase into one into a private "Monorepo". This is in anticipation for going open source (making the GitHub repo public) and should make it easier for everyone to contribute to our code. Addresses {% issue 256 %}.
- [x] When element's are not visible due to being covered by another element, the error message now says what element is covering the element.
- [x] The "Can't start server" error displayed in the Desktop-GUI no longer prevents you from interacting in the Desktop App. It now displays as a warning. Addresses {% issue 407 %}.
- [x] Updated Cypress' jQuery version from `2.1.4` to `2.2.4`.
- [x] {% url `cy.focused()` focused %} now automatically retries until the element exists in the DOM. Addresses {% issue 564 %} and {% issue 409 %}.
- [x] Support per-project `state.json`. Addresses {% issue 512 %}.
- [x] Desktop GUI update window now has messaging about `package.json` versioning. Addresses {% issue 513 %}.
- [x] Desktop GUI now accounts for cypress being installed per project as npm module. Addresses {% issue 500 %} and {% issue 514 %}.
- [ ] Throw when a value other than `cy` is returned from a test or command function. Addresses {% issue 463 %}.
- [ ] Returning a promise in a custom command should throw. Addresses {% issue 435 %}.
- [ ] Resolve data in custom command. Addresses {% issue 435 %}.
- [x] Exposing Cypress Binary should no longer be necessary when cypress is locally installed. Addresses {% issue 379 %}.
- [x] `cypress install` `-d` option. Addresses {% issue 389 %}.
- [x] Added an 'App Data' option in the Desktop App that displays app data. Addresses {% issue 475 %}.
- [x] When {% url `cy.spy()` spy %} or {% url `cy.stub()` stub %} are never called, the error now displays a clearer, grammatically correct error. Addresses {% issue 520 %}.
- [x] Detection of installed browsers has been improved. Addresses {% issue 511 %}.
- [x] Handle multiple projects per server. Addresses {% issue 512 %}.
- [x] When commands are clicked on and logged into the console from the Command Log, they now display their 'yield' instead of 'return', since they really yield instead of return.

# 1.0.0 (Upcoming)

**Features:**

- [ ] Cypress is now open source! This project is licensed under the terms of the MIT license.
- [x] We have a Contributing Guideline to help contributors get started as well as issues labeled `first-timers-only` for those wanting to contribute right away.
- [x] You can now use the Desktop GUI application without logging in. Some areas of the application still require logging in through GitHub, like the 'Runs' tab and viewing the project's 'Record Key'.
- [ ] We've removed the requirement of filling out an early adopter form and approval for logging in with GitHub to Cypress.
- [ ] {% url "www.cypress.io" https://www.cypress.io %} has an all new design to help new visitors get started quickly and understand our future pricing more clearly.
