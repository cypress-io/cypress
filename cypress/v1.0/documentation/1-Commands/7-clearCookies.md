slug: clearcookies
excerpt: Clear all browser cookies

Clears all of the browser cookies.

Cypress automatically invokes this command **before** each test to prevent state from building up. You shouldn't need to invoke this command unless you're using it to clear cookies inside a single test.

| | |
|--- | --- |
| **Returns** | `null` |
| **Timeout** | `cy.clearCookies` will wait up for the duration of [`responseTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) for the automation server to process this command.|

***

# [cy.clearCookies()](#section-usage)

Clears all the browser cookies.

***

# Options

Pass in an options object to change the default behavior of `cy.clearCookies`.

**[cy.clearCookies(*options* )](#options-usage)**

Option | Default | Notes
--- | --- | ---
`timeout` | [`responseTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) | Total time to wait for the `cy.clearCookies` command to be processed
`log` | `true` | whether to display command in command log

***

# Usage

## Clear cookies after logging in

In this example, on first login our server sends us back a session cookie. After invoking `cy.clearCookies` this clears the session cookie, and upon navigating to an unauthorized page, our server should have redirected us back to login.

```javascript
cy
  .login("bob@example.com", "p@ssw0rd") // example of custom command
  .clearCookies()
  .visit("/dashboard")                  // we should be redirected back to login
  .url().should("eq", "login")
```

***

# Command Log

## Clear cookies after getting cookies

```javascript
cy
  .getCookies().should('have.length', 1)
  .clearCookies()
  .getCookies().should('be.empty')
```

The commands above will display in the command log as:

![screen shot 2016-05-10 at 12 01 38 pm](https://cloud.githubusercontent.com/assets/1271364/15153391/1afa9fb4-16a7-11e6-9a76-3c3e6b4b9f6b.png)

When clicking on `clearCookies` within the command log, the console outputs the following:

![screen shot 2016-05-10 at 12 02 01 pm](https://cloud.githubusercontent.com/assets/1271364/15153392/1afb086e-16a7-11e6-9541-1b1794e14705.png)

***

# Related

- [clearCookie](https://on.cypress.io/api/clearcookie)
- [getCookie](https://on.cypress.io/api/getcookie)
- [getCookies](https://on.cypress.io/api/getcookies)
- [setCookie](https://on.cypress.io/api/setcookie)
- [Cypress Cookies API](https://on.cypress.io/api/cookies)