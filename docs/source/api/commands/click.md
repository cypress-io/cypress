---
title: click
comments: true
description: ''
---

Click a DOM element.  The DOM element must be in a "clickable" state prior to the click event happening (it must be visible and not covered by another element).

# Syntax

```javascript
.click()
.click(options)
.click(position)
.click(position, options)
.click(x, y)
.click(x, y, options)
```

## Parameters

**position**

Clicks the element at the specified position. The `center` position is the default position. Valid positions are `topLeft`, `top`, `topRight`, `left`, `center`, `right`, `bottomLeft`, `bottom`, and `bottomRight`.

![cypress-command-positions-diagram](https://cloud.githubusercontent.com/assets/1271364/25048528/fe0c6378-210a-11e7-96bc-3773f774085b.jpg)

**x**, **y**

You can pass a relative `x` and `y` coordinate which will calculate distance in pixels from the top left corner of the element and issue the click at the calculated coordinate.

`x` and `y` must both be `Numbers`. Currently you cannot use `%` based arguments. [Open an issue](https://github.com/cypress-io/cypress/issues/new) if you'd like this functionality.

**options** *(optional)*

Pass in an options object to change the default behavior of `.click`.

Option | Default | Notes
--- | --- | ---
`force` | `false` | Forces click, disables error checking prior to click
`multiple` | `false` | Enables serially clicking multiple elements
`interval` | `16` | Interval which to retry a click
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry the click
`log` | `true` | whether to display command in command log

## Yields

`.click()` yields the DOM subject chained from the previous command.

## Timeout

`.click()` will wait until the element is in a 'clickable' state for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) or the duration of the `timeout` specified in the command's [options](#options)

# Examples

## Click

**Click the button**

```javascript
// yields <button>Save</button>
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
[Check out our example recipe on testing hover and working with hidden elements](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/hover_hidden_elements.js)
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

At the moment, `mouseover` and `mouseout` events are *not* fired but this will be done soon.

Additionally if the `mousedown` event causes the element to be removed from the DOM, the remaining events should continue to be fired, but to the resulting element left below the removed element.  This has also not been implemented but will be implemented at some point.

**Focus is given to the first focusable element**

Just like real browsers, clicking a `<span>`, for example, inside of a `<button>` will properly give the focus to the button, since that's what would happen in a real user scenario.

However, Cypress additionally handles situations where a child descendent is clicked inside of a focusable parent, but actually isn't visually inside the parent (per the CSS Object Model). In those cases if no focusable parent is found the window is given focus instead (which matches a real browser).

**Mousedown cancellation will not cause focus**

If the mousedown event has its default action prevented (`e.preventDefault()`) then the element will not receive focus as per the spec.

**Coordinates of a click**

The coordinates of the click will be recorded the exact moment the click happens. When hovering over the `click` command, Cypress will display a red "hitbox" indicator on the snapshot showing you where the click event occurred on the page.

**pointer-events: none**

Cypress does not currently factor in `pointer-events: none` in its clicking algorithm. [Open an issue](https://github.com/cypress-io/cypress/issues/new) if you need this to be fixed.

**Element removal during `mousedown` or `mouseup`**

The spec states what should happen if the element clicked is removed from the DOM during `mousedown` or `mouseup`, but Cypress is not currently factoring this in. [Open an issue](https://github.com/cypress-io/cypress/issues/new) if you need this to be fixed.

**Animations**

Unlike other testing frameworks, like Selenium, Cypress has built in logic for dealing with both CSS and JavaScript animations. Cypress will detect if an element is animating and will wait until the element reaches a clickable state. You will never deal with a situation where Cypress accidentally clicks the *wrong* element.

However, sometimes when dealing with 3rd party plugins that animate using JavaScript, Cypress logic to scroll an element into view can be affected. Cypress (acting like a real user) will attempt to position the element onscreen by scrolling all parent elements that need to be scrolled (just like a real user) prior to making a click. This *may* have an adverse affect if a 3rd party plugin is bound to the `scroll` event. Cypress is so fast that sometimes there are timing issues where 3rd party plugins have incorrectly calculated animations and sometimes even prevent an element from displaying altogether.

These situations are rare, but if you're having a difficult time getting an element to click or experiencing seemingly *random* failures, you will save *yourself hours of debugging and headache* by simply issuing the `{force: true}` option to the click or by inserting a small delay prior to the click with [`cy.wait(ms)`](https://on.cypress.io/api/wait). It is almost never worth your time trying to debug finicky animation issues caused by 3rd party plugins.

So far the only library we've seen cause issues with is animating KendoUI's `dropdownlist`. By using `{force: true}` or inserting a small `wait` prior to a click, these issues completely go away.

# Command Log

**Click the button in the form that has text "Create User"**

```javascript
cy.get('form').find('button').contains('Create User').click()
```

The commands above will display in the command log as:

<img width="590" alt="screen shot 2015-11-29 at 1 07 27 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458988/3cd5bae8-969a-11e5-9938-40a553402992.png">

When clicking on `click` within the command log, the console outputs the following:

<img width="759" alt="screen shot 2015-11-29 at 1 07 49 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458989/4036493c-969a-11e5-8f98-377dfce1f2c1.png">

# See also

- [dblclick](https://on.cypress.io/api/dblclick)
- [check](https://on.cypress.io/api/check)
- [select](https://on.cypress.io/api/select)
- [submit](https://on.cypress.io/api/submit)
