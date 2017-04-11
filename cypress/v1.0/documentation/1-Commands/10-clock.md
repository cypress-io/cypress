slug: clock
excerpt: Control time in the browser

`cy.clock` overrides native global functions related to time, so you can test code using those functions in an easier, synchronous way. This includes the `setTimeout`, `clearTimeout`, `setInterval`, and `clearInterval` functions as well as controlling `Date` objects. Note that this only applies to the `top` window on a web page. It will not override the time functions on any iframes embedded on the web page.

`cy.clock` automatically restores the native functions in between tests without you having to explicitly restore them. You can still manually restore the functions within a test by calling `.restore()` on the `clock` object that `cy.clock` yields.

`cy.clock` pairs with [`cy.tick`](https://on.cypress.io/api/tick), which moves the clock along a certain number of milliseconds.

Subsequent calls to `cy.clock` will yield the `clock` object without re-overriding the native time functions.

If you call `cy.clock` before visiting a page with [`cy.visit`](https://on.cypress.io/api/visit), the page's native global functions will be overridden on window load, before any of your app code runs, so even if `setTimeout`, for example, is called on page load, it can still be controlled via [`cy.tick`](https://on.cypress.io/api/tick). This also applies if, during the course of a test, the page under test is reloaded or changed.

| | |
|--- | --- |
| **Returns** | a `clock` object. See [clock API](#clock-api) |

***

# [cy.clock()](#usage)

Replaces `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval` and `Date` and allows them to be controlled synchronously via [`cy.tick`](https://on.cypress.io/api/tick) or the yielded `clock` object (see [clock API](#clock-api)).

The clock starts at the unix epoch (timestamp of 0). This means that when you instantiate `new Date` in your application, it will have a time of `January 1st, 1970`.

***

# [cy.clock( *now* )](#specify-the-now-timestamp)

Same as above, but starts the clock at the specified timestamp.

***

# [cy.clock( *now*, *functionNames* )](#specify-which-functions-to-override)

Same as above, but only overrides the functions in the array `functionNames`.

***

# clock API

`cy.clock` yields a `clock` object with the following methods. You can also access the `clock` object via `this.clock` in a [`cy.then`](https://on.cypress.io/api/then) callback.

## clock.tick(*milliseconds*)

Move the clock the specified number of `milliseconds`. Any timers within the affected range of time will be called.

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

## Create a clock and use it to trigger a setInterval

```javascript
// your app code
var seconds = 0

setInterval(function(){
  $('#seconds-elapsed').text(++seconds + ' seconds')
}, 1000)
```

```javascript
// test code
cy
  .clock()
  .visit("/index.html")
  .tick(1000)
  .get("#seconds-elapsed")
    .should("have.text", "1 seconds")
  .tick(1000)
  .get("#seconds-elapsed")
    .should("have.text", "2 seconds")
```

***

## Specify the now timestamp

```javascript
// your app code
$('#date').text(new Date().toJSON())
```

```javascript
// test code
const now = new Date(2017, 2, 14).getTime() // March 14, 2017 timestamp

cy
  .clock(now)
  .visit("/index.html")
  .get("#date")
    .contains("2017-03-14")
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

When clicking on the `clock` command within the command log, the console outputs the following:

<img width="1059" alt="screen shot of console output" src="https://cloud.githubusercontent.com/assets/1157043/22437920/0786f9d8-e6f8-11e6-9e77-926b15aa8dae.png">

***

# Related

- [Guide: Stubs, Spies and Clocks ](https://on.cypress.io/guides/stubs-spies-clocks)
- [Recipe: Controlling Behavior with Spies, Stubs, and Clocks](https://github.com/cypress-io/cypress-example-recipes#controlling-behavior-with-spies-stubs-and-clocks)
- [tick](https://on.cypress.io/api/tick)
- [spy](https://on.cypress.io/api/spy)
- [stub](https://on.cypress.io/api/stub)
