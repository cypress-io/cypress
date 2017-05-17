slug: its
excerpt: Get properties on the current subject

`cy.its` gets regular properties on the current subject.

If you want to call a function on the current subject, use [`cy.invoke`](https://on.cypress.io/api/invoke).

| | |
|--- | --- |
| **Returns** | the value of the property |
| **Timeout** | `cy.its` cannot timeout unless you've added assertions. The assertions will retry for the duration of [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) |

***

# [cy.its( *propertyName* )](#section-usage)

Gets the property with the specified name.

You can also access multiple nested properties with **dot notation**.

***

# Usage

## Access properties

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

## Access functions

You can access functions to then drill into their own properties instead of invoking them.

```javascript
// Your app code

// a basic Factory constructor
var Factory = function(arg){
  ...
}

Factory.create = function(arg){
  return new Factory(arg)
}

// assign it to the window
window.Factory = Factory
```

```javascript
cy
  .window() // get the window object
  .its("Factory") // now we are on the Factory function
  .invoke("create", "arg") // and now we can invoke properties on it

```

[block:callout]
{
  "type": "info",
  "body": "[Check out our example recipe on testing window.fetch using cy.its()](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/spy_stub_clock_spec.js)",
  "title": "Testing cy.window().its('fetch')"
}
[/block]

***

## Drill into nested properties

You can additionally automatically drill into nested properties by using **dot notation**.

```javascript
var obj = {
  foo: {
    bar: {
      baz: "quux"
    }
  }
}

cy.wrap(obj).its("foo.bar.baz").should("eq", "quux") // true
```

***

# Command Log

## Fetch 'comments' fixture

```javascript
cy
  .server()
  .route(/comments/, 'fixture:comments.json').as('getComments')
  .get('#fetch-comments').click()
  .wait('@getComments')
    .its('responseBody')
    .should('deep.eq', [
      {id: 1, comment: 'hi'},
      {id: 2, comment: 'there'}
    ])
```

The commands above will display in the command log as:

![screen shot 2016-05-24 at 12 39 40 pm](https://cloud.githubusercontent.com/assets/1268976/15512229/d512cbb4-21ac-11e6-9a9a-5d358ae4fe4b.png)

When clicking on `its` within the command log, the console outputs the following:

![screen shot 2016-05-24 at 12 40 17 pm](https://cloud.githubusercontent.com/assets/1268976/15512225/d14723cc-21ac-11e6-88d5-39ffe6c0a195.png)

***

# Related

- [invoke](https://on.cypress.io/api/invoke)
- [wrap](https://on.cypress.io/api/wrap)
- [then](https://on.cypress.io/api/then)
