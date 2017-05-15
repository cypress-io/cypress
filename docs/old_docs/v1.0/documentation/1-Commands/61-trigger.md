slug: trigger
excerpt: Trigger an event on a DOM element

`cy.trigger` is used to trigger an arbitrary event (e.g. mouseover, contextmenu) on the DOM element found in the previous command.  The DOM element must be in an "interactable" state prior to the triggered event happening (it must be visible and not disabled).

`cy.trigger` is meant to be a low-level utility that makes triggering events easier than manually constructing and dispatching them. Since any arbitrary event can be triggered, Cypress tries not to make any assumptions about how it should be triggered. This means you'll need to know the implementation details (which may be in a 3rd party library) of the event handler(s) receiving the event and provide the necessary properties.

Cypress automatically scrolls the element into view prior to attempting to trigger the event.

By default, the event is triggered with coordinates at the exact center of the element. You can pass a [`position`](#position-usage) option, relative coordinates, or the raw event properties (e.g. `clientX`) to override this.

By default, the event will bubble and is cancelable. You can pass `bubbles: false` and/or `cancelable: false` as options to override this.

| | |
|--- | --- |
| **Returns** | the existing DOM subject |
| **Timeout** | `cy.trigger` will wait and retry until the element is 'interactable' for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) or the duration of the `timeout` specified in the command's [options](#options) |

***

# [cy.trigger( *eventName* )](#usage)

Trigger the event named `eventName` on the DOM element.

***

# [cy.trigger( *eventName*, *position* )](#position-usage)

Triggers event on the element at the specified position. The `center` position is the default position.

Position | Default | Notes
--- | --- | ---
`center` | Yes | The exact center of the element
`topLeft` | No | The top left corner of the element
`topRight` | No | The top right corner of the element
`bottomLeft` | No | The bottom left corner of the element
`bottomRight` | No | The bottom right corner of the element

***

# [cy.trigger( *eventName*, *x*, *y* )](#coordinates-usage)

You can pass a relative `x` and `y` coordinate which will calculate distance in pixels from the top left corner of the element and triggers the event with the calculated coordinates.

`x` and `y` must both be `Numbers`. Currently you cannot use `%` based arguments. [Open an issue](https://github.com/cypress-io/cypress/issues/new?body=**Description**%0A*Include%20a%20high%20level%20description%20of%20the%20error%20here%20including%20steps%20of%20how%20to%20recreate.%20Include%20any%20benefits%2C%20challenges%20or%20considerations.*%0A%0A**Code**%0A*Include%20the%20commands%20used*%0A%0A**Steps%20To%20Reproduce**%0A-%20%5B%20%5D%20Steps%0A-%20%5B%20%5D%20To%0A-%20%5B%20%5D%20Reproduce%2FFix%0A%0A**Additional%20Info**%0A*Include%20any%20images%2C%20notes%2C%20or%20whatever.*%0A) if you'd like this functionality.

***

# Options

Pass in an options object to change the default behavior of `cy.click`.

**[cy.trigger( *eventName*, *options* )](#options-usage)**
**[cy.trigger( *eventName*, *position*, *options* )](#options-usage)**
**[cy.trigger( *eventName*, *x*, *y*, *options* )](#options-usage)**

Option | Default | Notes
--- | --- | ---
`interval` | `16` | Interval which to retry triggering the event
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry the click
`log` | `true` | whether to display command in command log

You can also include arbitrary event properties (e.g. `clientX`, `shiftKey`) and they will be attached to the event. Passing in coordinate arguments (`clientX`, `pageX`, etc) will override the position coordinates.

***

# Usage

## Trigger a mouseover on the button

```javascript
// returns <button>Save</button>
cy.get("button").trigger("mouseover")
```

***

# Position Usage

## Trigger a mousedown on the top right of a button

```javascript
// mousedown is issued in the top right corner of the element
cy.get("button").trigger("mousedown", "topRight")
```

***

# Coordinates Usage

## Specify explicit coordinates relative to the top left corner

```javascript
// the contextmenu event will be issued inside of the element
// 15px from the left and
// 40px from the top
cy.get("button").trigger("contextmenu", 15, 40)
```

***

# Options Usage

## Specify that the event should not bubble

By default, the event will bubble up the DOM tree. This will prevent the event from bubbling.

```javascript
cy.get("button").trigger("mouseover", {bubbles: false})
```

## Specify the exact clientX and clientY the event should have

This overrides the default auto-positioning based on the element itself. Useful for events like `mousemove` where you need the position to be outside the element itself.

```javascript
cy.get("button").trigger("mousemove", {clientX: 200, clientY: 300})
```

# Command Log

## Trigger a mouseover event on the first button

```javascript
cy.get("button").first().trigger("mouseover")
```

The commands above will display in the command log as:

<img width="364" alt="Command log output" src="https://cloud.githubusercontent.com/assets/1157043/23477277/749d347e-fe8b-11e6-9c31-6667f7ff65d8.png">

When clicking on `trigger` within the command log, the console outputs the following:

<img width="630" alt="Console output" src="https://cloud.githubusercontent.com/assets/1157043/23477276/749aac54-fe8b-11e6-81b3-e7600cca0ba0.png">

***

# Errors

## cy.trigger() can only be called on a single element.

`cy.trigger()` only works on a single element. [Open an issue](https://github.com/cypress-io/cypress/issues/new?body=**Description**%0A*Include%20a%20high%20level%20description%20of%20the%20error%20here%20including%20steps%20of%20how%20to%20recreate.%20Include%20any%20benefits%2C%20challenges%20or%20considerations.*%0A%0A**Code**%0A*Include%20the%20commands%20used*%0A%0A**Steps%20To%20Reproduce**%0A-%20%5B%20%5D%20Steps%0A-%20%5B%20%5D%20To%0A-%20%5B%20%5D%20Reproduce%2FFix%0A%0A**Additional%20Info**%0A*Include%20any%20images%2C%20notes%2C%20or%20whatever.*%0A) if you'd like to be able to trigger an event serially on multiple elements.

***

# Related

- [hover](https://on.cypress.io/api/hover)
- [click](https://on.cypress.io/api/click)
