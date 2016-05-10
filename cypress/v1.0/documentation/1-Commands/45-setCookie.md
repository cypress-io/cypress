slug: setcookie
excerpt: Set a browser cookie

Set a browser cookie.

| | |
|--- | --- |
| **Returns** | a cookie object |
| **Timeout** | *cannot timeout* |

***

# [cy.setCookie( *name*, *value* )](#section-usage)

Sets a browser cookie.

***

# Usage

## Set a cookie

```javascript
cy
  .getCookies().should('be.empty')
  .setCookie('session_id', '189jd09sufh33aaiidhf99d09')
  .getCookie('session_id').should('have.property', 'value', '189jd09sufh33aaiidhf99d09')
```

***

# Command Log

## Get cookie

```javascript
cy
  .getCookies().should('be.empty')
  .setCookie('fakeCookie1', '123ABC')
  .getCookie('fakeCookie1').should('have.property', 'value', '123ABC')
```

The commands above will display in the command log as:

![screen shot 2016-05-10 at 12 15 53 pm](https://cloud.githubusercontent.com/assets/1271364/15153887/00b4c98e-16a9-11e6-8df5-bb2018582439.png)

When clicking on `setCookie` within the command log, the console outputs the following:

![screen shot 2016-05-10 at 12 16 01 pm](https://cloud.githubusercontent.com/assets/1271364/15153886/00b41782-16a9-11e6-99db-bc085c3513b3.png)

***

# Related

- [clearCookie](https://on.cypress.io/api/clearcookie)
- [clearCookies](https://on.cypress.io/api/clearcookies)
- [getCookie](https://on.cypress.io/api/getcookie)
- [getCookies](https://on.cypress.io/api/getcookies)
- [Cypress API Cookies](https://on.cypress.io/api/cookies)