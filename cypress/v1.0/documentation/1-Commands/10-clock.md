slug: clock
excerpt: Control time in the browser

`cy.clock` overrides native global functions related to time, so you can test code using those functions in an easier, synchronous way. This includes the `setTimeout`, `clearTimeout`, `setInterval`, and `clearInterval` functions as well as controlling `Date` objects.

`cy.clock` automatically restores the native functions in between tests without you having to explicitly restore them. You can still manually restore the methods within a test by calling `clock.restore()`.

Unlike most Cypress commands, `cy.clock` is synchronous and returns a value (the clock) instead of a Promise-like chain-able object.

***

# [cy.clock()](#section-usage)

Replaces `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval` and `Date` and allows them to be controlled synchronously via the returned `clock` object (see [clock API](#section-clock-api)). The clock starts at the unix epoch (timestamp of 0).

***

# [cy.clock( *now* )](#section-specify-the-now-timestamp)

Same as above, but starts the clock at the specified timestamp.

***

# [cy.clock( [*now*, ] *"functionName1"*, *"functionName2"*, ... )](#section-specify-which-functions-to-override)

Same as abvoe, but start the clock at `now` and only override the specified functions. Can also be called without the `now` argument.

***

# clock API

## clock.tick(*milliseconds*)

Move the clock the specified number of `milliseconds`. Any timers within the affected range of time will be called.

## clock.restore()

Restore all overridden native methods. This is automatically called between tests, so should not generally be needed.

***

# Usage

## Create a clock and use it to trigger a setTimeout

```javascript
// app code loaded by index.html
setTimeout(() => {
  document.getElementById('#foo').textContent = 'Foo'
}, 500)

// test
const clock = cy.clock()
cy
  .visit("/index.html")
  .then(() => {
    clock.tick(500)
  })
  .get("#foo")
    .should("have.text", "Foo")
```

***

## Specify the now timestamp

```javascript
// app code loaded by index.html
document.getElementById('#foo').textContent = new Date().toISOString()

// test
const now = new Date(2017, 0, 1).getTime() // Jan 1, 2017 timestamp
const clock = cy.clock(now)
cy
  .visit("/index.html")
  .get("#foo")
    .contains("2017-01-01")
```

***

## Specify which functions to override

This will only override `setTimeout` and `clearTimeout` and leave the other time-related functions as they are.

```javascript
// these are equivalent
cy.clock(null, "setTimeout", "clearTimeout")
cy.clock("setTimeout", "clearTimeout")
```

***

# Related

- [stub](https://on.cypress.io/api/stub)
- [spy](https://on.cypress.io/api/spy)
