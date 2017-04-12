slug: submit
excerpt: Submit a form

Submits the DOM element from the previous command if it is a form. Submit can only be called on a single form.

**The following events are fired during submit:** `submit`

| | |
|--- | --- |
| **Returns** | the new DOM element(s) found by the command. |
| **Timeout** | `cy.submit` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts). |

***

# [cy.submit()](#usage)

Submit a form.

***

# Options

Pass in an options object to change the default behavior of `cy.submit`.

**cy.submit( *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log

***

# Usage

## Submit a form

```html
<form id="contact">
  <input type="text" name="message">
  <button type="submit">Send</button>
</form>
```

```javascript
// submits the form and performs all default actions
// returns <form> for further chaining
cy.get("#contact").submit()
```

***

# Command Log

## Submit a form

```javascript
cy.route("POST", /users/, "fixture:user").as("userSuccess")
cy.get("form").submit()
```

The commands above will display in the command log as:

<img width="594" alt="screen shot 2015-11-29 at 1 21 43 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459081/3149d9e6-969c-11e5-85b2-ba57638f02df.png">

When clicking on `submit` within the command log, the console outputs the following:

![cy.submit console log](https://cloud.githubusercontent.com/assets/1271364/12888878/222f5522-ce4a-11e5-9edd-f67be2ebce40.png)

***

# Related

- [click](https://on.cypress.io/api/click)
