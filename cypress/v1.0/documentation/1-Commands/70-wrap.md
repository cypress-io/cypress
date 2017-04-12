slug: wrap
excerpt: Wrap an object

Return the object passed into `cy.wrap`.

| | |
|--- | --- |
| **Returns** | the object passed into `cy.wrap` |
| **Timeout** | *cannot timeout* |

***

# [cy.wrap( *object* )](#usage)

Return the object passed into `cy.wrap`.

***

# Options

Pass in an options object to change the default behavior of `cy.wrap`.

**cy.wrap( *object*, *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log

***

# Usage

## Invokes the function on the subject in wrap and returns the new value.

```javascript
var fn = function(){
  return "bar"
}

cy.wrap({foo: fn}).invoke("foo").should("eq", "bar") // true
```

***

# Related

- [invoke](https://on.cypress.io/api/invoke)
- [its](https://on.cypress.io/api/its)
- [then](https://on.cypress.io/api/then)
