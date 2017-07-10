---
title: tick
comments: false
---

Move time after overriding a native time function with {% url `cy.clock()` clock %}.

{% note warning %}
{% url `cy.clock()` clock %} must be called before `cy.tick()` in order to override native time functions first.
{% endnote %}

# Syntax

```javascript
cy.tick(milliseconds)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.tick(500)
```

## Arguments

**{% fa fa-angle-right %} milliseconds** ***(Number)***

The number of `milliseconds` to move the clock. Any timers within the affected range of time will be called.

## Yields {% helper_icon yields %}

`cy.tick()` yields a `clock` object with the following methods:

- **`clock.tick(milliseconds)`**

  Move the clock a number of milliseconds. Any timers within the affected range of time will be called.

- **`clock.restore()`**

  Restore all overridden native functions. This is automatically called between tests, so should not generally be needed.

You can also access the `clock` object via `this.clock` in a {% url `.then()` then %} callback.

# Examples

## Milliseconds

***Create a clock and move time to trigger a `setTimeout`***

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

***Using `cy.clock()` and `cy.tick()`***

{% note info %}
{% url "Check out our example recipe testing spying, stubbing and time" stubs-spies-and-clocks-recipe %}
{% endnote %}

# Rules

## Requirements {% helper_icon requirements %}

{% requirements tick cy.tick %}

## Assertions {% helper_icon assertions %}

{% assertions utility cy.tick %}

## Timeouts {% helper_icon timeout %}

{% timeouts none cy.tick %}

# Command Log

***Create a clock and tick it 1 second***

```javascript
cy.clock()
cy.tick(1000)
```

The command above will display in the command log as:

![Command Log](/img/api/tick/tick-machine-clock-1-second-in-time.png)

When clicking on the `tick` command within the command log, the console outputs the following:

![Console Log](/img/api/tick/console-shows-same-clock-object-as-clock-command.png)

# See also

- {% url `cy.clock()` clock %}
- {% url `cy.spy()` spy %}
- {% url `cy.stub()` stub %}
- {% url 'Guide: Stubs, Spies and Clocks' stubs-spies-and-clocks %}
- {% url "Recipe: Controlling Behavior with Spies, Stubs, and Clocks" stubs-spies-and-clocks-recipe %}
