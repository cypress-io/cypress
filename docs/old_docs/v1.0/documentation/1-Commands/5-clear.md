slug: clear
excerpt: Clear a value of an input or textarea

Clears a value of an `<input>` or `<textarea>`. Under the hood this is actually a shortcut for writing:

```javascript
cy.type("{selectall}{backspace}")
```

Prior to clearing, if the element isn't currently focused, Cypress will issue a [click](https://on.cypress.io/api/click) on the element, which will cause the element to receive focus.

**The following events are fired during clear:** `keydown`, `keypress`, `textInput`, `input`, `keyup`.

`beforeinput` is *not* fired even though it is in the spec because no browser has adopted it.

| | |
|--- | --- |
| **Returns** | the element that was typed into |
| **Timeout** | `cy.clear` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) or the duration of the `timeout` specified in the command's [options](#section-options).|

***

# [cy.clear()](#section-usage)

Clears the value of an `<input>` or `<textarea>`.

***

# Options

Pass in an options object to change the default behavior of `cy.clear`.

**cy.clear( *options* )**

Option | Default | Notes
--- | --- | ---
`force` | `false` | Forces clear, disables error checking prior to clear
`interval` | `16` | Interval which to retry type
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) | Total time to retry the type
`log` | `true` | whether to display command in command log

***

# Usage

## Clear the input and type a new value.

```html
<input name="name" value="John Doe" />
```

```javascript
// clears the existing value first before typing
cy.get("input[name='name']").clear().type("Jane Lane")
```

***

# Command Log

## Clear the input and type a new value

```javascript
cy.get("input[name='name']").clear().type("Jane Lane")
```

The commands above will display in the command log as:

<img width="570" alt="screen shot 2015-11-29 at 12 56 58 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458939/bac1f4dc-9698-11e5-8e20-1ed9405f3d30.png">

When clicking on `clear` within the command log, the console outputs the following:

<img width="511" alt="screen shot 2015-11-29 at 12 57 07 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458940/bdc93a50-9698-11e5-8be7-ef6a0470c3ae.png">

***

# Related

- [type](https://on.cypress.io/api/type)