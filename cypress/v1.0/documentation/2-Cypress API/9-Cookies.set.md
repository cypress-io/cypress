slug: cookies-set
excerpt: Set a cookie by key, value.

### [Cypress.Cookies.set( *key*, *value* )](#set-usage)

Set a cookie by key, value.

***

`Cypress.Cookies` makes it easy to manage your application's cookies while your tests are running.

Additionally you can take advantage of [`Cypress.Cookies.preserveOnce`](http://on.cypress.io/api/cookies-preserveonce) or even **whitelist** cookies by their name to preserve values across multiple tests. This enables you to preserve sessions through several tests.

***

## Set Usage

```javascript
Cypress.Cookies.set("remember_token", "foobarbaz")

Cypress.Cookies.get("remember_token") // => foobarbaz
```
