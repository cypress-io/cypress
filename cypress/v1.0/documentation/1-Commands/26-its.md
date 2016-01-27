slug: its
excerpt: Get properties on the current subject

`cy.its` gets regular properties on the current subject.

If you want to call a function on the current subject, use [`cy.invoke`](https://on.cypress.io/api/invoke).

| | |
|--- | --- |
| **Returns** | the value of the property |
| **Timeout** | *cannot timeout* |

***

# [cy.its( *propertyName* )](#section-usage)

Gets the property with the specified name

***

# Usage

```javascript
cy.wrap({foo: "bar"}).its("foo").should("eq", "bar") // true
```

Call the `length` property on the current subject

```javascript
cy
  .get("ul li") // this returns us the jquery object
  .its("length") // calls the 'length' property returning that value
  .should("be.gt", 2) // ensure this length is greater than 2
})
```

***

# Related

- [invoke](https://on.cypress.io/api/invoke)
- [wrap](https://on.cypress.io/api/wrap)
- [then](https://on.cypress.io/api/then)