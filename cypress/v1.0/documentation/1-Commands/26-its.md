slug: its
excerpt: Call properties on the current subject

## [cy.its( *propertyName* )](#usage)

`cy.its` calls properties on the current subject and returns that new value.

`cy.its` is identical to [`cy.invoke`](http://on.cypress.io/api/invoke), which reads better when invoking function properties.


***

## Usage

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

## Related
1. [invoke](http://on.cypress.io/api/invoke)
2. [wrap](http://on.cypress.io/api/wrap)
3. [then](http://on.cypress.io/api/then)