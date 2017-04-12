slug: root
excerpt: Get the root element

Get the root element. By default the root is `document`. When calling `cy.root` in a [`cy.within`](https://on.cypress.io/api/within), the root element will be the return of the within command.

| | |
|--- | --- |
| **Returns** | the new DOM element(s) found by the command. |
| **Timeout** | `cy.root` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) |

***

# [cy.root()](#root-usage)

Get the root element.

***

# Options

Pass in an options object to change the default behavior of `cy.root`.

**cy.root( *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log

***

# Usage

## Get the root element

```javascript
// returns document
cy.root()
```

***

## Get the root element in a `within` scope

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

    // the root element in a within is the previous
    // commands subject, in this case <form>
    .root().submit()
})
```

***

# Related

- [get](https://on.cypress.io/api/get)
- [within](https://on.cypress.io/api/within)
