slug: tick
excerpt: Move time in the browser

`cy.tick` is used to move time after overriding native time functions with [`cy.clock`](https://on.cypress.io/api/clock).

It moves the clock the specified number of `milliseconds`. Any timers within the affected range of time will be called.

`cy.clock` must be called before `cy.tick` in order to override native time functions first.

| | |
|--- | --- |
| **Returns** | the `clock` object. See [clock API](https://on.cypress.io/api/clock#section-clock-api) |

***

# [cy.tick( *milliseconds* )](#section-usage)

Moves the clock the specified number of `milliseconds`. Any timers within the affected range of time will be called.

***

# Usage

## Create a clock and move time to trigger a setTimeout

```javascript
// app code loaded by index.html
window.foo = () => {
  setTimeout(() => {
    document.getElementById('#foo').textContent = 'Foo'
  }, 500)
}

// test
cy
  .clock()
  .visit("/index.html")
  .window().invoke("foo")
  .tick(500)
  .get("#foo")
    .should("have.text", "Foo")
```

***

# Related

- [clock](https://on.cypress.io/api/clock)
- [stub](https://on.cypress.io/api/stub)
- [spy](https://on.cypress.io/api/spy)
