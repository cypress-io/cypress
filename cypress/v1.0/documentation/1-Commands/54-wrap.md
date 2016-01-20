slug: wrap
excerpt: Invoke the function on the current subject

# [cy.wrap()](#usage)

***

# Usage

Invokes the function on the subject in wrap and returns the new value.

```javascript
var fn = function(){
  return "bar"
}

cy.wrap({foo: fn}).invoke("foo").should("eq", "bar") // true
```

***

# Related

1. [invoke](http://on.cypress.io/api/invoke)
1. [its](http://on.cypress.io/api/its)
2. [then](http://on.cypress.io/api/then)
