---
title: Roadmap
comments: false
---

# 0.20.0 (Upcoming)

**Features:**

- [x] New `cy.trigger()` command. Addresses {% issue 406 %}.
- [x] New `cy.scrollTo()` command. Addresses {% issue 497 %} & {% issue 313 %}.
- [x] New `.scrollIntoView()` command. Addresses {% issue 498 %} & {% issue 313 %}.
- [x] Input ranges are now more easily testable using the new.  `cy.trigger()` command. See our new recipe for details on how. Addresses {% issue 287 %}
- [x] Testing drag and drop is now possible using the new.  `cy.trigger()` command. See our new recipe for details on how. Addresses {% issue 386 %}
- [x] Update `.click()` command to accept more position arguments. Addresses {% issue 499 %}.
- [x] Add support to `.type()` for inputs of type `date`, `time`, `month`, and `week`. Addresses {% issue 27 %}.
- [x] Update `Cypress._` to use {% url "lodash" https://lodash.com/ %} instead of {% url "Underscore" http://underscorejs.org/ %}. Addresses {% issue 548 %}.
- [ ] Refactor custom command rules, removed undocumented `cy.chain()`. Addresses {% issue 456 %}.
- [x] You can now pass a browser option to `cypress run` as `--browser <browser name>`. Addresses {% issue 462 %}
- [x] New CLI flag `--detached`.

**Bugfixes:**

- [x] When editing `cypress.json` file, dead Chrome page is shown. Fixes {% issue 492 %}.
- [x] If any of an element's parent's overflow is 'hidden', we now calculate if
the element is outside of the boundaries of that parent element and validate visibility assertions accordingly. Fixes {% issue 410 %}
- [ ] `.type()` should work on inputs regardless of capitalization of `type` attribute. Fixes {% issue 550 %}.
- [x] Fix issues with `.type()` appending text. Fixes {% issue 503 %}
- [x] Fix issue with `.type()` and email inputs. Fixes {% issue 504 %}
- [x] Fix issue with `.clear()` and number inputs. Fixes {% issue 490 %}
- [ ] Improve browser detection. Fixes {% issue 511 %}
- [x] `cy.exec()` fails when running Cypress in docker. Fixes {% issue 517 %}
- [x] Cypress CLI no longer requires git to install. Fixes {% issue 124 %}

**Misc:**

- [x] When element's are not visible due to being covered by another element, the error message now says what element is covering the element.
- [x] Update Cypress' jQuery version from `2.1.4` to `2.2.4`
- [x] `.select()` Should Look For Trimmed Value Inside of `<option></option>`. Addresses {% issue 175 %}
- [ ] Convert `zip` -> `tar.gz`
- [ ] NPM Module versioning
- [ ] Remove `npm install -g cypress-cli`
- [ ] Support per-project `state.json`. Addresses {% issue 512 %}
- [ ] Change Desktop GUI update banner with messaging about `package.json` versioning. Addresses {% issue 513 %}
- [ ] Cypress GUI needs to be updated to account for cypress being installed per project as npm module. Addresses {% issue 500 %}
- [ ] Throw when a value other than `cy` is returned from a test or command function. Addresses {% issue 463 %}
- [ ] Returning a promise in a custom command should throw. Addresses {% issue 435 %}
- [ ] Resolve data in custom command. Addresses {% issue 435 %}
