---
title: type
comments: false
---

Type into a DOM element.

# Syntax

```javascript
.type(text)
.type(text, options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.get('input').type('Hello, World') // Type 'Hello, World' into the 'input'
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.type('Welcome')               // Errors, cannot be chained off 'cy'
cy.url().type('www.cypress.io')  // Errors, 'url' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} text**  ***(String)***

The text to be typed into the DOM element.

Text passed to `.type()` may include any of these special character sequences:

Sequence | Notes
--- | ---
`{% raw %}{{{% endraw %}}`| Types the literal `{` key
`{backspace}` | Deletes character to the left of the cursor
`{del}` | Deletes character to the right of the cursor
`{downarrow}` | Fires down event but does **not** move the cursor
`{enter}` | Types the Enter key
`{esc}` | Types the Escape key
`{leftarrow}` | Moves cursor left
`{rightarrow}` | Moves cursor right
`{selectall}` | Selects all text by creating a `selection range`
`{uparrow}` | Fires up event but does **not** move the cursor

Text passed to `.type()` may also include any of the these modifier character sequences:

Sequence | Notes
--- | ---
`{alt}` | Activates the `altKey` modifier. Aliases: `{option}`
`{ctrl}` | Activates the `ctrlKey` modifier. Aliases: `{control}`
`{meta}` | Activates the `metaKey` modifier. Aliases: `{command}`, `{cmd}`
`{shift}` | Activates the `shiftKey` modifier.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.type()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`delay` | `10` | Delay after each keypress
`force` | `false` | {% usage_options force type %}
`release` | `true` | Keep a modifier activated between commands
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .type %}

## Yields {% helper_icon yields %}

{% yields same_subject .type %}

# Examples

## Input/Textarea

***Type into a textarea.***

```javascript
cy.get('textarea').type('Hello world') // yields <textarea>
```

***Type into a login form***

{% note info %}
{% url "Check out our example recipe of logging in by typing username and password" logging-in-recipe %}
{% endnote %}

***Mimic user typing behavior***

Each keypress is delayed 10ms by default in order to simulate how a very fast user types!

```javascript
cy.get('[contenteditable]').type('some text!')
```

## Tabindex

***Type into a non-input or non-textarea element with `tabindex`***

```html
<body>
  <div id="el" tabindex="1">
    This div can receive focus!
  </div>
</body>
```

```javascript
cy.get('#el').type('supercalifragilisticexpialidocious')
```

## Date Inputs

Using `.type()` on a date input (`<input type="date">`) requires specifying a valid date in the format:

- `yyyy-MM-dd` (e.g. `1999-12-31`)

This isn't exactly how a user would type into a date input, but is a workaround since date input support varies between browsers and the format varies based on locale. `yyyy-MM-dd` is the format required by {% url "the W3 spec" https://www.w3.org/TR/html/infrastructure.html#sec-dates %} and is what the input's `value` will be set to regardless of browser or locale.

Special characters (`{leftarrow}`, `{selectall}`, etc) are not permitted.

## Month Inputs

Using `.type()` on a month input (`<input type="month">`) requires specifying a valid month in the format:

- `yyyy-MM` (e.g. `1999-12`)

This isn't exactly how a user would type into a month input, but is a workaround since month input support varies between browsers and the format varies based on locale. `yyyy-MM` is the format required by {% url "the W3 spec" https://www.w3.org/TR/html/infrastructure.html#months %} and is what the input's `value` will be set to regardless of browser or locale.

Special characters (`{leftarrow}`, `{selectall}`, etc) are not permitted.

## Week Inputs

Using `.type()` on a week input (`<input type="week">`) requires specifying a valid week in the format:

- `yyyy-Www` (e.g. `1999-W23`)

Where `W` is the literal character 'W' and `ww` is the number of the week (01-53).

This isn't exactly how a user would type into a week input, but is a workaround since week input support varies between browsers and the format varies based on locale. `yyyy-Www` is the format required by {% url "the W3 spec" https://www.w3.org/TR/html/infrastructure.html#valid-week-string %} and is what the input's `value` will be set to regardless of browser or locale.

Special characters (`{leftarrow}`, `{selectall}`, etc) are not permitted.

## Time Inputs

Using `.type()` on a time input (`<input type="time">`) requires specifying a valid time in the format:

- `HH:mm` (e.g. `01:30` or `23:15`)
- `HH:mm:ss` (e.g. `10:00:30`)
- `HH:mm:ss.SSS` (e.g. `12:00:00.384`)

Where `HH` is 00-23, `mm` is 00-59, `ss` is 00-59, and `SSS` is 000-999.

Special characters (`{leftarrow}`, `{selectall}`, etc) are not permitted.

## Key Combinations

When using special character sequences, it's possible to activate modifier keys and type key combinations, such as `CTRL + R` or `SHIFT + ALT + Q`. The modifier(s) remain activated for the duration of the `.type()` command, and are released when all subsequent characters are typed, unless {% url '`{release: false}`' type#Options %} is passed as an {% url 'option' type#Key-Combinations %}. A `keydown` event is fired when a modifier is activated and a `keyup` event is fired when it is released.

***Type a key combination***

```javascript
// this is the same as a user holding down SHIFT and ALT, then pressing Q
cy.get('input').type('{shift}{alt}Q')
```

***Hold down modifier key and type a word***

```javascript
// all characters after {ctrl} will have 'ctrlKey'
// set to 'true' on their key events
cy.get('input').type('{ctrl}test')
```

***Release behavior***

By default, modifiers are released after each type command.

```javascript
// 'ctrlKey' will be true for each event while 'test' is typed
// but false while 'everything' is typed
cy.get('input').type('{ctrl}test').type('everything')
```

To keep a modifier activated between commands, specify `{release: false}` in the options.

```javascript
// 'altKey' will be true while typing 'foo'
cy.get('input').type('{alt}foo', { release: false })
// 'altKey' will also be true during 'get' and 'click' commands
cy.get('button').click()
```

Modifiers are automatically released between tests, even with `{release: false}`.

```javascript
it('has modifiers activated', function () {
  // 'altKey' will be true while typing 'foo'
  cy.get('input').type('{alt}foo', {release: false})
})

it('does not have modifiers activated', function () {
  // 'altKey' will be false while typing 'bar'
  cy.get('input').type('bar')
})
```

To manually release modifiers within a test after using `{release: false}`, use another `type` command and the modifier will be released after it.

```javascript
// 'altKey' will be true while typing 'foo'
cy.get('input').type('{alt}foo', {release: false})
// 'altKey' will be true during the 'get' and 'click' commands
cy.get('button').click()
// 'altKey' will be released after this command
cy.get('input').type('{alt}')
// 'altKey' will be false during the 'get' and 'click' commands
cy.get('button').click()
```

## Global Shortcuts

`.type()` requires a focusable element as the subject, since it's usually intended to type into something that's an input or textarea. Although there *are* a few cases where it's valid to "type" into something other than an input or textarea:

* Keyboard shortcuts where the listener is on the `document` or `body`.
* Holding modifier keys and clicking an arbitrary element.

To support this, the `body` can be used as the DOM element to type into (even though it's *not* a focusable element).

***Use keyboard shortcuts in body***

```javascript
// all of the type events are fired on the body
cy.get('body').type('{uparrow}{uparrow}{downarrow}{downarrow}{leftarrow}{rightarrow}{leftarrow}{rightarrow}ba')
```

***Do a shift + click***

```javascript
// execute a SHIFT + click on the first <li>
// {release: false} is necessary so that
// SHIFT will not be released after the type command
cy.get('body').type('{shift}', {release: false}).get('li:first').click()
```

## Options

***Force typing regardless of its actionable state***

Forcing typing overrides the {% url 'actionable checks' interacting-with-elements#Forcing %} Cypress applies and will automatically fire the events.

```javascript
cy.get('input[type=text]').type('Test all the things', { force: true })
```

# Notes

## Actionability

`.type()` is an "action command" that follows all the rules {% url 'defined here' interacting-with-elements %}.

## Events

***When element is not in focus***

If the element is currently not in focus, before issuing any keystrokes Cypress will first issue a {% url `.click()` click %} to the element to bring it into focus.

All of the normal events documented on {% url `.click()` click %} will fire.

***Events that fire***

Once the element is in focus, Cypress will begin firing keyboard events.

The following events will be fired based on what key was pressed identical to the event spec:

- `keydown`
- `keypress`
- `textInput`
- `input`
- `keyup`

`beforeinput` is *not* fired even though it is in the spec because no browser has adopted it.

Additionally `change` events will be fired either when the `{enter}` key is pressed (and the value has changed since the last focus event), or whenever the element loses focus. This matches browser behavior.

Events that should not fire on non input types such as elements with `tabindex` do not fire their `textInput` or `input` events. Only typing into elements which cause the actual value or text to change will fire those events.

***Event Firing***

The following rules have been implemented that match real browser behavior (and the spec):

1. Cypress respects not firing subsequent events if previous ones were cancelled.
2. Cypress will fire `keypress` *only* if that key is supposed to actually fire `keypress`.
3. Cypress will fire `textInput` *only* if typing that key would have inserted an actual character.
4. Cypress will fire `input` *only* if typing that key modifies or changes the value of the element.

***Event Cancellation***

Cypress respects all default browser behavior when events are cancelled.

```javascript
// prevent the characters from being inserted
// by canceling keydown, keypress, or textInput
$('#username').on('keydown', function(e){
  e.preventDefault();
})

// Cypress will not insert any characters if keydown, keypress, or textInput
// are cancelled - which matches the default browser behavior
cy.get('#username').type('bob@gmail.com').should('have.value', '') // true
```

***Preventing `mousedown` does not prevent typing***

In a real browser, preventing `mousedown` on a form field will prevent it from receiving focus and thus prevent it from being able to be typed into. Currently, Cypress does not factor this in. {% open_an_issue %} if you need this to be fixed.

***Key Events Table***

Cypress prints out a table of key events that detail the keys that were pressed when clicking on type within the {% url 'Command Log' type#Command-Log %}. Each character will contain the `which` character code and the events that happened as a result of that key press.

Events that were `defaultPrevented` may prevent other events from firing and those will show up as empty.  For instance, canceling `keydown` will not fire `keypress` or `textInput` or `input`, but will fire `keyup` (which matches the spec).

Additionally, events that cause a `change` event to fire (such as typing `{enter}`) will display with the `change` event column as `true`.

Any modifiers activated for the event are also listed in a `modifiers` column.

![Cypress .type() key events table](/img/api/type/key-events-table-shown-in-console-for-testing-typing.png)

## Tabbing

***Typing `tab` key does not work***

Tabbing will be implemented as a separate command as `.tab()` and support things like multiple tabs, tabbing in reverse, or tabbing to a specific element. {% open_an_issue %} if you need this to be fixed.

## Modifiers

***Modifier effects***

In a real browser, if a user holds `SHIFT` and types `a`, a capital `A` will be typed into the input. Currently, Cypress does not simulate that behavior.

Modifiers are simulated by setting their corresponding values to `true` for key and click events. So, for example, activating the `{shift}` modifier will set `event.shiftKey` to true for any key events, such as `keydown`.

```javascript
// app code
document.querySelector('input:first').addEventListener('keydown', function (e) {
  // e.shiftKey will be true
})

// in test
cy.get('input:first').type('{shift}a')
```

In the example above, a lowercase `a` will be typed, because that's the literal character specified. To type a capital `A`, you can use `.type('{shift}A')` (or simply `.type('A')` if you don't care about the `shiftKey` property on any key events).

This holds true for other special key combinations as well (that may be OS-specific). For example, on OSX, typing `ALT + SHIFT + K` creates the special character ``. Like with capitalization, `.type()` will not output ``, but simply the letter `k`. {% open_an_issue %} if you need modifier effects to be implemented.

## Form Submission

***Implicit form submission behavior***

Cypress automatically matches the spec and browser behavior for pressing the `{enter}` key when the input belongs to a `<form>`.

This behavior is defined here: {% url "Form Implicit Submission" https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission %}.

For instance the following will submit the form.

```html
<form action="/login">
  <input id="username" />
  <input id="password" />
  <button type="submit">Log In</button>
</form>
```

```javascript
cy.get('#username').type('bob@burgers.com')
cy.get('#password').type('password123{enter}')
```

Because there are multiple `inputs` and one `submit` button, Cypress submits the form (and fires submit events) as well as a synthetic `click` event to the `button`.

The spec defines the "submit" button as the first `input[type=submit]` or `button[type!=button]` from the form.

Additionally Cypress handles these 4 other situations as defined in the spec:

1. Does not submit a form if there are multiple inputs and no `submit` button.
2. Does not submit a form if the `submit` button is disabled.
3. Submits a form, but does not fire synthetic `click` event, if there is 1 `input` and no `submit` button
4. Submits form and fires a synthetic `click` event to the `submit` when it exists.

Of course if the form's `submit` event is `preventedDefault` the form will not actually be submitted.

# Rules

## Requirements {% helper_icon requirements %}

{% requirements dom .type %}

## Assertions {% helper_icon assertions %}

{% assertions actions .type %}

## Timeouts {% helper_icon timeout %}

{% timeouts actions .type %}

# Command Log

**Type into the input**

```javascript
cy.get('input[name=firstName]').type('Jane Lane')
```

The commands above will display in the command log as:

![Command Log](/img/api/type/type-in-input-shown-in-command-log.png)

When clicking on `type` within the command log, the console outputs the following:

![Console Log](/img/api/type/console-log-of-typing-with-entire-key-events-table-for-each-character.png)

# See also

- {% url `.blur()` blur %}
- {% url `.clear()` clear %}
- {% url `.click()` click %}
- {% url `.focus()` focus %}
- {% url `.submit()` submit %}
