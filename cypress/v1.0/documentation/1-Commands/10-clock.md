slug: clock
excerpt: Control time in the browser

`cy.clock` overrides native global functions related to time, so you can test code using those functions in an easier, synchronous way. This includes the `setTimeout`, `clearTimeout`, `setInterval`, and `clearInterval` functions as well as controlling `Date` objects. Note that this only applies to the `top` window on a web page. It will not override the time functions on any iframes embedded on the web page.

`cy.clock` automatically restores the native functions in between tests without you having to explicitly restore them. You can still manually restore the functions within a test by calling `.restore()` on the `clock` object that `cy.clock` yields.

`cy.clock` pairs with [`cy.tick`](https://on.cypress.io/api/tick), which moves the clock along a certain number of milliseconds.

Subsequent calls to `cy.clock` will yield the `clock` object without re-overriding the native time functions.

| | |
|--- | --- |
| **Returns** | a `clock` object. See [clock API](#section-clock-api) |

***

# [cy.clock()](#section-usage)

Replaces `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval` and `Date` and allows them to be controlled synchronously via [`cy.tick`](https://on.cypress.io/api/tick) or the yielded `clock` object (see [clock API](#section-clock-api)). The clock starts at the unix epoch (timestamp of 0).

***

# [cy.clock( *now* )](#section-specify-the-now-timestamp)

Same as above, but starts the clock at the specified timestamp.

***

# [cy.clock( *now*, *functionNames* )](#section-specify-which-functions-to-override)

Same as above, but only overrides the functions in the array `functionNames`.

***

# clock API

`cy.clock` yields a `clock` object with the following methods. You can also access the `clock` object via `this.clock` in a `.then` callback.

## clock.tick(*milliseconds*)

Move the clock the specified number of `milliseconds`. Any timers within the affected range of time will be called. Note that `cy.tick` exists for this purpose as well for a more fluid.

## clock.restore()

Restore all overridden native functions. This is automatically called between tests, so should not generally be needed.

***

# Options

Pass in an options object to change the default behavior of `cy.clock`.

**cy.clock( *options* )**

**cy.clock( *now*,  *options* )**

**cy.clock( *now*, *functionNames*,  *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log

***

# Usage

## Create a clock and use it to trigger a setTimeout

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

## Specify the now timestamp

```javascript
// app code loaded by index.html
window.foo = () => {
  document.getElementById('#foo').textContent = new Date().toISOString()
}

// test
const now = new Date(2017, 0, 1).getTime() // Jan 1, 2017 timestamp
cy
  .clock(now)
  .visit("/index.html")
  .window().invoke("foo")
  .get("#foo")
    .contains("2017-01-01")
```

***

## Specify which functions to override

This will only override `setTimeout` and `clearTimeout` and leave the other time-related functions as they are.

```javascript
cy.clock(null, ["setTimeout", "clearTimeout"])
```

***

## Access the clock object to synchronously move time

In most cases, it's easier to [`cy.tick`](https://on.cypress.io/api/tick) to move time, but you can also use `clock` object yielded by `cy.clock`.

```javascript
cy.clock().then(function (clock) {
  clock.tick(1000)
})
```

You can call `cy.clock` again for this purpose later in a chain if necessary.

```javascript
cy
  .clock()
  .get("#foo")
  .type("Foo")
  .clock().then(function (clock) {
    clock.tick(1000)
  })
```

The clock object is also available via `this.clock` in any `.then` callback.

```javascript
cy
  .clock()
  .get("#foo").then(function ($foo) {
    this.clock.tick(1000)
    // do something with $foo ...
  })
```

***

## Access the clock object to restore native functions

In general, it should not be necessary to manually restore the native functions that `cy.clock` overrides, since this is done automatically between tests. But if you need to, the `clock` object yielded has `.restore` method.

```javascript
cy.clock().then(function (clock) {
  clock.restore()
})
```

Or via `this.clock`:

```javascript
cy
  .clock()
  .get("#foo").then(function ($foo) {
    this.clock.restore()
    // do something with $foo ...
  })
```

***

# Related

- [tick](https://on.cypress.io/api/tick)
- [stub](https://on.cypress.io/api/stub)
- [spy](https://on.cypress.io/api/spy)
