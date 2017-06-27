---
title: Cypress.Cookies
comments: false
---

`Cookies.debug()`, `Cookies.preserveOnce()` and `Cookies.defaults()` allow you to do more than just get, set, or clear cookies.

Typically you'd use `Cypress.Cookies` in hooks like `before`, `beforeEach`, `after`, and `afterEach`.

Cypress automatically clears all cookies **before** each test to prevent state from building up.

You can take advantage of `Cypress.Cookies.preserveOnce` or even *whitelist* cookies by their name to preserve values across multiple tests. This enables you to preserve sessions through several tests.

# Syntax

```javascript
Cypress.Cookies.debug(enable, options)
Cypress.Cookies.preserveOnce(names...)
Cypress.Cookies.defaults(options)
```

## Usage

`Cookies.debug()`, `Cookies.preserveOnce()` and `Cookies.defaults()` require being chained off `Cypress`.

**{% fa fa-check-circle green %} Correct Usage**

```javascript
Cypress.Cookies.debug()
Cypress.Cookies.preserveOnce('appId')
Cypress.Cookies.defaults()
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.Cookies.debug() // Errors, cannot be chained off 'cy'
```


## Arguments

**{% fa fa-angle-right %} enable**  ***(Boolean)***

Whether cookie debugging should be enabled.

**{% fa fa-angle-right %} names**

Names of cookies to be preserved. Pass an unlimited number of arguments.

**{% fa fa-angle-right %} object**  ***(Object)***

Set defaults for all cookies, such as whitelisting a set of cookies to bypass being cleared before each test.

# Examples

## Debug

**Log out when cookie values set or clear**

By turning on debugging, Cypress will automatically log out to the console when it *sets* or *clears* cookie values. This is useful to help you understand how Cypress clears cookies before each test, and is useful to visualize how to handle preserving cookies in between tests.

```javascript
Cypress.Cookies.debug(true) // now Cypress will log out when it alters cookies

cy.clearCookie('foo')
cy.setCookie('foo', 'bar')
```

![Console log when debugging cookies](https://cloud.githubusercontent.com/assets/1268976/15457855/e2b6e99c-205f-11e6-8b25-ac6e0dcae9ce.png)

**Turn off verbose debugging output**

By default Cypress will log out the cookie object which allows you to inspect all of its properties. However you may not need that level of detail and you can turn this off.

```javascript
Cypress.Cookies.debug(true, {verbose: false})
```

Now when Cypress logs cookies they will only include the `name` and `value`.

![Console log cookies with debug](https://cloud.githubusercontent.com/assets/1268976/15457832/680bc71c-205f-11e6-9b8b-1c84380790e0.png)

Debugging will be turned on until you explicitly turn it off.

```javascript
Cypress.Cookies.debug(false) // now debugging is turned off
```

## Preserve Once

**Preserve cookies through multiple tests**

Cypress gives you a simple interface to automatically preserve cookies for multiple tests. Cypress automatically clears all cookies before each new test starts by default.

By clearing cookies before each test you are guaranteed to always start from a clean slate. Starting from a clean state prevents coupling your tests to one another and prevents situations where mutating something in your application in one test affects another one downstream.

{% note info  %}
The most common use case for preserving cookies is to prevent having to log in to your application before each individual test. This is a problem if the majority of each test is spent logging in a user.
{% endnote %}

You can use `Cypress.Cookies.preserveOnce()` to preserve cookies through multiple tests.

There are *likely* better ways to do this, but this isn't well documented at the moment. Every application is different and there is no one-size-fits-all solution. For the moment, if you're using session-based cookies, this method will work.

```javascript
describe("Dashboard", function(){
  before(function(){
    // log in only once before any of the tests run.
    // your app will likely set some sort of session cookie.
    // you'll need to know the name of the cookie(s), which you can find
    // in your Resources -> Cookies panel in the Chrome Dev Tools.
    cy.login()
  })

  beforeEach(function(){
    // before each test, we can automatically preserve the
    // 'session_id' and 'remember_token' cookies. this means they
    // will not be cleared before the NEXT test starts.
    //
    // the name of your cookies will likely be different
    // this is just a simple example
    Cypress.Cookies.preserveOnce("session_id", "remember_token")
  })

  it("displays stats", function(){
    // ...
  })

  it("can do something", function(){
    // ...
  })

  it("opens a modal", function(){
    // ...
  })
})
```

## Defaults

**Set global default cookies**

You can modify the global defaults and whitelist a set of Cookies which will always be preserved across tests.

Any change you make here will take effect immediately for the remainder of every single test.

{% note info  %}
A great place to put this configuration is in your `cypress/support/defaults.js` file, since it is loaded before any test files are evaluated.
{% endnote %}

**Whitelist accepts:**

- String
- Array
- RegExp
- Function

***Whitelist String***

```javascript
// now any cookie with the name 'session_id' will
// not be cleared before each test runs
Cypress.Cookies.defaults({
  whitelist: "session_id"
})
```

***Whitelist Array***

```javascript
// now any cookie with the name 'session_id' or 'remember_token'
// will not be cleared before each test runs
Cypress.Cookies.defaults({
  whitelist: ["session_id", "remember_token"]
})
```

***Whitelist RegExp***

```javascript
// now any cookie that matches this RegExp
// will not be cleared before each test runs
Cypress.Cookies.defaults({
  whitelist: /session|remember/
})
```

***Whitelist Function***

```javascript
Cypress.Cookies.defaults({
  whitelist: function(cookie){
    // implement your own logic here
    // if the function returns truthy
    // then the cookie will not be cleared
    // before each test runs
  }
})
```

# See also

- {% url `cy.clearCookie()` clearcookie %}
- {% url `cy.clearCookies()` clearcookies %}
- {% url `cy.getCookie()` getcookie %}
- {% url `cy.getCookies()` getcookies %}
- {% url `cy.setCookie()` setcookie %}
