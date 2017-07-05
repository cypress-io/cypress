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

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.get('button').click()          // Click on button
cy.focused().click()              // Click on el with focus
cy.contains('Welcome').click()    // Click on first el containing 'Welcome'
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.click('button')          // Errors, cannot be chained off 'cy'
cy.window().click()         // Errors, 'window' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} position** ***(String)***

The position where the click should be issued. The `center` position is the default position. Valid positions are `topLeft`, `top`, `topRight`, `left`, `center`, `right`, `bottomLeft`, `bottom`, and `bottomRight`.

![cypress-command-positions-diagram](/img/api/coordinates-diagram.jpg)

**{% fa fa-angle-right %} x** ***(Number)***

The distance in pixels from the element's left to issue the click.

**{% fa fa-angle-right %} y** ***(Number)***

The distance in pixels from the element's top to issue the click.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `.click()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`force` | `false` | {% usage_options force click %}
`multiple` | `false` | {% usage_options multiple click %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .click %}

## Yields {% helper_icon yields %}

{% yields same_subject .click %}

# Examples

## No Args

***Click the button***

```javascript
cy.get('button').click()
```

## Position

***Specify a corner of the element to click***

Click the top right corner of the button.

```javascript
cy.get('button').click('topRight')
```

## Coordinates

***Specify explicit coordinates relative to the top left corner***

The click below will be issued inside of the element (15px from the left and 40px from the top).

```javascript
cy.get('button').click(15, 40)
```

## Options

***Force a click regardless of its actionable state***

Forcing a click overrides the {% url 'actionable checks' interacting-with-elements#Forcing %} Cypress applies and will automatically fire the events.

```javascript
cy.get('button').click({ force: true })
```

***Force a click with position argument***

```javascript
cy.get('button').click('bottomLeft', { force: true })
```

***Force a click with relative coordinates***

```javascript
cy.get('button').click(5, 60, { force: true })
```

***Click all buttons found on the page***

By default, Cypress will error if you're trying to click multiple elements. By passing `{ multiple: true }` Cypress will iteratively apply the click to each element and will also log to the {% url 'Command Log' overview-of-the-gui#Command-Log %} multiple times.

```javascript
cy.get('button').click({ multiple: true })
```

# Notes

## Actionability

***The element must first reach actionability***

`.click()` is an "action command" that follows all the rules {% url 'defined here' interacting-with-elements %}.

## Events

***Events that are fired:***

```javascript
cy.get('button').click()
// mousedown
// focus
// mouseup
// click
```

The events are fired to spec, including the coordinates of where the event took place.

At the moment, `mouseover` and `mouseout` events are *not* fired. {% open_an_issue %} if you need this to be fixed.

Additionally if the `mousedown` event causes the element to be removed from the DOM, the remaining events should continue to be fired, but to the resulting element left below the removed element. This has also not been implemented. {% open_an_issue %} if you need this to be fixed.

## Focus

***Focus is given to the first focusable element***

For example, clicking a `<span>` inside of a `<button>` gives the focus to the button, since that's what would happen in a real user scenario.

However, Cypress additionally handles situations where a child descendent is clicked inside of a focusable parent, but actually isn't visually inside the parent (per the CSS Object Model). In those cases if no focusable parent is found the window is given focus instead (which matches real browser behavior).

## Cancellation

***Mousedown cancellation will not cause focus***

If the mousedown event has its default action prevented (`e.preventDefault()`) then the element will not receive focus as per the spec.

***Element removal during `mousedown` or `mouseup`***

The spec states what should happen if the element clicked is removed from the DOM during `mousedown` or `mouseup`, but Cypress is not currently factoring this in. {% open_an_issue %} if you need this to be fixed.

***pointer-events: none***

Cypress does not currently factor in `pointer-events: none` in its clicking algorithm. {% open_an_issue %} if you need this to be fixed.

# Rules

## Requirements {% helper_icon requirements %}

{% requirements dom .click %}

## Assertions {% helper_icon assertions %}

{% assertions actions .click %}

## Timeouts {% helper_icon timeout %}

{% timeouts actions .click %}

# Command Log

***Click the button in the form that has text "Create User"***

```javascript
cy.get('form').find('button').contains('Create User').click()
```

The commands above will display in the command log as:

![Command log for click](/img/api/click/click-button-in-form-during-test.png)

When clicking on `click` within the command log, the console outputs the following:

![console.log for click](/img/api/click/click-coords-and-events-in-console.png)

# See also

- {% url `.check()` check %}
- {% url `.dblclick()` dblclick %}
- {% url `.select()` select %}
- {% url `.submit()` submit %}
