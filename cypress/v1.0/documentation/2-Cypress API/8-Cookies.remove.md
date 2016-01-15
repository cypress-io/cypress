slug: cookies-remove
excerpt: Remove a cookie by its key.

### [Cypress.Cookies.remove( *key* )](#remove-usage)

Remove a cookie by its key. Overrides any whitelisted cookies or preserved cookies.

***

`Cypress.Cookies` makes it easy to manage your application's cookies while your tests are running.

Additionally you can take advantage of [`Cypress.Cookies.preserveOnce`](http://on.cypress.io/api/cookies-preserveonce) or even **whitelist** cookies by their name to preserve values across multiple tests. This enables you to preserve sessions through several tests.

## Remove Usage

This will remove a cookies value and override any specific whitelisting or cookie preservation you have. In other words, this will nuke the cookies value no matter what.

```javascript
Cypress.Cookies.set("remember_token", "foobarbaz")
Cypress.Cookies.remove("remember_token")
Cypress.Cookies.get("remember_token") // => undefined
```

```javascript
// even if keys are preserved they will still be removed
Cypress.Cookies.set("remember_token", "foobarbaz")
Cypress.Cookies.preserveOnce("remember_token")
Cypress.Cookies.remove("remember_token")
Cypress.Cookies.get("remember_token") // => undefined

## Notes

#### Whats the difference between this interface and `cy.clearCookies`?

`cy.clearCookies` is a command that is useful to use throughout your tests. Since it is a command it can be chained onto other commands. Additionally like other commands it is asynchronous.

`Cypress.Cookies` is a synchronous interface that allows you to do more than just clear cookies.

Typically you'd use `Cypress.Cookies` in hooks like `before`, `beforeEach`, `after`, `afterEach`, etc.

