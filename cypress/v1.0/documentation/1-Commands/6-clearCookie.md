slug: clearcookie
excerpt: Clear a browser cookie

Clears a browser cookie.

Cypress automatically clears all cookies **before** each test to prevent state from building up. You shouldn't need to invoke this command unless you're using it to clear a specific cookie inside a single test.

| | |
|--- | --- |
| **Returns** | `null` |
| **Timeout** | *cannot timeout* |

***

# [cy.clearCookie( *name* )](#section-usage)

Clears a browser cookie.

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

## Clearing a cookie after getting a cookie

```javascript
cy
  .getCookie('fakeCookie1').should('have.property', 'value', '123ABC')
  .clearCookie('fakeCookie1')
  .getCookie('fakeCookie1').should('be.null')
```

The commands above will display in the command log as:

![screen shot 2016-05-10 at 11 58 03 am](https://cloud.githubusercontent.com/assets/1271364/15153246/7a9d1a92-16a6-11e6-9415-6985204477e7.png)

When clicking on `clearCookie` within the command log, the console outputs the following:

![screen shot 2016-05-10 at 11 57 56 am](https://cloud.githubusercontent.com/assets/1271364/15153245/7a9b246c-16a6-11e6-8925-04247aaf5401.png)

***

# Related

- [clearCookies](https://on.cypress.io/api/clearcookies)
- [getCookie](https://on.cypress.io/api/getcookie)
- [getCookies](https://on.cypress.io/api/getcookies)
- [setCookie](https://on.cypress.io/api/setcookie)
- [Cypress API Cookies](https://on.cypress.io/api/cookies)