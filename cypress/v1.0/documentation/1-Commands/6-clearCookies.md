slug: clearcookies
excerpt: Clear all browser cookies.

Clears all of the browser cookies.

Cypress automatically invokes this command **between** each test to prevent state from building up. You shouldn't need to invoke this command unless you're using it to clear cookies inside a single test.

| | |
|--- | --- |
| **Returns** | the remaining cookies |
| **Timeout** | *cannot timeout* |

***

# [cy.clearCookies()](#section-usage)

Clears the browser cookies.

***

# Usage

## Clear cookies after logging in

In this example, on first login our server sends us back a session cookie. After invoking `cy.clearCookies` this clears the session cookie, and upon navigating to an unauthorized page, our server should have redirected us back to login.

```javascript
cy
  .login("bob@example.com", "p@ssw0rd") // example of custom command
  .clearCookies()
  .visit("/dashboard") // we should be redirected back to login
  .url().should("eq", "login")
```

***

# Related

- [Cypress API Cookies](https://on.cypress.io/api/cookies)