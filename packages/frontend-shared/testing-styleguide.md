# DRAFT - CYPRESS TESTING STYLE GUIDE

## Status of this document

This draft is a starting point to help us converge on some common practices in terms of how we write tests, and a reference point for how we can review test PRs with each other. There are many valid style choices to make in writing tests, and some of them are contradictory, so a consistent approach is useful.

I'm starting by documenting the practices that I see us currently doing in the new parts of the codebase, or things we seem to have agreed we'd like to do. Not exhaustive, and not prescriptive.

## String constants
Strings used in tests for locating elements or asserting content in other ways are imported from the i18n constants. All strings present in the UI should be found in some form in `en-US.json`. If a plain string is found in the UI code (we have a few of them), it should be moved into the constants file and then imported to both the component and the test code.

## Element Locators
When relevant, element locators can assert something useful about the nature or context of the element in the DOM. Often for accessibility reasons it is important what elements are rendered. If there is nothing in particular that matters about the DOM, or if needed to disambiguate, then `data-cy` attributes can be used to locate elements.
### Interactive Elements
If the test will interact with an element, or assert the state of an interactive element, always prefer to locate that element with its accessible name (and, usually, an assertion about the element itself). Without an accessible name, the element will not be described correctly by a screen reader, which means certain disabled users would not know what the control or form field is for. Since we want every user to be able to interact with our app, a test that interacts with something should fail if there is no label for it.

Examples:

```js
cy.contains('button', 'Log In').click()
```

```js
cy.findByLabelText('toggle navigation', {
      selector: 'button',
    }).click()
```

#### Label-like locators that are not labels

We should be cautious with a locator like `cy.findByPlaceholderText('My placeholder')` to target a form input, as an input that only has a `placeholder`, but no `label`, is not fully accessible. Even though it may be useful to assert the placeholder contents for its own sake, we should prefer to locate an input by `label` when interacting.

### Non-interactive elements
When assertions are made against non-interactive elements, if the surrounding HTML is relevant from an accessibility perspective, assert the relevant parts of the HTML:

```js
cy.contains('h1', 'Page Title!').should('be.visible')
```
```js
cy.contains('h2', 'Modal Title').should('be.visible')
```

This is a judgement call, there is a spectrum between asserting useful things about the DOM and writing a brittle assertion like this that adds no value to the test:

```js
cy.contains('div > div > .special-list > li > span', 'Home Link')`
```

In general, prefer to limit assertions about the nature of the DOM to a small surface area near the target element. Even then, only assert the DOM if there is a reason that changing the DOM in that area would harm the use experience - for example by breaking accessibility.

`data-cy` attributes can be used when the content, nature, and DOM location of the element doesn't matter to the test, or are dynamic and can't be predicted/driven by test setup, for example:

```
cy.get('[data-cy="success-toast"]') // just make sure it exists
cy.percySnapshot() // capture the state in Percy
```
#### Visibility Checks

Asserting `should('be.visible')` is useful when testing elements that the test won't interact with, as in certain situations it is possible for elements to be found in the DOM with the content we expect, but to still be unexpectedly hidden from the user with CSS or covered by another element. When interacting, that visibility check is already built in before `cy.click` or `cy.type` for example.

## Component, E2E, and System tests

### Component Tests
Component tests should assert all expected behaviors of a component from a user perspective, as well as the "contract" of the component from a developer perspective. It is useful to write component tests as the primary driver of component development. This helps with development speed (no need to keep getting the whole app into the state you want), and test completeness.

For user-facing behavior, we interact with (or remount) the component to get it into all desired states and confirm they are valid. Each state should have a Percy snapshot in addition to regular Cypress assertions.

For developer-facing behavior - props received, events emitted, any other side effects, anything not covered in the UI tests can be explicitly asserted on its own. Props are often fully covered by UI assertions, but events emitted by the component to be used in parent components are not. So we can stub event handlers and verify that they are called in response to particular interactions.

**Many components** in the unified App and Launchpad define the data they require from GraphQL with a Fragment inside the component's `script` section, and receive the data from that Fragment in a prop called `gql`, so mocking out scenarios usually involves tweaking the mocked GraphQL data before the component mounts using `mountFragment()`.

### E2E Tests
Certain side effects, like GraphQL mutations, do not fire from component tests, but can be monitored from an E2E test with `cy.intercept`. And some entire packages, like `reporter` are independent apps that can be mounted in an E2E test and tested for interactions with other parts of the system.

### "Open Mode" System Tests
System Tests are a subcategory of E2E tests where nothing is mocked in the tests. These tests open Cypress itself and assert whole user flows and expected states. There can be overlap with component tests, but a given System Test is not expected to put every component it encounters into every possible state.

## Percy Snapshots
Percy snapshots confirm that the appearance of a given state matches the last approved snapshot of that state. If a test only contains a percy snapshot, prefer a general name for that test as opposed to a specific detail of the snapshot. For example prefer "has expected appearance" to "has a purple outline" since nothing in the test is actually asserting that.

NOTE: 👆 This could use more thought/discussion. Maybe "has a purple outline" is a good thing to have in the test name because it might alert somebody reviewing the snapshot about a change they should look for, or the thing we expected the snapshot to confirm.

## Cypress-Testing-Library
Feel free to use this often in tests if it makes the test easier to write or understand, except where using it provides less confidence than a plain Cypress selector. For example `cy.contains('button', 'Log In')` is slightly preferred to `cy.findByRole('button', {name: 'Log In' })`, because the ARIA role of `button` could be added to an element that does not have the expected keyboard behaviors implemented, and the test might still pass. It is also a good accessibility practice to not use ARIA to recreate the existing functionality of HTML elements, but instead use the elements directly. So using `findByRole` should not be necessary except for certain UI interactions like tabs or carousels, if we have those.
