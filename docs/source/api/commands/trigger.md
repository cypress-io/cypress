---
title: trigger
comments: true
description: ''
---

Trigger an event on a DOM element.  

# Syntax

```javascript
.trigger(eventName)
.trigger(eventName, position)
.trigger(eventName, options)
.trigger(eventName, x, y)
.trigger(eventName, position, options)
.trigger(eventName, x, y, options)
```

## Usage

`.trigger()` requires being chained off another cy command that *yields* a DOM element.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('a').trigger('mousedown') // Trigger mousedown event on link
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.trigger('touchstart')             // Errors, cannot be chained off 'cy'
cy.location().trigger('mouseleave')  // Errors, 'location' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} eventName**  ***(String)***

The name of the `event` to be triggered on the DOM element.


**{% fa fa-angle-right %} position** ***(String)***

The position where the event should be triggered. The `center` position is the default position. Valid positions are `topLeft`, `top`, `topRight`, `left`, `center`, `right`, `bottomLeft`, `bottom`, and `bottomRight`.

![cypress-command-positions-diagram](https://cloud.githubusercontent.com/assets/1271364/25048528/fe0c6378-210a-11e7-96bc-3773f774085b.jpg)

**{% fa fa-angle-right %} x** ***(Number)***

The distance in pixels from element's left to trigger the event.

**{% fa fa-angle-right %} y** ***(Number)***

The distance in pixels from element's top to trigger the event.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.trigger()`.

Option | Default | Notes
--- | --- | ---
`bubbles` | `true` | Whether the event bubbles
`cancelable` | `true` | Whether the event is cancelable
`interval` | `16` | Interval which to retry triggering the event
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry triggering the event
`log` | `true` | whether to display command in command log

You can also include arbitrary event properties (e.g. `clientX`, `shiftKey`) and they will be attached to the event. Passing in coordinate arguments (`clientX`, `pageX`, etc) will override the position coordinates.

## Yields

`.trigger()` yields the DOM subject chained from the previous command.

## Timeout

`.trigger()` will wait until the element is in an 'interactable' state for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) or the duration of the `timeout` specified in the command's options


The DOM element must be in an "interactable" state prior to the triggered event happening (it must be visible and not disabled).



Cypress automatically scrolls the element into view prior to attempting to trigger the event.

# Examples

## Mouse Events

**Trigger a `mouseover` on the button**

```javascript
cy.get('button').trigger('mouseover') // yields 'button'
```

**Drag and Drop**

{% note info %}
[Check out our example recipe triggering mouse and drag events to test dragging and dropping](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/drag_n_drop_spec.js)
{% endnote %}

## Change Event

**Interact with a range input (slider**)

To interact with a range input (slider), we need to set its value and
then trigger the appropriate event to signal it has changed.

Below we invoke jQuery's `val()` method to set the value, then trigger the `change` event.

Note that some implementations may rely on the `input` event instead, which is fired as a user moves the slider, but is not supported by some browsers.

```javascript
cy.get('input[type=range]').as('range')
  .invoke('val', 25)
  .ttrigger('change')
cy.get('@range').siblings('p').should('have.text', '25')
```

## Position

**Trigger a `mousedown` on the top right of a button**

```javascript
cy.get('button').trigger('mousedown', 'topRight')
```

## Coordinates

**Specify explicit coordinates relative to the top left corner**

```javascript
cy.get('button').trigger('contextmenu', 15, 40)
```

## Options

**Specify that the event should not bubble**

By default, the event will bubble up the DOM tree. This will prevent the event from bubbling.

```javascript
cy.get('button').trigger('mouseover', { bubbles: false })
```

**Specify the exact `clientX` and `clientY` the event should have**

This overrides the default auto-positioning based on the element itself. Useful for events like `mousemove` where you need the position to be outside the element itself.

```javascript
cy.get('button').trigger('mousemove', {clientX: 200, clientY: 300})
```

# Notes

**What event should I fire?**

`cy.trigger` is meant to be a low-level utility that makes triggering events easier than manually constructing and dispatching them. Since any arbitrary event can be triggered, Cypress tries not to make any assumptions about how it should be triggered. This means you'll need to know the implementation details (which may be in a 3rd party library) of the event handler(s) receiving the event and provide the necessary properties.

# Command Log

**Trigger a `mouseover` event on the first button**

```javascript
cy.get('button').first().trigger('mouseover')
```

The commands above will display in the command log as:

<img width="364" alt="Command log output" src="https://cloud.githubusercontent.com/assets/1157043/23477277/749d347e-fe8b-11e6-9c31-6667f7ff65d8.png">

When clicking on `trigger` within the command log, the console outputs the following:

<img width="630" alt="Console output" src="https://cloud.githubusercontent.com/assets/1157043/23477276/749aac54-fe8b-11e6-81b3-e7600cca0ba0.png">

# See also

- [blur](https://on.cypress.io/api/blur)
- [check](https://on.cypress.io/api/check)
- [click](https://on.cypress.io/api/click)
- [focus](https://on.cypress.io/api/focus)
- [select](https://on.cypress.io/api/select)
- [submit](https://on.cypress.io/api/submit)
- [type](https://on.cypress.io/api/type)
- [uncheck](https://on.cypress.io/api/uncheck)
