slug: end
excerpt: End the command chain

Ends the Cypress command chain and returns `null`. This is equivalent to the jQuery `end()` method.

| | |
|--- | --- |
| **Returns** | `null` |
| **Timeout** | cannot timeout |

***

# [cy.end()](#usage)

End the command chain.

***

# Usage

```javascript
// cy.end is useful when you want to end a chain of commands
// and force Cypress to re-query from the root element
cy
  .contains("User: Cheryl").click().end() // ends the current chain and returns null

  // queries the entire document again
  .contains("User: Charles").click()
```

***

# Command Log

## `end` does *not* log in the command log

```javascript
cy
  .contains(".modal-title", "Select Folder Type").end()
  .contains("li", "Maintenance").should("have.class", "active")
```

The commands above will display in the command log as:

![screen shot 2016-01-21 at 11 28 39 am](https://cloud.githubusercontent.com/assets/1271364/12486875/8aa69ff0-c032-11e5-815d-b29a5020271a.png)

***

# Related

- [root](https://on.cypress.io/api/root)
- [within](https://on.cypress.io/api/within)
