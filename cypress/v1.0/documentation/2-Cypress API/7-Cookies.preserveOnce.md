slug: cookies-preserveonce
excerpt: Instantiate a bluebird promise

### [Cypress.Cookies.preserveOnce( *key1*, *key2*, *key3*, ... )](#preserve-usage)

Will preserve cookies by key. Pass an unlimited number of arguments. These preserved cookies will not be cleared when the next test starts.

***

`Cypress.Cookies` makes it easy to manage your application's cookies while your tests are running.

Additionally you can take advantage of [`Cypress.Cookies.preserveOnce`](http://on.cypress.io/api/cookies-preserveonce) or even **whitelist** cookies by their name to preserve values across multiple tests. This enables you to preserve sessions through several tests.

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

