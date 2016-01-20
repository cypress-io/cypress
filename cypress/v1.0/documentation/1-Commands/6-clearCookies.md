slug: clearcookies
excerpt: Clear all browser cookies.

## [cy.clearCookies()](#usage)

Clears all of the browser cookies.

Cypress automatically invokes this command **between** each test to prevent state from building up.

You shouldn't need to invoke this command unless you're using it to clear cookies inside a single test.

***

## Usage

Clear cookies after logging in

```javascript
cy
  .login("bob@example.com", "p@ssw0rd") // example of custom command
  .clearCookies()
  .visit("/dashboard") // we should be redirected back to login
  .url().should("eq", "login")
```

In this example, on first login our server sends us back a session cookie. After invoking `cy.clearCookies` this clears the session cookie, and upon navigating to an unauthorized page, our server should have redirected us back to login.

## Related
1. [Cypress API Cookies](http://on.cypress.io/api/cookies)