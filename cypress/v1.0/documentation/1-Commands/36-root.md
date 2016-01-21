slug: root
excerpt: Get the root element

# [cy.root()](#root-usage)

Get the root element. By default the root is `document`.

***

# Options

Pass in an options object to specify the conditions of the command.

**cy.root( *options* )**

`cy.root` supports these options:

Option | Default | Notes
--- | --- | ---
`log` | `true` | Display command in command log

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