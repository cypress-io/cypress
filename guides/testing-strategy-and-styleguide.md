# DRAFT - CYPRESS TESTING STRATEGY + STYLE GUIDE
## Status of this document

This draft is a starting point to help us converge on some common practices in terms of how we write tests, and a reference point for how we can review test PRs with each other. There are many valid style choices to make in writing tests, and some of them are contradictory, so a consistent approach is useful.

I'm starting by documenting the practices that I see us currently doing in the new parts of the codebase, or things we seem to have agreed we'd like to do. Not exhaustive, and not prescriptive. The Testing Strategy section existed already in Google Docs.

## Testing Strategy
The purpose of this document is to detail the various ways to test the cypress repo including the Cypress App. 

### Testing Goals
The goal of testing is to instill confidence in the features being built and the bugs being fixed as well as save development hours.

Test driven development (TDD) is a core tenet to how we write tests at Cypress. Our approach is to Shift-left testing whenever possible.

### Testing Types
- Unit - Tests the functionality of a single section of code, like a single function.
- Integration - Tests the functionality of a feature, with some portions (like a backend) mocked. 
- End-to-end (E2E) - Tests the functionality of a feature with no mocking. It tests all pieces of the feature working together.
- Component - Tests a single component or group of components.
- System - A type of E2E test that tests an entire project in the context of Cypress.
- Snapshot - Captures text output and compares them to previously captured text output (like testing output for a CLI).
- Screenshot - Captures screenshots and compares them to previously captured screenshots. 
- Performance - Tests the speed, response time, stability, reliability, scalability and resource usage of the application.

### Testing Environments
Tests can run in different environments:

- Different browsers
- Different OSs
- Node.js

### Testing Tools
- Mocha
- Cypress
- Snapshot tests using [snap-shot-it](https://github.com/bahmutov/snap-shot-it) - Use `SNAPSHOT_UPDATE=1 <test command>` to update them, but make sure to check the diff to ensure it's the right update.
- Percy snapshot tests - These only run in CI and can be managed from the GitHub status check on a PR

### Testing Workflow
Developing features and fixing bugs should be test driven. 

An example of building out a front-end facing feature may go like this:

1. Check user requirements in the ticket/issue you’re assigned to.
1. Write a failing component test for a features required in the user story.
1. Build the piece of the component needed so that the failing test passes.
1. Repeat steps 2-3 until the component satisfies the user requirements.
1. Write out all CSS required for the feature to be design complete. 
1. Add a screenshot test. 
1. Write an E2E test to ensure all pieces and integrations work together. 
1. Add performance tests if necessary to ensure the feature doesn’t introduce regressions on performance. 

An example of building out a feature/change to the CLI may go like this:

1. Check user requirements in the ticket/issue you’re assigned to.
1. Write a failing unit/integration test for the feature required in the user story.1. Write the logic for the new feature/change.
1. Capture/update a snapshot test for any changes to the printed console output. 


## Component and E2E Tests in App, Launchpad, and Frontend-Shared Packages

### Component Tests
Component tests should assert all expected behaviors of a component from a user perspective, as well as the "contract" of the component from a developer perspective. It is useful to write component tests as the primary driver of component development. This helps with development speed (no need to keep getting the whole app into the state you want), and test completeness.

For user-facing behavior, we interact with (or remount) the component to get it into all desired states and confirm they are valid. Each state should have a Percy snapshot in addition to regular Cypress assertions.

For developer-facing behavior - props received, events emitted, any other side effects, anything not covered in the UI tests can be explicitly asserted on its own. Props are often fully covered by UI assertions, but events emitted by the component to be used in parent components are not. So we can stub event handlers and verify that they are called in response to particular interactions.

**Many components** in the unified App and Launchpad define the data they require from GraphQL with a Fragment inside the component's `script` section, and receive the data from that Fragment in a prop called `gql`, so mocking out scenarios usually involves tweaking the mocked GraphQL data before the component mounts using `mountFragment()`.

### E2E Tests
Certain side effects, like GraphQL mutations, do not fire from component tests, but can be monitored from an E2E test with `cy.intercept`. And some entire packages, like `reporter` are independent apps that can be mounted in an E2E test and tested for interactions with other parts of the system.

## Testing Style Guide

### String constants
Strings used in tests for locating elements or asserting content in other ways are imported from the i18n constants. All strings present in the App or Launchpad UI should be found in some form in `en-US.json`. If a plain string is found in the UI code (we have a few of them), it should be moved into the constants file and then imported to both the component and the test code.

### Element Locators
When relevant, element locators can assert something useful about the nature or context of the element in the DOM. Often for accessibility reasons it is important what elements are rendered. If there is nothing in particular that matters about the DOM, or if needed to disambiguate, then `data-cy` attributes can be used to locate elements.

### Testing Interactive Elements
If the test will interact with an element, or assert the state of an interactive element, **always prefer to locate that element with its accessible name** (and, usually, an assertion about the element itself). Without an accessible name, the element will not be described correctly by a screen reader, which means certain disabled users would not know what the control or form field is for. Since we want every user to be able to interact with our app, a test that interacts with something should fail if there is no label for it.

Examples:

```js
cy.contains('button', 'Log In').click()
```

```js
cy.findByLabelText('open navigation', {
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

### Data-cy attributes

Sometimes the specific details of an element don't matter so we don't assert what kind of element it is. Or the contents are dynamic and can't be controlled in the test, so we can't use the content to locate the element. In these cases `data-cy` attributes can be used:

```
cy.get('[data-cy="success-toast"]').should('be.visible') // just make sure it exists
```

`data-cy` can also be combined with other selectors to help target a specific element we've identified in our code, while continuing to assert the appropriate DOM and content:

```
cy.contains('[data-cy="success-toast"] h2', 'Success!').should('be.visible') // toast with correct heading element and test exists
```

Be cautious when using _only_ `data-cy` to locate an element, because doing so specifically tells the test not to care about what kind of element it is, or what it contains. So we should be sure that's what is intended. This means we should rarely, if ever, rely on `data-cy` alone to locate an element we will interact with. It should always be combined with an assertion about the label/name of that element. 

An exception would be when testing a something like card in the UI, if the whole card is supposed to be clickable. While there should be some focusable element inside the card for keyboard and screenreader users, the card itself does not need a label but should still be tested, alongside the properly labelled accessible control for the same function:

```
cy.get('[data-cy="ui-card"]').click() // test clicking at the level of the card itself
// ... assert expected state ...

cy.contains('[data-cy="ui-card"] button', 'Activate').click() // test the accessible trigger for that card's functionality
// ... assert expected state ...

```

### Visibility Checks

Asserting `should('be.visible')` is useful when testing elements that the test won't interact with, as in certain situations it is possible for elements to be found in the DOM with the content we expect, but to still be unexpectedly hidden from the user with CSS or covered by another element. When interacting, that visibility check is already built in before `cy.click` or `cy.type` for example.

### Cypress-Testing-Library
Feel free to use this often in tests if it makes the test easier to write or understand, except where using it provides less confidence than a plain Cypress selector. For example `cy.contains('button', 'Log In')` is slightly preferred to `cy.findByRole('button', {name: 'Log In' })`, because the ARIA role of `button` could be added to an element that does not have the expected keyboard behaviors implemented, and the test might still pass. It is also a good accessibility practice to not use ARIA to recreate the existing functionality of HTML elements, but instead use the elements directly. So using `findByRole` should not be necessary except for certain UI interactions like tabs or carousels, if we have those.

### Visual Appearance
Avoid specifying specific CSS color values in tests. Prefer Percy snapshots to validate that the approved appearance isn't changing unexpectedly.
