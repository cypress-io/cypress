slug: its
excerpt: Call properties on the current subject

# [cy.its( *propertyName* )](#usage)

`cy.its` calls properties on the current subject and returns that new value.

`cy.its` is identical to [`cy.invoke`](https://on.cypress.io/api/invoke), which reads better when invoking function properties.


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