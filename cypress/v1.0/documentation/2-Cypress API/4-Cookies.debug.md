slug: cookies-debug
excerpt: Log out cookie values on set or remove

### [Cypress.Cookies.debug( *boolean* )](#debug-usage)

Enable or disable cookie debugging. When enabled, Cypress will log out when cookies are set or removed.

***

`Cypress.Cookies` makes it easy to manage your application's cookies while your tests are running.

Additionally you can take advantage of [`Cypress.Cookies.preserveOnce`](http://on.cypress.io/api/cookies-preserveonce) or even **whitelist** cookies by their name to preserve values across multiple tests. This enables you to preserve sessions through several tests.

`Cookies.debug` lets you enable or disable cookie debugging. When enabled, Cypress will log out when cookies are set or removed.

By turning on debugging Cypress will automatically log out to the console when it **sets** or **removes** cookie values. This is useful to help you understand how Cypress removes cookies in between tests, and is useful to visualize how to handle preserving cookies in between tests.

***

## Debug Usage

```javascript
Cypress.Cookies.debug() // now Cypress will log out when it alters cookies

Cypress.Cookies.set("remember_token", "foobarbaz")

// => Cypress.Cookies.set name:remember_token value:foobarbaz

Cypress.Cookies.remove("remember_token")

// => Cypress.Cookies.remove name:remember_token
```

Debugging will be turned on until you explictly turn it back off.

```javascript
Cypress.Cookies.debug(false) // now debugging is turned off
```

