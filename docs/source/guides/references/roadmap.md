---
title: Roadmap
comments: false
---

# 0.20.0 (Upcoming)

**Features:**

- [x] We have all new docs! Check them out {% url "here" https://docs.cypress.io %}.
- [x] New `cy.trigger()` command. Addresses {% issue 406 %}.
- [x] New `cy.scrollTo()` command. Addresses {% issue 497 %} & {% issue 313 %}.
- [x] New `.scrollIntoView()` command. Addresses {% issue 498 %} & {% issue 313 %} & {% issue 519 %}.
- [x] Input ranges are now more easily testable using the new.  `cy.trigger()` command. See our new recipe for details on how. Addresses {% issue 287 %}
- [x] Testing drag and drop is now possible using the new.  `cy.trigger()` command. See our new recipe for details on how. Addresses {% issue 386 %}
- [x] Update `.click()` command to accept more position arguments. Addresses {% issue 499 %}.
- [x] Add support to `.type()` for inputs of type `date`, `time`, `month`, and `week`. Addresses {% issue 27 %}.
- [x] Update `Cypress._` to use {% url "lodash" https://lodash.com/ %} instead of {% url "Underscore" http://underscorejs.org/ %}. Addresses {% issue 548 %}.
- [ ] Refactor custom command rules, removed undocumented `cy.chain()`. Addresses {% issue 456 %}.
- [x] You can now pass a browser option to `cypress run` as `--browser <browser name>`. Addresses {% issue 462 %}
- [x] New CLI flag `--detached`.
- [x] When using `cypress install`, we now check for the current version of Cypress before re-installing. Addressed {% issue 396 %}.
- [x] We have all new {% url "docker examples" docker-images %} you can check out.

**Breaking Changes:**

- [x] Cypress CLI has been deprecated Addresses {% issue 316 %}.
- [x] If any of an element's parent's overflow is 'hidden', we now calculate if
the element is outside of the boundaries of that parent element and validate visibility assertions accordingly. This may cause some tests that were previously passing to now accurately fail. Fixes {% issue 410 %}.
- [x] `.select()` Should Look For Trimmed Value Inside of `<option></option>`. This may change the content required in your `.select()` command. Addresses {% issue 175 %}.

**Bugfixes:**

- [x] When editing `cypress.json` file, dead Chrome page is no longer shown. Fixes {% issue 492 %}.
- [ ] `.type()` should work on inputs regardless of capitalization of `type` attribute. Fixes {% issue 550 %}.
- [x] Fix issues where `.type()` is not appending text properly. Fixes {% issue 503 %}
- [x] Fix issue where `.type()` with email inputs was throwing an error. Fixes {% issue 504 %}
- [x] Fix issue with `.clear()` and number inputs. Fixes {% issue 490 %}
- [x] We've improved detection of browsers installed for use on your machine. Fixes {% issue 511 %}.
- [x] `cy.exec()` fails when running Cypress in docker. Fixes {% issue 517 %}.
- [x] Cypress CLI no longer requires git to install. Fixes {% issue 124 %}
- [x] Improved the reporter's responsive design so controls still show at narrower widths. Fixes {% issue 544 %}.
- [x] Commands text will no long cut off into ellipses when the Command Log is set to a wider width. Fixes {% issue 528 %}.
- [ ] Fixed issue where setting `fixturesFolder` to `false` would throw an error. Fixed {% issue 450 %}.
- [ ] Fixed issue where Cypress hanged due to `xvfb` permissions. More intuitive output is given during install failures. Fixes {% issue 330 %}

**Misc:**

- [ ] We've moved our entire codebase into one into a private Monorepo. This is in anticipation for going open source (making the repo public) and should make it easier for everyone to contribute to our code. Addresses {% issue 256 %}.
- [x] When element's are not visible due to being covered by another element, the error message now says what element is covering the element.
- [x] The "Can't start server" error displayed in the Desktop-GUI no longer prevents you from interacting in the Desktop App. It now displays as a warning. Addresses {% issue 407 %}
- [x] Updated Cypress' jQuery version from `2.1.4` to `2.2.4`
- [ ] Convert `zip` -> `tar.gz`
- [ ] NPM Module versioning
- [ ] Remove `npm install -g cypress-cli`
- [ ] Support per-project `state.json`. Addresses {% issue 512 %}.
- [ ] Change Desktop GUI update banner with messaging about `package.json` versioning. Addresses {% issue 513 %}.
- [ ] Desltop GUI now accounts for cypress being installed per project as npm module. Addresses {% issue 500 %}.
- [ ] Throw when a value other than `cy` is returned from a test or command function. Addresses {% issue 463 %}.
- [ ] Returning a promise in a custom command should throw. Addresses {% issue 435 %}.
- [ ] Resolve data in custom command. Addresses {% issue 435 %}.
- [x] Exposing Cypress Binary should no longer be necessary when cypress is locally installed. Addresses {% issue 379 %}.
- [x] `cypress install` `-d` option. Addresses {% issue 389 %}.
- [x] Added an 'App Data' option in the Desktop App that displays app data. Addresses {% issue 475 %}.
- [x] Handle multiple projects per server. Addresses {% issue 512 %}
- [ ] Deprecate `CYPRESS_DEBUG=true` and document using `DEBUG=cypress:*`
- [x] When commands are clicked on and logged into the console from the Command Log, they now display their 'yield' instead of 'return', since they really yield instead of return.
