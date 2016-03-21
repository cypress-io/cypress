slug: clearcookies
excerpt: Clear all browser cookies

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

# Command Log

## Clear cookies after getting cookies

```javascript
cy
  .getCookies().should("have.property", "fakeCookie1", "123ABC")
  .clearCookies().should("not.have.property", "fakeCookie1")
```

The commands above will display in the command log as:

![screen shot 2016-03-21 at 12 16 30 pm](https://cloud.githubusercontent.com/assets/1271364/13925547/0bc16998-ef5f-11e5-8b89-c95fa392d054.png)

When clicking on `clearCookies` within the command log, the console outputs the following:

![screen shot 2016-03-21 at 12 16 49 pm](https://cloud.githubusercontent.com/assets/1271364/13925548/0ef41bce-ef5f-11e5-8fc1-de98817ed495.png)

***

# Related

- [getCookies](https://on.cypress.io/api/getcookies)
- [Cypress API Cookies](https://on.cypress.io/api/cookies)