slug: its
excerpt: Call properties on the current subject

`cy.its` calls regular properties on the current subject.

If you want to call a property that is a function on the current subject, use [`cy.invoke`](https://on.cypress.io/api/invoke).

| | |
|--- | --- |
| **Returns** | the property |
| **Timeout** | cannot timeout |

***

# [cy.its( *propertyName* )](#section-usage)

Invokes the function with the specified name

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