slug: click
excerpt: Click a DOM element

`cy.click` is used to click a DOM element found int he previous command.  The DOM element must be in a "clickable" state prior to the click event happening (it must be visible and not covered by another element).

Cypress automatically scrolls the element into view prior to attempting the click.

By default, the click is issued at the exact center of the element. You can pass a [`position`](#position-usage) option to override this setting.

**The following events are fired during click:** `mousedown`, `focus`, `mouseup`, `click`

| | |
|--- | --- |
| **Returns** | the existing DOM subject |
| **Timeout** | `cy.click` will wait and retry until the element is 'clickable' for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) or the duration of the `timeout` specified in the command's [options](#options) |

***

# [cy.click()](#usage)

Click the DOM element.

***

# [cy.click( *position* )](#position-usage)

Clicks the element at the specified position. The `center` position is the default position.

Position | Default | Notes
--- | --- | ---
`center` | Yes | Clicks the exact center of the element
`topLeft` | No | Clicks the top left corner of the element
`topRight` | No | Clicks the top right corner of the element
`bottomLeft` | No | Clicks the bottom left corner of the element
`bottomRight` | No | Clicks the bottom right corner of the element

***

# [cy.click( *x*, *y* )](#coordinates-usage)

You can pass a relative `x` and `y` coordinate which will calculate distance in pixels from the top left corner of the element and isssue the click at the calculated coordinate.

`x` and `y` must both be `Numbers`. Currently you cannot use `%` based arguments. [Open an issue](https://github.com/cypress-io/cypress/issues/new?body=**Description**%0A*Include%20a%20high%20level%20description%20of%20the%20error%20here%20including%20steps%20of%20how%20to%20recreate.%20Include%20any%20benefits%2C%20challenges%20or%20considerations.*%0A%0A**Code**%0A*Include%20the%20commands%20used*%0A%0A**Steps%20To%20Reproduce**%0A-%20%5B%20%5D%20Steps%0A-%20%5B%20%5D%20To%0A-%20%5B%20%5D%20Reproduce%2FFix%0A%0A**Additional%20Info**%0A*Include%20any%20images%2C%20notes%2C%20or%20whatever.*%0A) if you'd like this functionality.

[block:callout]
{
  "type": "warning",
  "body": "Make sure not to issue a click outside of the width and height of the element. This will result in a `Command Timeout`"
}
[/block]

***

# Options

Pass in an options object to change the default behavior of `cy.click`.

**[cy.click( *options* )](#options-usage)**
**[cy.click( *position*, *options* )](#options-usage)**
**[cy.click( *x*, *y*, *options* )](#options-usage)**

Option | Default | Notes
--- | --- | ---
`force` | `false` | Forces click, disables error checking prior to click
`multiple` | `false` | Enables serially clicking multiple elements
`interval` | `16` | Interval which to retry a click
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry the click
`log` | `true` | whether to display command in command log

***

# Usage

## Click the button

```javascript
// returns <button>Save</button>
cy.get("button").click()
```

***

# Position Usage

## Specify a corner of the element to click

```javascript
// click is issued in the top right corner of the element
cy.get("button").click("topRight")
```

***

# Coordinates Usage

## Specify explicit coordinates relative to the top left corner

```javascript
// the click will be issued inside of the element
// 15px from the left and
// 40px from the top
cy.get("button").click(15, 40)
```

***

# Options Usage

## Force a click regardless of visibility or other elements in front of the element

This is useful when you want the click issued no matter what. Forcing a click disables the error checking that happens prior to a click.

[block:callout]
{
  "type": "warning",
  "body": "Be careful with this option because it allows the click to happen when it might actually be impossible for a real user to click."
}
[/block]

```javascript
// this will disable the built-in logic for ensuring
// the element is visible, and is physically clickable
cy.get("button").click({force: true})
```

[block:callout]
{
  "type": "info",
  "body": "[Check out our example recipe on testing hover and working with hidden elements](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/hover_hidden_elements.js)",
  "title": "Dealing with hover and hidden elements"
}
[/block]

***

## Force a click with position argument

```javascript
cy.get("button").click("bottomLeft", {force: true})
```

***

## Force a click with relative coordinates

```javascript
cy.get("button").click(5, 60, {force: true})
```

## Click all buttons found on the page

```javascript
cy.get("button").click({multiple: true})
```

***

# Known Issues

## pointer-events: none

Cypress does not currently factor in `pointer-events: none` in its clicking algorithm. [Open an issue](https://github.com/cypress-io/cypress/issues/new?body=**Description**%0A*Include%20a%20high%20level%20description%20of%20the%20error%20here%20including%20steps%20of%20how%20to%20recreate.%20Include%20any%20benefits%2C%20challenges%20or%20considerations.*%0A%0A**Code**%0A*Include%20the%20commands%20used*%0A%0A**Steps%20To%20Reproduce**%0A-%20%5B%20%5D%20Steps%0A-%20%5B%20%5D%20To%0A-%20%5B%20%5D%20Reproduce%2FFix%0A%0A**Additional%20Info**%0A*Include%20any%20images%2C%20notes%2C%20or%20whatever.*%0A) if you need this to be fixed.

***

## Element removal during `mousedown` or `mouseup`

The spec states what should happen if the element clicked is removed from the DOM during `mousedown` or `mouseup`, but Cypress is not currently factoring this in. [Open an issue](https://github.com/cypress-io/cypress/issues/new?body=**Description**%0A*Include%20a%20high%20level%20description%20of%20the%20error%20here%20including%20steps%20of%20how%20to%20recreate.%20Include%20any%20benefits%2C%20challenges%20or%20considerations.*%0A%0A**Code**%0A*Include%20the%20commands%20used*%0A%0A**Steps%20To%20Reproduce**%0A-%20%5B%20%5D%20Steps%0A-%20%5B%20%5D%20To%0A-%20%5B%20%5D%20Reproduce%2FFix%0A%0A**Additional%20Info**%0A*Include%20any%20images%2C%20notes%2C%20or%20whatever.*%0A) if you need this to be fixed.

***

## Animations

Unlike other testing frameworks, like Selenium, Cypress has built in logic for dealing with both CSS and JavaScript animations. Cypress will detect if an element is animating and will wait until the element reaches a clickable state. You will never deal with a situation where Cypress accidentally clicks the *wrong* element.

However, sometimes when dealing with 3rd party plugins that animate using JavaScript, Cypress logic to scroll an element into view can be affected. Cypress (acting like a real user) will attempt to position the element onscreen by scrolling all parent elements that need to be scrolled (just like a real user) prior to making a click. This *may* have an adverse affect if a 3rd party plugin is bound to the `scroll` event. Cypress is so fast that sometimes there are timing issues where 3rd party plugins have incorrectly calculated animations and sometimes even prevent an element from displaying altogether.

These situations are rare, but if you're having a difficult time getting an element to click or experiencing seemingly *random* failures, you will save *yourself hours of debugging and headache* by simply issuing the `{force: true}` option to the click or by inserting a small delay prior to the click with [`cy.wait(ms)`](https://on.cypress.io/api/wait). It is almost never worth your time trying to debug finicky animation issues caused by 3rd party plugins.

So far the only library we've seen cause issues with is animating KendoUI's `dropdownlist`. By using `{force: true}` or inserting a small `wait` prior to a click, these issues completely go away.

***

# Notes

## Events that are fired

```javascript
cy.get("button").click()
// mousedown
// focus
// mouseup
// click
```

The events are fired to spec, including the coordinates of where the event took place.

At the moment, `mouseover` and `mouseout` events are *not* fired but this will be done soon.

Additionally if the `mousedown` event causes the element to be removed from the DOM, the remaining events should continue to be fired, but to the resulting element left below the removed element.  This has also not been implemented but will be implemented at some point.

***

## Focus is given to the first focusable element

Just like real browsers, clicking a `<span>`, for example, inside of a `<button>` will properly give the focus to the button, since that's what would happen in a real user scenario.

However, Cypress additionally handles situations where a child descendent is clicked inside of a focusable parent, but actually isn't visually inside the parent (per the CSS Object Model). In those cases if no focusable parent is found the window is given focus instead (which matches a real browser).

***

## Mousedown cancellation will not cause focus

If the mousedown event has its default action prevented (`e.preventDefault()`) then the element will not receive focus as per the spec.

***

## Coordinates of a click

The coordinates of the click will be recorded the exact moment the click happens. When hovering over the `click` command, Cypress will display a red "hitbox" indicator on the snapshot showing you where the click event occurred on the page.

***

# Command Log

## Click the button in the form that has text "Create User"

```javascript
cy.get("form").find("button").contains("Create User").click()
```

The commands above will display in the command log as:

<img width="590" alt="screen shot 2015-11-29 at 1 07 27 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458988/3cd5bae8-969a-11e5-9938-40a553402992.png">

When clicking on `click` within the command log, the console outputs the following:

<img width="759" alt="screen shot 2015-11-29 at 1 07 49 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458989/4036493c-969a-11e5-8f98-377dfce1f2c1.png">

***

# Errors

## cy.click() can only be called on a single element.

If the subject passed to `cy.click()` are multiple elements, you need to write `cy.click({multiple: true})` to serially click each element one after another. Otherwise, ensure that your subject is only one element.

## cy.click() cannot be called on a <select> element. Use cy.select() command instead to change the value.

In order to work with selecting `<select>` elements, [`cy.select()`](https://on.cypress.io/api/select) will afford better options than `cy.click()`.

# Related

- [dblclick](https://on.cypress.io/api/dblclick)
- [check](https://on.cypress.io/api/check)
- [select](https://on.cypress.io/api/select)
- [submit](https://on.cypress.io/api/submit)
