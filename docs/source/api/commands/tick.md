---
title: tick
comments: false
---

Move time after overriding a native time function with {% url `cy.clock()` clock %}.

{% note warning %}
{% url `cy.clock()` clock %} must be called before `cy.tick` in order to override native time functions first.
{% endnote %}

# Syntax

```javascript
cy.tick(milliseconds)
```

## Usage

`cy.tick()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.tick(500)
```

## Arguments

**{% fa fa-angle-right %} milliseconds** ***(Number)***

The number of `milliseconds` to move the clock. Any timers within the affected range of time will be called.

## Yields

`cy.tick()` yields a `clock` object with the following methods:

- **`clock.tick(milliseconds)`**

  Move the clock a number of milliseconds. Any timers within the affected range of time will be called.

- **`clock.restore()`**

  Restore all overridden native functions. This is automatically called between tests, so should not generally be needed.

You can also access the `clock` object via `this.clock` in a {% url `.then()` then %} callback.


# Examples

## Move time

**Create a clock and move time to trigger a `setTimeout`**

```javascript
// app code loaded by index.html
window.addIntro = () => {
  setTimeout(() => {
    document.getElementById('#header').textContent = 'Hello, World'
  }, 500)
}
```

```javascript
cy.clock()
cy.visit('/index.html')
cy.window().invoke('addIntro')
cy.tick(500)
cy.get('#header').should('have.text', 'Hello, World')
```

**Using `cy.clock()` and `cy.tick()`**

{% note info %}
{% url "Check out our example recipe testing spying, stubbing and time" https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/spy_stub_clock_spec.js %}
{% endnote %}

# Command Log

**Create a clock and tick it 1 second**

```javascript
cy.clock()
cy.tick(1000)
```

The command above will display in the command log as:

![Command Log](https://cloud.githubusercontent.com/assets/1157043/22437918/059f60a6-e6f8-11e6-903d-d868e044615d.png)

When clicking on the `tick` command within the command log, the console outputs the following:

![Console Log](https://cloud.githubusercontent.com/assets/1157043/22438009/504fecd8-e6f8-11e6-8ef1-4d7cb0b5594c.png)

# See also

- {% url `cy.clock()` clock %}
- {% url 'Guide: Stubs, Spies and Clocks' stubs-spies-clocks %}
- {% url "Recipe: Controlling Behavior with Spies, Stubs, and Clocks" https://github.com/cypress-io/cypress-example-recipes#controlling-behavior-with-spies-stubs-and-clocks %} 
- {% url `cy.spy()` spy %}
- {% url `cy.stub()` stub %}
