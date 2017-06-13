---
title: click
comments: false
---

Click a DOM element.

# Syntax

```javascript
.click()
.click(options)
.click(position)
.click(position, options)
.click(x, y)
.click(x, y, options)
```

## Usage

`.click()` requires being chained off another cy command that *yields* a DOM element.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('button').click()          // Click on button
cy.focused().click()              // Click on el with focus
cy.contains('Welcome').click()    // Click on first el containing 'Welcome'
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.click('button')          // Errors, cannot be chained off 'cy'
cy.window().click()         // Errors, 'window' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} position** ***(String)***

The position where the click should be issued. The `center` position is the default position. Valid positions are `topLeft`, `top`, `topRight`, `left`, `center`, `right`, `bottomLeft`, `bottom`, and `bottomRight`.

![cypress-command-positions-diagram](https://cloud.githubusercontent.com/assets/1271364/25048528/fe0c6378-210a-11e7-96bc-3773f774085b.jpg)

**{% fa fa-angle-right %} x** ***(Number)***

The distance in pixels from the element's left to issue the click.

**{% fa fa-angle-right %} y** ***(Number)***

The distance in pixels from the element's top to issue the click.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `.click()`.

Option | Default | Notes
--- | --- | ---
`force` | `false` | Force click, disables error checking prior to click
`interval` | `16` | Interval which to retry a click
`log` | `true` | Whether to display command in Command Log
`multiple` | `false` | Enable serially clicking multiple elements
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | Total time to retry the click

## Yields

`.click()` yields the element that was clicked.

## Timeout

`.click()` will wait until the element is in a 'clickable' state for the duration of the {% url `defaultCommandTimeout` configuration#Timeouts %} or the duration of the `timeout` specified in the command's options.

# Examples

## Click

**Click the button**

```javascript
cy.get('button').click()
```

## Position

**Specify a corner of the element to click**

Click the top right corner of the button.

```javascript
cy.get('button').click('topRight')
```

## Coordinates

**Specify explicit coordinates relative to the top left corner**

The click below will be issued inside of the element (15px from the left and 40px from the top).

```javascript
cy.get('button').click(15, 40)
```

## Options

**Force a click regardless of visibility or other elements in front of the element**

Forcing a click is useful when you want the click issued no matter what. Forcing a click disables checking that this element is visible and in a clickable state before clicking.

```javascript
cy.get('button').click({ force: true })
```

{% note warning  %}
Be careful with this option! It may allow the click to happen when it would be impossible for a real user to click.
{% endnote %}

**Force a click with position argument**

```javascript
cy.get('button').click('bottomLeft', { force: true })
```

**Force a click with relative coordinates**

```javascript
cy.get('button').click(5, 60, { force: true })
```
**Hover and clicking hidden elements**

{% note info %}
{% url 'Check out our example recipe on testing hover and working with hidden elements.' https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/hover_hidden_elements_spec.js %}
{% endnote %}

**Click all buttons found on the page**

```javascript
cy.get('button').click({ multiple: true })
```

# Notes

**Events that are fired**

```javascript
cy.get('button').click()
// mousedown
// focus
// mouseup
// click
```

The events are fired to spec, including the coordinates of where the event took place.

At the moment, `mouseover` and `mouseout` events are *not* fired. {% url 'Open an issue' https://github.com/cypress-io/cypress/issues/new %} if you need this to be fixed.

Additionally if the `mousedown` event causes the element to be removed from the DOM, the remaining events should continue to be fired, but to the resulting element left below the removed element. This has also not been implemented. {% url 'Open an issue' https://github.com/cypress-io/cypress/issues/new %} if you need this to be fixed.

**Focus is given to the first focusable element**

Clicking a `<span>`, for example, inside of a `<button>` gives the focus to the button, since that's what would happen in a real user scenario.

However, Cypress additionally handles situations where a child descendent is clicked inside of a focusable parent, but actually isn't visually inside the parent (per the CSS Object Model). In those cases if no focusable parent is found the window is given focus instead (which matches real browser behavior).

**Mousedown cancellation will not cause focus**

If the mousedown event has its default action prevented (`e.preventDefault()`) then the element will not receive focus as per the spec.

**Coordinates of a click**

The coordinates of the click will be recorded the exact moment the click happens. When hovering over the `click` command, Cypress displays a red "hitbox" indicator on the snapshot showing you where the click event occurred on the page.

**pointer-events: none**

Cypress does not currently factor in `pointer-events: none` in its clicking algorithm. {% url 'Open an issue' https://github.com/cypress-io/cypress/issues/new %} if you need this to be fixed.

**Element removal during `mousedown` or `mouseup`**

The spec states what should happen if the element clicked is removed from the DOM during `mousedown` or `mouseup`, but Cypress is not currently factoring this in. {% url 'Open an issue' https://github.com/cypress-io/cypress/issues/new %} if you need this to be fixed.

**Animations**

Unlike most testing frameworks, Cypress has built in logic for dealing with CSS and JavaScript animations. Cypress detects if an element is animating and waits until the element reaches a clickable state. You will never deal with a situation where Cypress accidentally clicks the *wrong* element.

However, sometimes when dealing with 3rd party plugins that animate, Cypress' logic to scroll an element into view can be affected.

Cypress attempts to position the element onscreen by scrolling all parent elements that need to be scrolled (just like a real user) prior to making a click. This *may* have an adverse affect if a 3rd party plugin is bound to the `scroll` event.

These situations are rare, but if you're having a difficult time clicking an element or experiencing seemingly *random* failures, you will save *yourself hours of debugging and headache* by simply issuing the `{force: true}` option to the click or by inserting a small delay prior to the click with {% url 'cy.wait()' wait %}. It is almost never worth your time trying to debug finicky animation issues caused by 3rd party plugins.

# Command Log

**Click the button in the form that has text "Create User"**

```javascript
cy.get('form').find('button').contains('Create User').click()
```

The commands above will display in the command log as:

![Command log for click](https://cloud.githubusercontent.com/assets/1271364/11458988/3cd5bae8-969a-11e5-9938-40a553402992.png)

When clicking on `click` within the command log, the console outputs the following:

![console.log for click](https://cloud.githubusercontent.com/assets/1271364/11458989/4036493c-969a-11e5-8f98-377dfce1f2c1.png)

# See also

- {% url `.check()` check %}
- {% url `.dblclick()` dblclick %}
- {% url `.select()` select %}
- {% url `.submit()` submit %}
