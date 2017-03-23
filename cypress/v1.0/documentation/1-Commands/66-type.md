slug: type
excerpt: Type into a DOM element

Types into the DOM element found in the previous command.

Prior to typing, if the DOM element isn't currently focused, Cypress will issue a [click](https://on.cypress.io/api/click) on the element, which will cause the element to receive focus.

Text passed to `cy.type` may include any of these special character sequences:

Sequence | Notes
--- | ---
`{{}`| Types the literal `{` key
`{backspace}` | Deletes character to the left of the cursor
`{del}` | Deletes character to the right of the cursor
`{enter}` | Types the Enter key
`{esc}` | Types the Escape key
`{leftarrow}` | Moves cursor left
`{rightarrow}` | Moves cursor right
`{downarrow}` | Fires down event but does **not** move the cursor
`{uparrow}` | Fires up event but does **not** move the cursor
`{selectall}` | Selects all text by creating a `selection range`

Text passed to `cy.type` may also include any of the these modifier character sequences:

Sequence | Notes
--- | ---
`{alt}` | Activates the `altKey` modifier. Aliases: `{option}`
`{ctrl}` | Activates the `ctrlKey` modifier. Aliases: `{control}`
`{meta}` | Activates the `metaKey` modifier. Aliases: `{command}`, `{cmd}`
`{shift}` | Activates the `shiftKey` modifier.

| | |
|--- | --- |
| **Returns** | the DOM element that was typed into |
| **Timeout** | `cy.type` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) or the duration of the `timeout` specified in the command's [options](#section-options). |

***

# [cy.type( *text* )](#section-usage)

Types the text provided into the current DOM subject.

***

# Options

Pass in an options object to change the default behavior of `cy.type`.

**[cy.type( *text*, *options* )](#options-usage)**

Option | Default | Notes
--- | --- | ---
`delay` | `10` | Delay after each keypress
`force` | `false` | Forces type, disables error checking prior to type
`release` | `true` | Keep a modifier activated between commands
`interval` | `16` | Interval to retry type
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) | Total time to retry the type
`log` | `true` | whether to display command in command log

***

# Usage

## Type into a textarea.

```javascript
// issues all keyboard events
// and returns <textarea> for further chaining
cy.get("textarea").type("Hello world")
```

***

## Type into a non-text or non-textarea element with `tabindex`

```html
<body>
  <div id="el" tabindex="1">
    this div can receive focus
  </div>
</body>
```

```javascript
// this element will receive all of the appropriate
// key events and focus / blur events but will not
// have its value or text contents altered in any way
cy.get("#el").type("foo")
```

***

# Options Usage

## Force a click to happen prior to type

Type issues a [`click`](https://on.cypress.io/api/click) prior to typing (only if the element is not currently focused). Because of this, sometimes it is useful to force the click to happen. Forcing a click disables error checking prior to the click.

```javascript
// this will disable the built-in logic for ensuring
// the element is visible, and is physically clickable
// prior to typing into it
cy.get("input[type=text]").type("Test all the things", {force: true})
```

[block:callout]
{
  "type": "warning",
  "body": "Be careful with the `force` option because it allows the type to happen where it might actually be impossible for a real user to type."
}
[/block]

***

# Key combinations / Modifiers

When using special character sequences (see table at top of page), it's possible to activate modifier keys and type key combinations, such as `CTRL + R` or `SHIFT + ALT + Q`. The modifier(s) remain activated for the duration of the `cy.type()` command, and are released when all subsequent characters are typed, unless [`{release: false}`](https://on.cypress.io/api/type#section-options) is passed as an [option](https://on.cypress.io/v1.0/api/type#section-release-behavior). A `keydown` event is fired when a modifier is activated and a `keyup` event is fired when it is released.

## Type a key combination

```javascript
// this is the same as a user holding down SHIFT and ALT, then pressing Q
cy.get("input").type("{shift}{alt}Q")
```

[block:callout]
{
  "type": "info",
  "body": "[Check out our example recipe of logging in by typing username and password](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_html_web_form_spec.js)",
  "title": "Typing into a login form"
}
[/block]

***

## Hold down modifier key and type a word

```javascript
// all characters after {ctrl} will have 'ctrlKey' set to 'true' on their key events
cy.get("input").type("{ctrl}test")
```

***

## Release behavior

By default, modifiers are released after each type command.

```javascript
// 'ctrlKey' will be true for each event while 'test' is typed
// but false while 'everything' is typed
cy.get("input").type("{ctrl}test").type("everything")
```

To keep a modifier activated between commands, specify `{release: false}` in the options.

```javascript
// 'altKey' will be true while typing 'foo'
cy.get("input").type("{alt}foo", {release: false})
// 'altKey' will also be true during 'get' and 'click' commands
cy.get("button").click()
```

Modifiers are automatically released between tests, even with `{release: false}`.

```javascript
it("has modifiers activated", function () {
  // 'altKey' will be true while typing 'foo'
  cy.get("input").type("{alt}foo", {release: false})
})

it("does not have modifiers activated", function () {
  // 'altKey' will be false while typing 'bar'
  cy.get("input").type("bar")
})
```

To manually release modifiers within a test after using `{release: false}`, use another `type` command and the modifier will be released after it.

```javascript
// 'altKey' will be true while typing 'foo'
cy.get("input").type("{alt}foo", {release: false})
// 'altKey' will be true during the 'get' and 'click' commands
cy.get("button").click()
// 'altKey' will be released after this command
cy.get("input").type("{alt}")
// 'altKey' will be false during the 'get' and 'click' commands
cy.get("button").click()
```

***

## Global shortcuts / modifiers

`cy.type()` requires a focusable element as the subject, since it's usually unintended to type into something that's not a text field or textarea! Although there *are* a few cases where it's valid to "type" into something other than a text field or textarea:

* Keyboard shortcuts where the listener is on the `document` or `body`.
* Holding modifier keys and clicking an arbitrary element.

To support this, the `body` can be used as the subject (even though it's *not* a focusable element).

```javascript
// all of the type events will be fired on the body
cy.get("body").type("{uparrow}{uparrow}{downarrow}{downarrow}{leftarrow}{rightarrow}{leftarrow}{rightarrow}ba")

```

```javascript
// execute a SHIFT + click on the first <li>
// {release: false} is necessary so that
// SHIFT will not be released after the type command
cy.get("body").type("{shift}", {release: false}).get("li:first").click()
```

***

# Known Issues

## Native `input[type=date,datetime,datetime-local,month,year,color]`

Special input types are *not* supported yet because browsers implement these input types outside of what is accessible to JavaScript. They also depend on OS regional settings.  The fix however is relatively simple - Cypress will require you to type the final *formatted* value that the input will be set to - and then all will work. [Open an issue](https://github.com/cypress-io/cypress/issues/new?body=**Description**%0A*Include%20a%20high%20level%20description%20of%20the%20error%20here%20including%20steps%20of%20how%20to%20recreate.%20Include%20any%20benefits%2C%20challenges%20or%20considerations.*%0A%0A**Code**%0A*Include%20the%20commands%20used*%0A%0A**Steps%20To%20Reproduce**%0A-%20%5B%20%5D%20Steps%0A-%20%5B%20%5D%20To%0A-%20%5B%20%5D%20Reproduce%2FFix%0A%0A**Additional%20Info**%0A*Include%20any%20images%2C%20notes%2C%20or%20whatever.*%0A) if you need this to be fixed.

***

## Typing `tab` key does not work

Tabbing will be implemented as a separate command as `cy.tab` and support things like multiple tabs, tabbing in reverse, or tabbing to a specific element. [Open an issue](https://github.com/cypress-io/cypress/issues/new?body=**Description**%0A*Include%20a%20high%20level%20description%20of%20the%20error%20here%20including%20steps%20of%20how%20to%20recreate.%20Include%20any%20benefits%2C%20challenges%20or%20considerations.*%0A%0A**Code**%0A*Include%20the%20commands%20used*%0A%0A**Steps%20To%20Reproduce**%0A-%20%5B%20%5D%20Steps%0A-%20%5B%20%5D%20To%0A-%20%5B%20%5D%20Reproduce%2FFix%0A%0A**Additional%20Info**%0A*Include%20any%20images%2C%20notes%2C%20or%20whatever.*%0A) if you need this to be fixed.

***

## Preventing mousedown does not prevent typing

In a real browser, preventing mousedown on a form field will prevent it from receiving focus and thus prevent it from being able to be typed into. Currently, Cypress does not factor this in. [Open an issue](https://github.com/cypress-io/cypress/issues/new?body=**Description**%0A*Include%20a%20high%20level%20description%20of%20the%20error%20here%20including%20steps%20of%20how%20to%20recreate.%20Include%20any%20benefits%2C%20challenges%20or%20considerations.*%0A%0A**Code**%0A*Include%20the%20commands%20used*%0A%0A**Steps%20To%20Reproduce**%0A-%20%5B%20%5D%20Steps%0A-%20%5B%20%5D%20To%0A-%20%5B%20%5D%20Reproduce%2FFix%0A%0A**Additional%20Info**%0A*Include%20any%20images%2C%20notes%2C%20or%20whatever.*%0A) if you need this to be fixed.

***

## Modifier effects

In a real browser, if a user holds `SHIFT` and types `a`, a capital `A` will be typed into the input. Currently, Cypress does not simulate that behavior.

Modifiers are simulated by setting their corresponding values to `true` for key and click events. So, for example, activating the `{shift}` modifier will set `event.shiftKey` to true for any key events, such as `keydown`.

```javascript
// app code
document.querySelector("input:first").addEventListener("keydown", function (e) {
  // e.shiftKey will be true
})

// in test
cy.get("input:first").type("{shift}a")
```

In the example above, a lowercase `a` will be typed, because that's the literal character specified. To type a capital `A`, you can use `cy.type("{shift}A")` (or simply `cy.type("A")` if you don't care about the `shiftKey` property on any key events).

This holds true for other special key combinations as well (that may be OS-specific). For example, on OSX, typing `ALT + SHIFT + K` creates the special character ``. Like with capitalization, `cy.type()` will not output ``, but simply the letter `k`.

[Open an issue](https://github.com/cypress-io/cypress/issues/new?body=**Description**%0A*Include%20a%20high%20level%20description%20of%20the%20error%20here%20including%20steps%20of%20how%20to%20recreate.%20Include%20any%20benefits%2C%20challenges%20or%20considerations.*%0A%0A**Code**%0A*Include%20the%20commands%20used*%0A%0A**Steps%20To%20Reproduce**%0A-%20%5B%20%5D%20Steps%0A-%20%5B%20%5D%20To%0A-%20%5B%20%5D%20Reproduce%2FFix%0A%0A**Additional%20Info**%0A*Include%20any%20images%2C%20notes%2C%20or%20whatever.*%0A) if you need modifier effects to be implemented.

***

# Notes

## Mimic user typing behavior

```javascript
// each keypress is delayed 10ms by default
// which simulates how a very fast user types!
cy.get("[contenteditable]").type("some text!")
```

***

## Events that fire

Cypress implements all events that Chrome fires as part of typing in a real keyboard. Read the section: [Simulated Events vs Native Events](#simulated-events-vs-native-events) below for more information.

The following events will be fired based on what key was pressed identical to the event spec.

* keydown
* keypress
* textInput
* input
* keyup

`beforeinput` is *not* fired even though it is in the spec because no browser has adopted it.

Additionally `change` events will be fired either when the `{enter}` key is pressed (and the value has changed since the last focus event), or whenever the element loses focus. This matches browser behavior.

Events that should not fire on non input types such as elements with `tabindex` do not fire their `textInput` or `input` events. Only typing into elements which cause the actual value or text to change will fire those events.

***

## Event Firing

The following rules have been implemented that match real browser behavior (and the spec):

1. Cypress respects not firing subsequent events if previous ones were cancelled.
2. Cypress will fire `keypress` *only* if that key is supposed to actually fire `keypress`.
3. Cypress will fire `textInput` *only* if typing that key would have inserted an actual character.
4. Cypress will fire `input` *only* if typing that key modifies or changes the value of the element.

***

## Event Cancellation

Cypress respects all default browser behavior when events are cancelled.

```javascript
// prevent the characters from being inserted
// by canceling keydown, keypress, or textInput
$("#username").on("keydown", function(e){
  e.preventDefault();
})

// Cypress will not insert any characters if keydown, keypress, or textInput
// are cancelled - which matches the default browser behavior
cy.get("#username").type("bob@gmail.com").should("have.value", "") // true
```

***

## Implicit form submission behavior

Cypress automatically matches the spec and browser behavior for pressing the `{enter}` key when the input belongs to a `<form>`.

This behavior is defined here: [Form Implicit Submission](https://html.spec.whatwg.org/multipage/forms.html#implicit-submission)

For instance the following will submit the form.

```html
<form action="/login">
  <input id="username" />
  <input id="password" />
  <button type="submit">Log In</button>
</form>
```

```javascript
cy
  .get("#username").type("bob@burgers.com")
  .get("#password").type("password123{enter}")
```

Because there are multiple `inputs` and one `submit` button, Cypress submits the form (and fires submit events) as well as a synthetic `click` event to the `button`.

The spec defines the **submit** button as the first `input[type=submit]` or `button[type!=button]` from the form.

Additionally Cypress handles these 4 other situations as defined in the spec:

1. Does not submit a form if there are multiple inputs and no `submit` button.
2. Does not submit a form if the `submit` button is disabled.
3. Submits a form, but does not fire synthetic `click` event, if there is 1 `input` and no `submit` button
4. Submits form and fires a synthetic `click` event to the `submit` when it exists.

Of course if the form's `submit` event is `preventedDefault` the form will not actually be submitted.

***

## Key Events Table

Cypress will print out a table of key events that detail the keys that were pressed when clicking on type within the [command log](https://on.cypress.io/api/type#section-command-log). Each character will contain the `which` character code and the events that happened as a result of that key press.

Events that were `defaultPrevented` may prevent other events from firing and those will show up as empty.  For instance, canceling `keydown` will not fire `keypress` or `textInput` or `input`, but will fire `keyup` (which matches the spec).

Additionally, events that cause a `change` event to fire (such as typing `{enter}`) will display with the `change` event column as `true.

Any modifiers activated for the event are also listed in a `modifiers` column.

![Cypress cy.type key events table](https://cloud.githubusercontent.com/assets/1157043/18144246/b44df61c-6f93-11e6-8553-96b1b347db4b.png)

***

## Simulated Events vs Native Events

When Cypress is running on your local computer, all events are simulated identically to real native events.

There should be no distinguishable difference between these simulated events and real native events. We chose to model these simulated events to match what Chrome fires. In other words, using `cy.type` should essentially match actually typing keys on your keyboard while in Chrome.

However, when Cypress is run in `cross browser mode`, Cypress uses the actual `OS keyboard` to type, and therefore the browser will fire all of it's native events as you'd expect.

This strategy works well because when you are in development you are working in Chrome.  Using simulated events is extremely fast, the browser window does *not* need to be in focus. Because we simulate events identically to their native counterpart, your application code won't be able to tell the difference.

In other words, you get the best of both worlds: simulated when its practical to do so, and native when it needs to run across browsers.

***

# Command Log

## Type into the input

```javascript
cy.get("input[name=firstName]").type("Jane Lane")
```

The commands above will display in the command log as:

<img width="584" alt="screen shot 2015-11-29 at 1 25 51 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459104/ee20613e-969c-11e5-8c78-e78b39d9ec46.png">

When clicking on `type` within the command log, the console outputs the following:

<img width="637" alt="screen shot 2015-11-29 at 1 26 24 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459106/f14f3308-969c-11e5-8352-f96744bbd713.png">

***

# Related

- [clear](https://on.cypress.io/api/clear)
- [click](https://on.cypress.io/api/click)
- [submit](https://on.cypress.io/api/submit)
