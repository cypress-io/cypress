---
title: trigger
comments: false
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

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.get('a').trigger('mousedown') // Trigger mousedown event on link
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.trigger('touchstart')             // Errors, cannot be chained off 'cy'
cy.location().trigger('mouseleave')  // Errors, 'location' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} eventName**  ***(String)***

The name of the `event` to be triggered on the DOM element.

**{% fa fa-angle-right %} position** ***(String)***

The position where the event should be triggered. The `center` position is the default position. Valid positions are `topLeft`, `top`, `topRight`, `left`, `center`, `right`, `bottomLeft`, `bottom`, and `bottomRight`.

{% img /img/api/coordinates-diagram.jpg "cypress-command-positions-diagram" %}

**{% fa fa-angle-right %} x** ***(Number)***

The distance in pixels from element's left to trigger the event.

**{% fa fa-angle-right %} y** ***(Number)***

The distance in pixels from element's top to trigger the event.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.trigger()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`force` | `false` | {% usage_options force trigger %}
`bubbles` | `true` | Whether the event bubbles
`cancelable` | `true` | Whether the event is cancelable
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .trigger %}

You can also include arbitrary event properties (e.g. `clientX`, `shiftKey`) and they will be attached to the event. Passing in coordinate arguments (`clientX`, `pageX`, etc) will override the position coordinates.

## Yields {% helper_icon yields %}

{% yields same_subject .trigger %}

# Examples

## Mouse Events

***Trigger a `mouseover` on the button***

The DOM element must be in an "interactable" state prior to the triggered event happening (it must be visible and not disabled).

```javascript
cy.get('button').trigger('mouseover') // yields 'button'
```

***Drag and Drop***

{% note info %}
{% url 'Check out our example recipe triggering mouse and drag events to test dragging and dropping' testing-the-dom-recipe %}
{% endnote %}

## Change Event

***Interact with a range input (slider)***

To interact with a range input (slider), we need to set its value and
then trigger the appropriate event to signal it has changed.

Below we invoke jQuery's `val()` method to set the value, then trigger the `change` event.

Note that some implementations may rely on the `input` event instead, which is fired as a user moves the slider, but is not supported by some browsers.

```javascript
cy.get('input[type=range]').as('range')
  .invoke('val', 25)
  .trigger('change')

cy.get('@range').siblings('p').should('have.text', '25')
```

## Position

***Trigger a `mousedown` on the top right of a button***

```javascript
cy.get('button').trigger('mousedown', 'topRight')
```

## Coordinates

***Specify explicit coordinates relative to the top left corner***

```javascript
cy.get('button').trigger('contextmenu', 15, 40)
```

## Options

***Specify that the event should not bubble***

By default, the event will bubble up the DOM tree. This will prevent the event from bubbling.

```javascript
cy.get('button').trigger('mouseover', { bubbles: false })
```

***Specify the exact `clientX` and `clientY` the event should have***

This overrides the default auto-positioning based on the element itself. Useful for events like `mousemove` where you need the position to be outside the element itself.

```javascript
cy.get('button').trigger('mousemove', {clientX: 200, clientY: 300})
```

# Notes

## Actionability

***The element must first reach actionability***

`.trigger()` is an "action command" that follows all the rules {% url 'defined here' interacting-with-elements %}.

## Events

***What event should I fire?***

`cy.trigger()` is meant to be a low-level utility that makes triggering events easier than manually constructing and dispatching them. Since any arbitrary event can be triggered, Cypress tries not to make any assumptions about how it should be triggered. This means you'll need to know the implementation details (which may be in a 3rd party library) of the event handler(s) receiving the event and provide the necessary properties.

## Differences

***What's the difference between triggering and event and calling the corresponding cypress command?***

In other words, what's the difference between:

```javascript
cy.get('button').trigger('focus')
cy.get('button').focus()

// ... or ...

cy.get('button').trigger('click')
cy.get('button').click()
```

Both types commands will first verify element actionability, but only the "true" action commands will implement all of the default actions of the browser, and additionally perform low level actions to fulfill what's defined in the spec.

`.trigger()` will *only* fire the corresponding event and do nothing else.

That means that your event listener callbacks will be invoked, but don't expect the browser to actually "do" anything for these events. For the most part, it shouldn't matter, which is why `.trigger()` is an excellent stop-gap if the command / event you're looking for hasn't been implemented yet.

# Rules

## Requirements {% helper_icon requirements %}

{% requirements dom .trigger %}

## Assertions {% helper_icon assertions %}

{% assertions actions .trigger %}

## Timeouts {% helper_icon timeout %}

{% timeouts actions .trigger %}

# Command Log

***Trigger a `change` event on input type='range'***

```javascript
cy.get('.trigger-input-range')
  .invoke('val', 25)
  .trigger('change')
```

The commands above will display in the command log as:

{% img /img/api/trigger/command-log-trigger.png "command log trigger" %}

When clicking on `trigger` within the command log, the console outputs the following:

{% img /img/api/trigger/console-log-trigger.png "console log trigger" %}

# See also

- {% url `.blur()` blur %}
- {% url `.check()` check %}
- {% url `.click()` click %}
- {% url `.focus()` focus %}
- {% url `.select()` select %}
- {% url `.submit()` submit %}
- {% url `.type()` type %}
- {% url `.uncheck()` uncheck %}
