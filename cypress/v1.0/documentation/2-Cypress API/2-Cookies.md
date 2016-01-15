slug: cookies
excerpt: Manage your application's cookies

`Cypress.Cookies` makes it easy to manage your application's cookies while your tests are running.

Additionally you can take advantage of `Cypress.Cookies.preserveOnce` or even **whitelist** cookies by their name to preserve values across multiple tests. This enables you to preserve sessions through several tests.

### [Cypress.Cookies.get( *key* )](#get-usage)

Get a cookie by its key. Returns the string value.

***

### [Cypress.Cookies.set( *key*, *value* )](#set-usage)

Set a cookie by key, value.

***

### [Cypress.Cookies.remove( *key* )](#remove-usage)

Remove a cookie by its key. Overrides any whitelisted cookies or preserved cookies.

***

### [Cypress.Cookies.debug( *boolean* )](#debug-usage)

Enable or disable cookie debugging. When enabled, Cypress will log out when cookies are set or removed.

***

### [Cypress.Cookies.preserveOnce( *key1*, *key2*, *key3*, ... )](#preserve-usage)

Will preserve cookies by key. Pass an unlimited number of arguments. These preserved cookies will not be cleared when the next test starts.

***

### [Cypress.Cookies.defaults( *options* )](#defaults-usage)

Set defaults for all cookies such as whitelisting a set of cookies to bypass being removed after each test.

***

## Get Usage

```javascript
// Assuming we had a cookie with the key: 'session_id'

Cypress.Cookies.get("session_id") // => AF6bupO4jOpZReEZnaW-Ho5fpJAXd_48kA
```

***

## Set Usage

```javascript
Cypress.Cookies.set("remember_token", "foobarbaz")

Cypress.Cookies.get("remember_token") // => foobarbaz
```

***

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
```

***

## Debug Usage

By turning on debugging Cypress will automatically log out to the console when it **sets** or **removes** cookie values. This is useful to help you understand how Cypress removes cookies in between tests, and is useful to visualize how to handle preserving cookies in between tests.

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

***

## Preserve Usage

Cypress gives you a simple interface to automatically preserve cookies **after** a test finished. By default Cypress will automatically remove all cookies before each new test starts.

By removing cookies in between tests you are guranteed to always start from a clean slate, which is good. Starting from a clean state prevents coupling your tests to one another and prevents situations where mutating something in your application in one test affects another one downstream.

However you are most likely looking to preserve cookies because you want to prevent having to log into your application before each individual test. This is likely a problem if the majority of each test is spent logging in a user.

You can use `Cypress.Cookies.preserveOnce` to achieve this.

There are *likely* better ways to do this, but this isn't well documented at the moment. Every application is different and therefore there is no one-size-fits-all solution. For the moment, if you're using session-based cookies, this method will work.


<!-- Before you start preserving cookies in each test you should ask yourself: is there a better way to achieve this goal? Perhaps instead of visiting your login page, typing in a username and password, you can expose an endpoint and use `cy.request` to simply ask your backend for a session.

For instance let's assume your login page issues a `POST` to `http://localhost:8080/login` with the  -->

```javascript
describe("User Dashboard", function(){
  before(function(){
    // log ourselves only once before any of the tests run.
    // your application will likely set some sort of session cookie.
    // you'll need to know the name of these cookie(s), which you can find
    // in your Resources -> Cookies panel in the Chrome Dev Tools.
    cy.login()
  })

  beforeEach(function(){
    // now before each test we can automatically preserve the
    // 'session_id' and 'remember_token' cookies. this means they
    // will not be removed when the NEXT test starts. thus they
    // are preserved once after this test ends.
    //
    // the name of your cookies will likely be different, this is
    // just a simple example
    Cypress.Cookies.preserveOnce("session_id", "remember_token")
  })

  it("displays stats", function(){
    ...
  })

  it("can do something", function(){
    ...
  })

  it("open a modal", function(){
    ...
  })
})
```

***

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

***

## Notes

#### Whats the difference between this interface and `cy.clearCookies`?

`cy.clearCookies` is a command that is useful to use throughout your tests. Since it is a command it can be chained onto other commands. Additionally like other commands it is asynchronous.

`Cypress.Cookies` is a synchronous interface that allows you to do more than just clear cookies.

Typically you'd use `Cypress.Cookies` in hooks like `before`, `beforeEach`, `after`, `afterEach`, etc.