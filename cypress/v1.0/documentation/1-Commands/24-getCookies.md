slug: getcookies
excerpt: Get all browser cookies

Gets all of the browser cookies.

| | |
|--- | --- |
| **Returns** | all cookies |
| **Timeout** | *cannot timeout* |

***

# [cy.getCookies()](#section-usage)

Gets the browser cookies.

***

# Usage

## Get cookies after logging in

In this example, on first login our server sends us back a session cookie.

```javascript
cy
  .login("bob@example.com", "p@ssw0rd") // example of a custom command
  .getCookies().should("have.property", "token")
```

***

# Command Log

## Get cookies after setting cookies on click of button

```javascript
cy
  .getCookies().should("not.have.property", "fakeCookie1")
  .get(".get-cookies-btn").click()
  .getCookies().should("have.property", "fakeCookie1", "123ABC")
```

The commands above will display in the command log as:

![screen shot 2016-03-21 at 12 14 55 pm](https://cloud.githubusercontent.com/assets/1271364/13925411/9746ed36-ef5e-11e5-8516-8f02f16cccb1.png)

When clicking on `getCookies` within the command log, the console outputs the following:

![screen shot 2016-03-21 at 12 15 05 pm](https://cloud.githubusercontent.com/assets/1271364/13925418/9b62f0a4-ef5e-11e5-868a-1227a3c67354.png)

***

# Related

- [clearCookies](https://on.cypress.io/api/clearcookies)
- [Cypress API Cookies](https://on.cypress.io/api/cookies)