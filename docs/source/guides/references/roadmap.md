---
title: Roadmap
comments: false
---

# 0.20.0 (Upcoming)

**Breaking Changes:**

- [x] We've removed the undocumented `cy.chain()` command. You should be able to safely remove this from your code. Fixes {% issue 456 %}.
- [x] Updated `Cypress._` to use {% url "lodash" https://lodash.com/ %} instead of {% url "Underscore" http://underscorejs.org/ %}. Fixes {% issue 548 %}.
- [x] If any of an element's parent's overflow is 'hidden', we now calculate if the element is outside of the boundaries of that parent element and validate visibility assertions accordingly. This may cause some tests that were previously passing to now accurately fail. Fixes {% issue 410 %}.
- [x] {% url `.select()` select %} should now look for the trimmed value inside of an `<option></option>`. This may change the content argument required to select the option you intended in your {% url `.select()` select %} command. Fixes {% issue 175 %}.
- [x] When passing the option `{ force: true }` to {% url `.click()` click %} and {% url `.type()` type %}, we no longer attempt to scroll the element into view. We've also disabled the check that the element is in view before clicking or typing. Fixes {% issue 553 %} and {% issue 537 %}.
- [x] `Cypress.Dom` has been renamed to `Cypress.dom`.
- [x] `Cypress.Log.command` has been renamed to `Cypress.log`.
- [x] `chai-jQuery` assertions no longer change the subject when using `prop`, `attr`, and `css` with the **3rd** argument which acts as equality check. Fixes {% issue 605 %}.
- [x] We now throw when a value other than `cy` is returned from a test or command function. Fixes {% issue 463 %}.
- [x] Returning a promise in a custom command while also invoking cy commands now throws. Fixes {% issue 435 %}.

**Features:**

- [x] We have all new docs! Check them out {% url "here" https://docs.cypress.io %}.
- [x] `chai-jQuery` assertions have improved error messaging, and have had their internal double assertions removed, and can now be made on raw DOM objects. Fixes {% issue 605 %}.
- [x] `chai-jQuery` assertions now throw a nice error message when you're asserting on a non DOM object. Fixes {% issue 604 %}.
- [x] You can now install `cypress` per project as an `npm` package using `npm install cypress`. The installation and use of the {% url "`cypress-cli` npm package" https://www.npmjs.com/package/cypress-cli %} is no longer required.
- [x] New `cy.trigger()` command. Useful for triggering arbitrary events. Fixes {% issue 406 %}.
- [x] New `cy.scrollTo()` command. Useful for having a container scroll to a specific position. Fixes {% issue 497 %} & {% issue 313 %}.
- [x] New `.scrollIntoView()` command. Useful for scrolling an element into view. Fixes {% issue 498 %} & {% issue 313 %} & {% issue 519 %}.
- [x] Input ranges are now more easily testable using the new `cy.trigger()` command. See our new recipe for details on how. Fixes {% issue 287 %}.
- [x] Testing drag and drop is now possible using the new `cy.trigger()` command. See our new recipe for details on how. Fixes {% issue 386 %}.
- [x] Updated `.click()` command to accept more position arguments. Fixes {% issue 499 %}.
- [x] Added support to {% url `.type()` type %} for inputs of type `date`, `time`, `month`, and `week`. Fixes {% issue 27 %}.
- [x] You can now pass a browser option to `cypress run` as `--browser <browser name>`. This enables you to run the same set of browsers when running from the CLI as when you're running from the GUI. Fixes {% issue 462 %} and {% issue 531 %}.
- [x] `cypress open` no longer opens a detached process by default. Instead `cypress open` now accepts a new flag `--detached`, which replicates this behavior. Fixes {% issue 531 %}.
- [x] We have all new {% url "docker examples" docker-images %} you can check out.
- [x] The `cypress` npm package now checks the currently installed version on `install` and `run` and does not re-install Cypress if it is already installed. Fixes {% issue 396 %}.
- [x] We've added a new `Cypress.Commands` interface to handle adding your own custom commands. Fixes {% issue 436 %}.
- [x] We removed an artificial delay that was being set in between commands. This means test commands now run faster.
- [x] You can now disable Cypress global exception handler for your application. Fixes {% issue 254 %}
- [x] Uncaught errors appearing in your spec files or support files are now properly caught, have the right exit code, and display correctly. Fixes {% issue 345 %}
- [x] Cypress will now scroll past multiple elements that cover up an element to be interacted with. It also now factors in elements with `position: sticky`. Fixes {% issue 571 %} and {% issue 565 %}.
- [x] Cypress now scrolls all parent containers (not just `window`) when attempting to {% url "check an element's actionability" interacting-with-elements#Actionability %}. Fixes {% issue 569 %}.

**Dependencies:**

- [x] Updated `Cypress.Promise` (which is Bluebird) from version `2.9.25` to `3.5.0`
- [x] Updated `chai` from version `1.9.2` to `3.5.0`
- [x] Updated `sinon` from version `1.x` to `3.2.0`
- [x] Updated `jQuery` from version `2.1.4` to `2.2.4`.
- [x] Removed `chai-jQuery` and rewrote it from scratch

**Deprecations**

- [x] The {% url "`cypress-cli` npm package" https://www.npmjs.com/package/cypress-cli %} has been deprecated. Fixes {% issue 316 %}.
- [ ] The interface for writing custom commands has been deprecated. Please read our docs on the new custom commands interface. Fixes {% issue 436 %} and {% issue 465 %}.

**Bugfixes:**

- [x] Fixed busted internal timers that cause random timeouts, proxy errors, incorrect delays, and long pauses when loading the GUI. Fixes {% issue 572 %}.
- [x] `cy.route` now matches requests opened with lowercase methods. Fixes {% issue 607 %}.
- [x] Fixed regression where multiple uses of {% url `cy.server()` server %} in a `before` hook was throwing an error. Fixes {% issue 80 %} and {% issue 510 %} and {% issue 595 %}.
- [x] When editing `cypress.json` file, the dead browser page no longer appears. Fixes {% issue 492 %}.
- [x] {% url `.type()` type %} should now work on inputs regardless of capitalization of `type` attribute. Fixes {% issue 550 %}.
- [x] Fixed issues where {% url `.type()` type %} was not appending text properly. Fixes {% issue 503 %} and {% issue 568 %}.
- [x] Fixed issue where {% url `.type()` type %} with `type="email"` inputs were throwing an error. Fixes {% issue 504 %}.
- [x] Fixed issue where using {% url `.type()` type %} on an input with a `type` defined in uppercase (`input type="TEXT"`) would throw an error and not type. Fixes {% issue 550 %}.
- [x] Fixed issue with `.clear()` and `type="number"` inputs. Fixes {% issue 490 %}.
- [x] Fixed issue where {% url `cy.exec()` exec %} was failing when running Cypress in docker. Fixes {% issue 517 %}.
- [x] Cypress CLI no longer requires `git` to install. Fixes {% issue 124 %}
- [x] Improved the reporter's responsive design so controls still show at narrower widths. Fixes {% issue 544 %}.
- [x] Commands text will no long cut off into ellipses when the Command Log is set to a wider width. Fixes {% issue 528 %}.
- [x] Fixed issue where setting `fixturesFolder` to `false` would throw an error. Fixes {% issue 450 %}.
- [x] Fixed issue where Cypress hanged due to `xvfb` permissions. More intuitive output is given during install failures. Fixes {% issue 330 %}.
- [x] Fixed issue with internal timers being inaccurate from within Electron. Fixes {% issue 572 %}.
- [x] {% url "The checks used to determine an element's actionability" interacting-with-elements#Actionability %} are now run synchronously. This solves some circumstances where the element could have moved or otherwise change between the checks. Fixes {% issue 570 %}.
- [x] Fixed issue where clipped elements with `overflow-y: hidden` were falsely passing as "visible". Fixes {% issue 563 %}.
- [x] When using {% url `.select()` select %} on a select with multiple options with the same value, we now properly set `selectedIndex` and `selectedOptions` on the `select`. Fixes {% issue 554 %}.
- [x] Fixed issue where changing any spec file (renaming, adding, deleting) would remove the highlighted styling of the currently active spec file in the Desktop GUI. Fixes {% issue 547 %}.
- [x] We now get the absolute paths of styles to use when displaying snapshots. This will fix situations where some stylesheets were improperly referenced during the snapshot, so did not display styles correctly. Fixes {% issue 525 %}.
- [x] Fixed issue where commands would retry and potentially exceed their timeout values during page transitions. Fixes {% issue 594 %}
- [x] Fixed issue where server routes were lost after page load if not initiated by a {% url `cy.visit()` visit %} command. Fixes {% issue 177 %}

**Misc:**

- [x] We now display a warning in the console when returning a promise from a test and also invoking one or cy commands. Fixes {% issue 464 %}.
- [x] Reduced the number of internal Cypress network requests in the "Network Panel" of Dev Tools. Fixes {% issue 606 %}.
- [x] We've moved our entire codebase into one into a private "Monorepo". This is in anticipation for going open source (making the GitHub repo public) and should make it easier for everyone to contribute to our code. Fixes {% issue 256 %}.
- [x] When element's are not visible due to being covered by another element, the error message now says what element is covering the element.
- [x] The "Can't start server" error displayed in the Desktop-GUI no longer prevents you from interacting in the Desktop App. It now displays as a warning. Fixes {% issue 407 %}.
- [x] {% url `cy.focused()` focused %} now automatically retries until the element exists in the DOM. Fixes {% issue 564 %} and {% issue 409 %}.
- [x] We now support per-project `state.json`. Fixes {% issue 512 %}.
- [x] We can now handle multiple projects per server. Fixes {% issue 512 %}.
- [x] The Desktop GUI update window now has messaging about `package.json` versioning. Fixes {% issue 513 %}.
- [x] The Desktop GUI now accounts for cypress being installed per project as npm module. Fixes {% issue 500 %} and {% issue 514 %}.
- [x] Exposing Cypress Binary should no longer be necessary when cypress is locally installed. Fixes {% issue 379 %}.
- [x] `cypress install` `-d` option. Fixes {% issue 389 %}.
- [x] Added an 'App Data' option in the Desktop App that displays app data. Fixes {% issue 475 %}.
- [x] When {% url `cy.spy()` spy %} or {% url `cy.stub()` stub %} are never called, the error now displays a clearer, grammatically correct error. Fixes {% issue 520 %}.
- [x] Detection of installed browsers has been improved. Fixes {% issue 511 %}.
- [x] When commands are clicked on and logged into the console from the Command Log, they now display their 'yield' instead of 'return', since they really yield instead of return.
- [x] The build process of the driver has been modernized. Fixes {% issue 429 %}.

# 1.0.0 (Upcoming)

**Features:**

- [ ] Cypress is now open source! This project is licensed under the terms of the MIT license.
- [x] We have a Contributing Guideline to help contributors get started as well as issues labeled `first-timers-only` for those wanting to contribute right away.
- [x] You can now use the Desktop GUI application without logging in. Some areas of the application still require logging in through GitHub, like the 'Runs' tab and viewing the project's 'Record Key'.
- [ ] We've removed the requirement of filling out an early adopter form and approval for logging in with GitHub to Cypress.
- [ ] {% url "www.cypress.io" https://www.cypress.io %} has an all new design to help new visitors get started quickly and understand our future pricing more clearly.
