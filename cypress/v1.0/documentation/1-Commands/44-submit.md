slug: submit
excerpt: Submit a form

Submits the current subject if it is a form. Submit can only be called on a single form.

**The following events are fired during submit:** `submit`

| | |
|--- | --- |
| **Returns** | the current subject for futher chaining. |
| **Timeout** | `cy.submit` will retry for the duration of the [Command Timeout](https://on.cypress.io/guides/configuration#section-global-options). |

***

# [cy.submit()](#section-usage)

Submit a form.

***

# Options

Pass in an options object to change the default behavior of `cy.submit`.

**cy.submit( *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | Display command in command log

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

<img width="547" alt="screen shot 2015-11-29 at 12 42 22 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458858/b30b0a0a-9696-11e5-99b9-d785b597287c.png">

***

# Related

- [click](https://on.cypress.io/api/click)