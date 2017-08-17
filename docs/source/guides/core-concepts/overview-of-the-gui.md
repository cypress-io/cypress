---
title: Overview of the GUI
comments: false
---

{% note info %}
# {% fa fa-graduation-cap %} What You'll Learn

- The names and purposes of the visual parts of the Cypress GUI tool
- How the tool behaves under different situations and inputs
- How the tool integrates the browser console experience
{% endnote %}

# Overview

Cypress runs tests in a unique interactive runner that allows you to see commands as they execute while also viewing the application under test.

{% img no-border /img/guides/gui-diagram.png Cypress Test Runner %}

# Test Runner Components:

## Command Log

The lefthand side of the test runner is a visual representation of your test suite. Each test block is properly nested and each test, when clicked, displays every Cypress command and assertion executed within the test's block as well as any command or assertion executed in relevant `before`, `beforeEach`, `afterEach`, and `after` hooks.

{% img /img/guides/command-log.png 436 Cypress Test Runner %}

***Hovering on Commands***

Each command and assertion, when hovered over, restores the Application Under Test (righthand side) to the state it was in when that command executed. This allows you to 'time-travel' back to previous states of your application when testing.

{% note info  %}
By default, Cypress keeps 50 tests worth of snapshots and command data for time traveling. If you are seeing extremely high memory consumption in your browser, you may want to lower the `numTestsKeptInMemory` in your {% url 'configuration' configuration#Global %}.
{% endnote %}

***Clicking on Commands***

Each command, assertion, or error, when clicked on, displays extra information in the dev tools console. Clicking also 'pins' the Application Under Test (righthand side) to its previous state when the command executed.

{% img /img/guides/clicking-commands.png Click to console.log and to pin %}


## Instrument Panel

For certain commands like {% url `cy.route()` route %}, {% url `cy.stub()` stub %}, and {% url `cy.spy()` spy %}, an extra instrument panel is displayed above the test to give more information about the state of your tests.

***Routes:***

{% img /img/guides/instrument-panel-routes.png Routes Instrument Panel %}

***Stubs:***

{% img /img/guides/instrument-panel-stubs.png Stubs Instrument Panel %}

***Spies:***

{% img /img/guides/instrument-panel-spies.png Spies Instrument Panel %}

## Application Under Test

The righthand side of the test runner is used to display the Application Under Test (AUT: the application that was navigated to using a {% url `cy.visit()` visit %} or any subsequent routing calls made from the visited application.

In the example below, we wrote the following code in our test file:

```javascript
cy.visit('https://example.cypress.io')

cy.title().should('include', 'Kitchen Sink')
```

In the corresponding Application Preview below, you can see `https://example.cypress.io` is being displayed in the righthand side. Not only is the application visible, but it is fully interactable. You can open your developer tools to inspect elements as you would your normal application. The DOM is completely available for debugging.

{% img /img/guides/application-under-test.png Application Under Test %}

The AUT also displays in the size and orientation specified in your tests. You can change the size or orientation with the {% url `cy.viewport()` viewport %} command or in your {% url "Cypress configuration" configuration#Viewport %}. If the AUT does not fit within the current browser window, it is scaled appropriately to fit within the window.

The current size and scale of the AUT is displayed in the top right corner of the window.

The image below shows that our application is displaying at `1000px` width, `660px` height and scaled to `100%`.

{% img /img/guides/viewport-scaling.png Viewport Scaling %}

*Note: The righthand side may also be used to display syntax errors in your test file that prevent the tests from running.*

{% img /img/guides/errors.png Errors %}
