slug: within
excerpt: Within

### [cy.within( *function* )](#usage)

***

## Usage

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

## Related
1. [root](http://on.cypress.io/api/root)