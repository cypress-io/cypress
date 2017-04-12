slug: clearcookie
excerpt: Clear a browser cookie

Clears a browser cookie.

Cypress automatically clears all cookies **before** each test to prevent state from building up. You shouldn't need to invoke this command unless you're using it to clear a specific cookie inside a single test.

| | |
|--- | --- |
| **Returns** | `null` |
| **Timeout** | `cy.clearCookie` will wait up for the duration of [`responseTimeout`](https://on.cypress.io/guides/configuration#timeouts) for the automation server to process this command. |

***

# [cy.clearCookie( *name* )](#usage)

Clears a browser cookie by its name.

***

# Options

Pass in an options object to change the default behavior of `cy.clearCookie`.

**[cy.clearCookie( *name*, *options* )](#options-usage)**

Option | Default | Notes
--- | --- | ---
`timeout` | [`responseTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to wait for the `cy.clearCookie` command to be processed
`log` | `true` | whether to display command in command log

***

# Usage

## Clear a cookie after logging in

In this example, on first login our server sends us back a session cookie. After invoking `cy.clearCookie('session_id')` this clears the session cookie, and upon navigating to an unauthorized page, our server should have redirected us back to login.

```javascript
cy
  .login('bob@example.com', 'p@ssw0rd') // example of custom command
  .clearCookie('session_id')
  .visit('/dashboard')                  // we should be redirected back to login
  .url().should('eq', 'login')
```

***

# Command Log

## Clearing a cookie after setting a cookie

```javascript
cy
  .setCookie('foo', 'bar')
  .clearCookie('foo')
  .getCookie('foo').should('be.null')
```

The commands above will display in the command log as:

![screen shot 2016-05-22 at 9 21 14 pm](https://cloud.githubusercontent.com/assets/1268976/15458066/345b5bb8-2063-11e6-91bb-173421c8440a.png)

When clicking on `clearCookie` within the command log, the console outputs the following:

![screen shot 2016-05-22 at 9 21 32 pm](https://cloud.githubusercontent.com/assets/1268976/15458067/345dba3e-2063-11e6-8739-af971bc79068.png)

***

# Related

- [clearCookies](https://on.cypress.io/api/clearcookies)
- [getCookie](https://on.cypress.io/api/getcookie)
- [getCookies](https://on.cypress.io/api/getcookies)
- [setCookie](https://on.cypress.io/api/setcookie)
- [Cypress Cookies API](https://on.cypress.io/api/cookies)
