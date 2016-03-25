slug: within
excerpt: Set the root scope to the current subject

Reset the root scope to the current subject and pass that as an argument to the callback function.

| | |
|--- | --- |
| **Returns** | the new DOM element(s) found by the command. |
| **Timeout** | *cannot timeout* |

***

# [cy.within( *function* )](#section-usage)

Set the root scope to the current subject

***

# Options

Pass in an options object to change the default behavior of `cy.within`.

**cy.within( *options*, *function* )**

Option | Default | Notes
--- | --- | ---
`log` | `false` | Display command in command log

***

# Usage

## Get inputs within a form and submit the form

```html
<form>
  <input name="email" type="email">
  <input name="password" type="password">
  <button type="submit">Login</button>
</form>
```

```javascript
cy.get("form").within(function(){
  cy
    .get("input[name='email']").type("john.doe@email.com")
    .get("input[name='password']").type("password")
    .root().submit()
})
```

***

# Related

- [root](https://on.cypress.io/api/root)