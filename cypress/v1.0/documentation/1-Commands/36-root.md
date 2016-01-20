slug: root
excerpt: Get the root element

# [cy.root()](#root-usage)

Get the root element. By default the root is `document`.

***

# Usage

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

1. [get](https://on.cypress.io/api/get)
1. [within](https://on.cypress.io/api/within)