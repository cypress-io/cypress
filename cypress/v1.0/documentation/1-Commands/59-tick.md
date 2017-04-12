slug: tick
excerpt: Move time in the browser

`cy.tick` is used to move time after overriding native time functions with [`cy.clock`](https://on.cypress.io/api/clock).

It moves the clock the specified number of `milliseconds`. Any timers within the affected range of time will be called.

[`cy.clock`](https://on.cypress.io/api/clock) must be called before `cy.tick` in order to override native time functions first.

| | |
|--- | --- |
| **Returns** | the `clock` object. See [clock API](https://on.cypress.io/api/clock#clock-api) |

***

# [cy.tick( *milliseconds* )](#usage)

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


## Example Recipe

[block:callout]
{
  "type": "info",
  "body": "[Check out our example recipe testing spying, stubbing and time](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/spy_stub_clock_spec.js)",
  "title": "Using cy.clock and cy.tick"
}
[/block]

***

# Command Log

## Create a clock and tick it 1 second

```javascript
cy
  .clock()
  .tick(1000)
```

The command above will display in the command log as:

<img width="448" alt="screen shot of command log" src="https://cloud.githubusercontent.com/assets/1157043/22437918/059f60a6-e6f8-11e6-903d-d868e044615d.png">

When clicking on the `tick` command within the command log, the console outputs the following:

<img width="1059" alt="screen shot of console output" src="https://cloud.githubusercontent.com/assets/1157043/22438009/504fecd8-e6f8-11e6-8ef1-4d7cb0b5594c.png">

***

# Related

- [Guide: Stubs, Spies and Clocks ](https://on.cypress.io/guides/stubs-spies-clocks)
- [Recipe: Controlling Behavior with Spies, Stubs, and Clocks](https://github.com/cypress-io/cypress-example-recipes#controlling-behavior-with-spies-stubs-and-clocks)
- [clock](https://on.cypress.io/api/clock)
- [stub](https://on.cypress.io/api/stub)
- [spy](https://on.cypress.io/api/spy)
