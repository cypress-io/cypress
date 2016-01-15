slug: cookies-defaults
excerpt: Modify Cookie defaults

### [Cypress.Cookies.defaults( *options* )](#defaults-usage)

Set defaults for all cookies such as whitelisting a set of cookies to bypass being removed after each test.

***

`Cypress.Cookies` makes it easy to manage your application's cookies while your tests are running.

Additionally you can take advantage of [`Cypress.Cookies.preserveOnce`](http://on.cypress.io/api/cookies-preserveonce) or even **whitelist** cookies by their name to preserve values across multiple tests. This enables you to preserve sessions through several tests.

## Defaults Usage

You can modify the global defaults and whitelist a set of Cookies which will always be preserved between tests.

Any change you make here will take effect immediately for the remainder of every single test.

> **Note:** A great place to put this configuration is in your `tests/_support/spec_helper.js` file, since it is loaded before any test files are evaluated.

Whitelist accepts:
- string
- array
- regexp
- function

```javascript
// string usage

// now any cookie with the name 'session_id' will
// not be cleared before each new test runs
Cypress.Cookies.defaults({
  whitelist: "session_id"
})
```

```javascript
// array usage

// now any cookie with the name 'session_id' or 'remember_token'
// will not be cleared before each new test runs
Cypress.Cookies.defaults({
  whitelist: ["session_id", "remember_token"]
})
```

```javascript
// regexp usage

// now any cookie which matches this regexp
// will not be cleared before each new test runs
Cypress.Cookies.defaults({
  whitelist: /session|remember/
})
```

```javascript
// function usage

Cypress.Cookies.defaults({
  whitelist: function(name){
    // implement your own logic here
    // if the function returns truthy
    // then the cookie will not be removed
  }
})
```


