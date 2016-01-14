slug: click

### [cy.click()](#usage)

Clicks the current DOM subject.

Like all child commands, `click` returns the current subject for further chaining.

Like all `action` commands, the DOM subject must be in a "clickable" state prior to the click event happening.

Click will automatically wait and retry until the element becomes "clickable". It must be visible and not covered by another element.

Cypress will scroll the element into view prior to attempting the click.

By default the click will be issued at the exact center of the element. You can pass the `position` parameter to override this setting.

***

### [cy.click( *position* )](#position-usage)

Clicks the element at the specified position. The `center` position is the default position.

Position | Default | Notes
--- | --- | ---
center | Yes | Clicks the exact center of the element
topLeft | No | Clicks the top left corner of the element
topRight | No | Clicks the top right corner of the element
bottomLeft | No | Clicks the bottom left corner of the element
bottomRight | No | Clicks the bottom right corner of the element

***

### [cy.click( *x*, *y* )](#coordinates-usage)

You can pass a relative `x` and `y` coordinate which will issue the click from the `top left` corner of the element.

Cypress will retry until `commandTimeout` is reached if the coordinates exceed the bounds of the element.

`x` and `y` must both be `Numbers`. Currently you cannot use `%` based arguments. Open an issue if you'd like this functionality.

***

### [cy.click( *options* )](#options-usage)
### [cy.click( *position*, *options* )](#options-usage)
### [cy.click( *x*, *y*, *options* )](#options-usage)

Click supports these options:

Option | Default | Notes
--- | --- | ---
force | false | Forces click, disables error checking prior to click
multiple | false | Enables serially clicking multiple elements
timeout | 4000 | Total time to retry the click
interval | 50 | Interval which to retry a click

***

## Usage

#### Click the button

```javascript
// returns <button type="submit">Submit</button>
cy.get("button").click()
```

***

## Position Usage

#### Specify a corner of the element to click

```javascript
// click is issued in the top right corner of the element
cy.get("button").click("topRight")
```

***

## Coordinates Usage

#### Specify explicit coordinates relative to top left corner

```javascript
// the click will be issued inside of the element
// 15px from the left and
// 40px from the top
cy.get("button").click(15, 40)
```

***

## Options Usage

#### Force a click regardless of visibility or other elements in front of element

```javascript
// this will disable the built-in logic for ensuring
// the element is visible, and is physically clickable
cy.get("input[type=submit]").click({force: true})
```

This is useful when you want the click issued no matter what. Forcing a click disables the error checking that happens prior to a click.

Be careful with this option because it allows the click to happen where it might actually be impossible for a real user to click.

***

#### Force a click with position argument

```javascript
cy.get("button").click("bottomLeft", {force: true})
```

***

#### Force a click with relative coordinates

```javascript
cy.get("button").click(5, 60, {force: true})
```

***

## Known Issues

#### pointer-events: none

Cypress does not currently factor in `pointer-events: none` in its clicking algorithm. Open an issue if you need this to be fixed.

***

#### Element removal during `mousedown` or `mouseup`

The spec states what should happen if the element is removed from the DOM during `mousedown` or `mouseup`, but Cypress is not currently factoring this in.

This behavior will be added sometime in the near future. Open an issue if you need this to be fixed.

***

#### Animations

Unlike other testing frameworks (like `Selenium`) Cypress has built in logic for dealing with both CSS and JavaScript animations. Cypress will detect if an element is animating and will wait until an element reaches a clickable state. You will never deal with a situation where Cypress accidentally clicks the *wrong* element.

However, with that said, we have noticed from time to time, dealing with 3rd party plugins that animate using JavaScript can sometimes be affected by how Cypress scrolls an element into view. Cypress (acting like a real user) will attempt to position the element onscreen, by scrolling whatever parent elements need to be scrolled (just like a real user) prior to making a click. This *may* have an adverse affect if a 3rd party plugin is bound to the `scroll` event. The problem is that Cypress is so fast that there can sometimes be timing issues where 3rd party plugins incorrectly calculate animations and sometimes even prevent an element from displaying altogether.

At the end of the day, these situations are rare, but if you're having a difficult time getting an element to click, or experiencing seemingly *random* failures, you will save yourself hours of debugging and headache by simply issuing a `{force: true}` to the click, or by inserting a small delay prior to the click with `[cy.wait(ms)](wait)`. It is almost never worth your time trying to debug finicky animation issues caused by 3rd party plugins.

So far the only library we've seen cause issues with is animating KendoUI's `dropdownlist`. By using `{force: true}` or inserting a small `wait` prior to a click, these issues completely go away.

***

## Notes

#### Events which are fired

```javascript
cy.get("input[type=submit]").click()
// mousedown
// focus
// mouseup
// click
```

The events are fired exactly to spec, including the coordinates of where the event took place.

At the moment, `mouseover` and `mouseout` events are not fired but this will be done soon.

Additionally if the `mousedown` event causes the element to be removed from the DOM, the remaining events should continue to be fired, but to the resulting element left below the removed element.  This has also not been implemented but will be implemented at some point as well.

***

#### Focus is given to the first focusable element

Just like real browsers, clicking a `<span>`, for example, inside of a `<button>` will properly give the focus to the button, since that's what would happen in a real user scenario.

However, Cypress additionally handles situations where a child descendent is clicked inside of a focusable parent, but actually isn't visually inside the parent (per the CSS Object Model). In those cases if no focusable parent is found the window is given focus instead (which matches a real browser).

***

#### Mousedown cancellation will not cause focus

If the mousedown event has its default action prevented (`e.preventDefault()`) then the element will not receive focus as per the spec.

***

#### Coordinates of a click

Additionally the coordinates of the click will be recorded the exact moment the click happens. When hovering over the `click` command Cypress will display a red "hitbox" indicator visually showing you where the click event occurred on the page.

***

## Command Log

```javascript
cy.get("form").find("button").contains("Create User").click()
```

The commands above will display in the command log as:

<img width="590" alt="screen shot 2015-11-29 at 1 07 27 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458988/3cd5bae8-969a-11e5-9938-40a553402992.png">

When clicking on `click` within the command log, the console outputs the following:

<img width="759" alt="screen shot 2015-11-29 at 1 07 49 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458989/4036493c-969a-11e5-8f98-377dfce1f2c1.png">

***

## Related
1. [dblclick](http://on.cypress.io/api/dblclick)
2. [check](http://on.cypress.io/api/check)
3. [select](http://on.cypress.io/api/select)
4. [submit](http://on.cypress.io/api/submit)