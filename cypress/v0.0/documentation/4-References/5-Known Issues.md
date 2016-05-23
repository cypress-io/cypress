slug: known-issues
excerpt: Known issues which cause problems in Cypress

# Contents

- :fa-angle-right: [Missing DOM Action Commands](#section-missing-dom-action-commands)
  - [Right click](#section-right-click)
  - [Hover](#section-hover)

***

# Missing DOM Action Commands

Some commands have not been implemented in Cypress. Some commands will be implemented in the future and some do not make sense to implement in Cypress.

***

## Right click

[Issue #53](https://github.com/cypress-io/cypress/issues/53)

## Workaround

Oftentimes you can use [`cy.invoke`](https://on.cypress.io/api/invoke) or [`cy.wrap`](https://on.cypress.io/api/wrap) to trigger the event or execute the action in the DOM.

**Example of right clicking on an element**
```javascript
cy.get("#nav").first().invoke("trigger", "contextmenu")
```

***

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
