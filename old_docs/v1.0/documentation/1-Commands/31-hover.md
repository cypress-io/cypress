slug: hover
excerpt: Hover over a DOM element

**Cypress does not have a `cy.hover()` command.** See [Issue #10](https://github.com/cypress-io/cypress/issues/10).

If `cy.hover()` is used, an error will display and redirect you to this page.

## Workaround

Sometimes an element has specific logic on hover and you *do* need to "hover" in Cypress. Maybe the element doesn't even display to be clickable until you hover over another element.

Oftentimes you can use [`cy.invoke`](https://on.cypress.io/api/invoke) or [`cy.wrap`](https://on.cypress.io/api/wrap) to show the element before you perform the action.

**Example of showing an element in order to perform action**
```javascript
cy.get(".content").invoke("show").click()
```

[block:callout]
{
  "type": "info",
  "body": "[Check out our example recipe on testing hover and working with hidden elements](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/hover_hidden_elements.js)",
  "title": "Dealing with hover and hidden elements"
}
[/block]

You can also force the action to be performed on the element regardless of whether the element is visible or not.

**Example of clicking on a hidden element**
```javascript
cy.get(".content").click({force: true})
```

**Example of checking a hidden element**
```javascript
cy.get(".checkbox").check({force: true})
```

If the hover behavior depends on a JavaScript event like `mouseover`, you can trigger the event to achieve that behavior.

**Example of triggering a mouseover event**
```javascript
cy.get(".content").trigger("mouseover")
```

***

# Related

- [Recipe: Dealing with Hover and Hidden Elements](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/hover_hidden_elements.js)
- [invoke](https://on.cypress.io/api/invoke)
- [trigger](https://on.cypress.io/api/trigger)
- [wrap](https://on.cypress.io/api/wrap)
