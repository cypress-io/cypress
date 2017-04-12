slug: using-the-cypress-runner
excerpt: Review test commands, instrumentation and your application under test.

# Contents

- :fa-angle-right: [Overview](#overview)
- :fa-angle-right: [Test Runner Components](#test-runner-components)
  - [Command Log](#command-log)
  - [Instrument Panel](#instrument-panel)
  - [Application Under Test](#application-under-test)

***

# Overview

Cypress runs tests in a unique interactive runner that allows you to see commands as they execute while also viewing the application under test.

![Cypress Test Runner](https://www.cypress.io/img/test-runner-gui-in-browser.9e6f99d7.png)

***

# Test Runner Components:

## Command Log

The lefthand side of the test runner is a visual representation of your test suite. Each test block is properly nested and each test, when clicked, displays every Cypress command and assertion executed within the test's block as well as any command or assertion executed in relevant `before`, `beforeEach`, `afterEach`, and `after` hooks.

<img width="436" alt="screen shot 2017-03-06 at 2 03 49 pm" src="https://cloud.githubusercontent.com/assets/1271364/23626797/1a6a59f6-027c-11e7-9ca5-7451b97557a9.png">

**Hovering on Commands**

Each command and assertion, when hovered over, restores the Application Under Test (righthand side) to the state it was in when that command executed. This allows you to 'time-travel' back to previous states of your application when testing.

[block:callout]
{
  "type": "info",
  "body": "By default, Cypress keeps 50 tests worth of snapshots and command data for time traveling. If you are seeing extremely high memory consumption in your browser, you may want to lower the `numTestsKeptInMemory` in your [configuration](https://on.cypress.io/guides/configuration#global)."
}
[/block]


**Clicking on Commands**

Each command, assertion, or error, when clicked on, displays extra information in the dev tools console. Clicking also 'pins' the Application Under Test (righthand side) to it's previous state when the command executed.

![Click to console.log and to pin](https://cloud.githubusercontent.com/assets/1271364/23626854/59b2e6dc-027c-11e7-8c9e-7b4c9162f4c5.png)


***

## Instrument Panel

For certain commands like [`cy.route()`](https://on.cypress.io/api/route), [`cy.stub()`](https://on.cypress.io/api/stub), and [`cy.spy()`](https://on.cypress.io/api/spy), an extra instrument panel is displayed above the test to give more information about the state of your tests.

*Routes*

![Routes Instrument Panel](https://cloud.githubusercontent.com/assets/1271364/23625143/2500b172-0276-11e7-824a-590562176818.png)

*Stubs*

![Stubs Instrument Panel](https://cloud.githubusercontent.com/assets/1157043/22437473/335f7104-e6f6-11e6-8ee8-74dc21e7d4fa.png)

*Spies*

![Spies Instrument Panel](https://cloud.githubusercontent.com/assets/1157043/22437713/1d5f7be6-e6f7-11e6-9457-f35cbeaa5385.png)

## Application Under Test

The righthand side of the test runner is used to display the Application Under Test (AUT: the application that was navigated to using a [`cy.visit()`](https://on.cypress.io/api/visit) or any subsequent routing calls made from the visited application.

In the example below, we wrote the following code in our test file:

```javascript
cy.visit('https://example.cypress.io')

cy.title().should('include', 'Kitchen Sink')
```

In the corresponding Application Preview below, you can see `https://example.cypress.io` is being displayed in the righthand side. Not only is the application visible, but it is fully interactable. You can open your developer tools to inspect elements as you would your normal application. The DOM is completely available for debugging.

![screen shot 2017-03-06 at 2 31 06 pm](https://cloud.githubusercontent.com/assets/1271364/23626182/ec9d421a-0279-11e7-8ff2-42f33d2fe1ca.png)

The AUT also displays in the size and orientation specified in your tests. You can change the size or orientation with the [`cy.viewport()`](https://on.cypress.io/api/viewport) command or in your [Cypress configuration](https://docs.cypress.io/docs/configuration#viewport). If the AUT does not fit within the current browser window, it is scaled appropriately to fit within the window.

The current size and scale of the AUT is displayed in the top right corner of the window.

The image below shows that our application is displaying at `1000px` width, `660px` height and scaled to `100%`.

![screen shot 2017-03-06 at 2 57 00 pm](https://cloud.githubusercontent.com/assets/1271364/23627080/43eda9c6-027d-11e7-8cb9-270e074587cb.png)


*Note: The righthand side may also be used to display syntax errors in your test file that prevent the tests from running.*

![screen shot 2017-03-06 at 2 19 23 pm](https://cloud.githubusercontent.com/assets/1271364/23625643/f04a6976-0277-11e7-8ff2-0be479e79e8a.png)

