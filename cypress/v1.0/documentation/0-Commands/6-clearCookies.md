excerpt: Clear all browser cookies.
slug: clearcookies

### [cy.clearCookies()](#usage)

Clears all of the browser cookies.

Cypress automatically invokes this command **between** each test to prevent state from building up.

Therefore you won't need to invoke this command normally unless you're using it to clear cookies within a single test.

***

## Usage

> Clear cookies after logging in

```javascript
cy
  .login("bob@example.com", "p@ssw0rd") // example of custom command
  .clearCookies()
  .visit("/dashboard") // we should be redirected back to login
  .url().should("eq", "login")
```

In this example, when first login our server sends us back a `session cookie`. After invoking `cy.clearCookies` this would have cleared the session cookie, and upon navigating to a authorized page, our server should have redirected us back to login.
