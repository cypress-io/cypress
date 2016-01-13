excerpt: Type into element
slug: type

### [cy.type( *text* )](#usage)

Types into the current DOM subject.

Prior to typing, if the element isn't currently focused, Cypress will issue a [click action command](/v1.0/docs/click), which will cause the element to receive focus.

Text may include these special character sequences:

Sequence | Notes
--- | ---
{{} | Types the literal `{` key
{esc} | Types the Escape key
{enter} | Types the Enter key
{selectall} | Selects all text by creating a `selection range`
{del} | Deletes character to the right of the cursor
{backspace} | Deletes character to the left of the cursor
{leftarrow} | Moves cursor left
{rightarrow} | Moves cursor right
***

### [cy.type( *text*, *options* )](#options-usage)

Type supports these options:

Option | Default | Notes
--- | --- | ---
force | false | Forces click, disables error checking prior to click
timeout | 4000 | Total time to retry the click
interval | 16 | Interval which to retry a click
delay | 10 | Delay after each keypress

***

## Usage

#### Type into a textarea.

```javascript
// issues all keyboard events
// and returns <textarea> for further chaining
cy.get("textarea").type("Hello world")
```

***

## Options Usage

#### Force a click to happen prior to type

```javascript
// this will disable the built-in logic for ensuring
// the element is visible, and is physically clickable
// prior to typing into it
cy.get("input[type=text]").type("foobarbaz", {force: true})
```

Type issues a [`click`](/v1.0/docs/click) prior to typing (if the element isn't currently focused). Because of this, sometimes it is useful to force the click to happen. Forcing a click disables error checking prior to the click.

Be careful with this option because it allows the type to happen where it might actually be impossible for a real user to type.

***

## Known Issues

#### Native input[type=date,datetime,datetime-local,month,year,color]

Special input types are not yet supported because browsers implement these outside of what is accessible to JavaScript and they also depend on OS regional settings.  The fix however is relatively simple - Cypress will require you to type the final *formatted* value that the input will be set to - and then all will work.

This will be implemented shortly.

***

#### Typing tab key does not work

You may think `cy.get("input").type("foo{tab}")` works but it doesn't.  Tabbing will be implemented as a separate **action command** as `cy.tab` and support things like multiple tabs, tabbing in reverse, or tabbing **to** a specific element.

This is being worked on currently.

***

#### Typing directly into the document

Currently Cypress requires you type directly into an element, but there is a use case for just "typing" as a user would but not to a focused element. Your app may implement this for things such as keyboard shortcuts, where you bind to the `KeyboardEvents` on the document.

This will be implemented shortly and you'll be able to do things like `cy.document().type("...")`

***

#### Key Combinations do not work

`cy.type` does not yet have the ability to specify key combinations like `CTRL + R` or `SHIFT + ALT + Q`.

This will be implemented sometime soon.

***

#### Preventing mousedown does not prevent typing

In a real browser preventing the mousedown on a form field will prevent it from receiving focus and thus prevent it from being able to be typed into. Currently Cypress does not factor this in, although will be implemented soon.

***

## Notes

#### Mimics user behavior

```javascript
// each keypress is delayed 10ms by default
// which simulates how a very fast user types!
cy.get("[contenteditable]").type("some text!")
```

***

#### Events that fire

Cypress implements all events which Chrome fires as part of typing in a real keyboard. Read the section: **Simulated Events vs Native Events** below for more information.

The following events will be fired based on what key was pressed identical to the event spec.

* keydown
* keypress
* textInput
* input
* keyup

`beforeinput` is not fired even though it is in the spec because no browser had adopted it.

Additionally `change` events will be fired either when the `{enter}` key is pressed (and the value has changed since the last focus event), or whenever the element loses focus. This matches the behavior of browsers.

***

#### Event Cancellation

Cypress respects all default browser behavior when events are cancelled.

```javascript
// prevent the key from being inserted
// by canceling keydown, keypress, or textInput
$("#username").on("keydown", function(e){
  e.preventDefault();
})

// Cypress will not insert any characters if keydown, keypress, or textInput
// is cancelled - which matches the default behavior of browsers
cy.get("#username").type("bob@gmail.com").should("have.value", "") // true
```

***

#### Event Firing

The following rules have been implemented which match real browser behavior (and the spec):

1. Cypress respects not firing subsequent events if previous ones were cancelled.
2. Cypress will fire `keypress` only if that key is supposed to actually fire `keypress`.
3. Cypress will fire `textInput` only if typing that key would have inserted an actual character.
4. Cypress will fire `input` only if typing that key modifies or changes the value of the element.

***

#### Implicit form submission behavior

Cypress automatically matches the spec and browser behavior when pressing the `{enter}` key when the input belongs to a `<form>`.

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
  .get("#username").type("bob@example.com")
  .get("#password").type("password123{enter}")
```

Because there are multiple `inputs` and one `submit` button, Cypress submits the form (and fires submit events) as well as a synthetic `click` event to the `button`.

The spec defines the **submit** button as the first `input[type=submit]` or `button[type!=button]` from the form.

Additionally Cypress handles these 4 other situations as defined in the spec:

1. Does not submit form if there are multiple inputs but no `submit` button.
2. Does not submit form if the `submit` button is disabled.
3. Submits form but does not fire synthetic `click` if there is only 1 `input` but no `submit` button
4. Submits form and fires a synthetic `click` event to the `submit` when it exists.

Of course if the form's `submit` event is `preventedDefault` the form will not actually be submitted.

***

#### Key Events Table

Cypress will print out a table of key events which detail the keys that were pressed within the console.  Each will contain the `which` character code, and the events that happened as a result of that key press.

Events which were `defaultPrevented` may prevent other events from firing and those will show up as blank.  For instance, canceling `keydown` will not fire `keypress` or `textInput` or `input`, but will fire `keyup` (which matches the spec).

Additionally events which cause a `change` event to fire (such as typing `{enter}` will display that these caused a change event.

![Cypress cy.type key events table](http://cl.ly/bnOS/cy-type-key-events-table.png)

***

#### Simulated Events vs Native Events

When Cypress is running on your local computer, all events are simulated identically to real native events.

There should be no distinguishable difference between these simulated events and real native events. We chose to model these simulated events to match what Chrome fires. In other words, using `cy.type` should essentially match actually typing keys on your keyboard while in Chrome.

However, when Cypress is run in `cross browser mode`, Cypress uses the actual `OS keyboard` to type, and therefore the browser will fire all of its native events as you'd expect.

This strategy works well because when you are in development you are working in Chrome.  Using simulated events is extremely fast, the browser window does **NOT** need to be in focus, and because we simulate events identically to their native counterpart, your application code won't be able to tell the difference anyway. But what about when you run your Cypress tests in other browsers?

Because browsers implement events differently it's important to ensure each browser fires it's native events as it's programmed to do. Therefore when you run Cypress in `cross browser mode` we use the operating system to control the keyboard. In doing so, each browser will fire their native events with no event simulation.

In other words, you get the best of both worlds: simulated when its practical to do so, and native when it needs to run across browsers.

***

## Command Log

```javascript
cy.get("input[name=firstName]").type("Jane Lane")
```

The commands above will display in the command log as:

<img width="584" alt="screen shot 2015-11-29 at 1 25 51 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459104/ee20613e-969c-11e5-8c78-e78b39d9ec46.png">

When clicking on `type` within the command log, the console outputs the following:

<img width="637" alt="screen shot 2015-11-29 at 1 26 24 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459106/f14f3308-969c-11e5-8352-f96744bbd713.png">

***

## Related
1. [clear](/v1.0/docs/clear)
