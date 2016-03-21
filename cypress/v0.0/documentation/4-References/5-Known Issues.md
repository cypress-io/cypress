slug: known-issues
excerpt: Known issues which cause problems in Cypress

# Contents

- :fa-angle-right: [Switching tabs causes Cypress to fail](#section-switching-tabs-causes-cypress-to-fail)
- :fa-angle-right: [Missing DOM Action Commands](#section-missing-dom-action-commands)
  - [Right click](#section-right-click)
  - [Hover](#section-hover)

***

# Switching tabs causes Cypress to fail

## Problem

[https://github.com/cypress-io/cypress/issues/9](https://github.com/cypress-io/cypress/issues/9)

While your tests are running if you switch to a different tab you will notice your tests time out.

This is due to Chrome. When a tab is **backgrounded** Chrome will automatically throttle back `setTimeouts` from `.004s` to `1s`. This is a decrease in performance of **250x**.

There is no way for Cypress to control this behavior, as Chrome has also removed the special `--disable-renderer-backgrounding` flag.

You'll see your tests fail because Cypress cannot issue its commands fast enough. Your application's code is also being throttled which can cause separate failures as well.

## Workaround

To work around this issue, don't switch to a different tab. Instead run Cypress in its own window. You can switch between Chrome windows without causing throttling.

This problem only manifests itself while you're developing your tests locally. CI is unaffected.

If you see these timeouts happening, don't worry - just refresh your tests and move on. You can try to either run less tests all at once, or run them headlessly (which is also unaffected by this problem).

***

# Missing DOM Action Commands

Some commands have not been implemented in Cypress. Some commands will be implemented in the future and some do not make sense to implement in Cypress.

## Right click

[Issue #53](https://github.com/cypress-io/cypress/issues/53)

## Workaround

Oftentimes you can use [`cy.invoke`](https://on.cypress.io/api/invoke) or [`cy.wrap`](https://on.cypress.io/api/wrap) to trigger the event or execute the action in the DOM.

**Example of right clicking on an element**
```javascript
cy.get("#nav").first().invoke("trigger", "contextmenu")
```

## Hover

[Issue #10](https://github.com/cypress-io/cypress/issues/10)

Sometimes an element has specific logic on hover. Maybe the element doesn't even display to be clickable until you hover over a specific element.

## Workaround

Oftentimes you can use [`cy.invoke`](https://on.cypress.io/api/invoke) or [`cy.wrap`](https://on.cypress.io/api/wrap) to show the element before you perform the action.

**Example of showing an element in order to perform action**
```javascript
cy.get(".content").invoke("show").click()
```

You can also force the action to be performed on the element regardless of whether the element is visible or not.

**Example of clicking on a hidden element**
```javascript
cy.get(".content").click({force: true})
```

**Example of checking a hidden element**
```javascript
cy.get(".checkbox").check({force: true})
```
