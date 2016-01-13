excerpt: Call properties on the current subject
slug: its

`cy.its` calls properties on the current subject.

`cy.its` is identical to [`cy.invoke`](/v1.0/docs/invoke), which reads better when invoking function properties.

### [cy.its( *propertyName* )](#usage)

Calls a property on the current subject and returns that new value.

```javascript
cy.wrap({foo: "bar"}).its("foo").should("eq", "bar") // true
```

***

## Usage

#### Call the `length` property on the current subject

```javascript
cy
  .get("ul li") // this returns us the jquery object
  .its("length") // calls the 'length' property returning that value
  .should("be.gt", 2) // ensure this length is greater than 2
})
```

***

## Related
1. [invoke](/v1.0/docs/invoke)
2. [wrap](/v1.0/docs/wrap)
3. [then](/v1.0/docs/then)