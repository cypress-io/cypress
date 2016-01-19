slug: end
excerpt: End the command chain

### [cy.end()](#usage)

Ends the Cypress command chain and returns `null`. This is equivalent to the jQuery `end()` method.

***

## Usage

```javascript
// cy.end is useful when you want to end a chain of commands
// and force Cypress to re-query from the root element
cy
  .contains("User: Jennifer").click().end() // ends the current chain and returns null

  // queries the entire document again
  .contains("User: Brian").click()
```

***

## Related
1. [root](http://on.cypress.io/api/root)