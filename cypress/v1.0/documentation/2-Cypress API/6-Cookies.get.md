excerpt: Get a cookie by its key. Returns the string value.
slug: cookies-get

### [Cypress.Cookies.get( *key* )](#get-usage)

Get a cookie by its key. Returns the string value.

***

`Cypress.Cookies` makes it easy to manage your application's cookies while your tests are running.

Additionally you can take advantage of [`Cypress.Cookies.preserveOnce`](http://on.cypress.io/api/cookies-preserveonce) or even **whitelist** cookies by their name to preserve values across multiple tests. This enables you to preserve sessions through several tests.

***

## Get Usage

```javascript
// Assuming we had a cookie with the key: 'session_id'

Cypress.Cookies.get("session_id") // => AF6bupO4jOpZReEZnaW-Ho5fpJAXd_48kA
```

