slug: getcookie
excerpt: Get a browser cookie

Get a browser cookie.

| | |
|--- | --- |
| **Returns** | a cookie object |
| **Timeout** | *cannot timeout* |

***

# [cy.getCookie( *name* )](#section-usage)

Gets a browser cookie and their properties.

***

# Options

Pass in an options object to change the default behavior of `cy.getCookie`.

**[cy.getCookie( *name*, *options* )](#options-usage)**

Option | Default | Notes
--- | --- | ---
`timeout` | [`commandTimeout`](https://on.cypress.io/guides/configuration#section-global-options) | Total time to retry the getCookie command
`log` | `true` | whether to display command in command log

***

# Usage

## Get `session_id` cookie after logging in

In this example, on first login our server sends us back a session cookie.

```javascript
cy
  .login('bob@example.com', 'p@ssw0rd') // example of a custom command
  .getCookie('session_id')
    .should('have.property', 'value', '189jd09sufh33aaiidhf99d09')
```

***

# Command Log

## Get cookie

```javascript
cy
  .getCookie('fakeCookie1')
    .should('have.property', 'value', '123ABC')
```

The commands above will display in the command log as:

![screen shot 2016-05-10 at 12 12 13 pm](https://cloud.githubusercontent.com/assets/1271364/15153750/7a1caa40-16a8-11e6-9f70-3858dacb6792.png)

When clicking on `getCookie` within the command log, the console outputs the following:

![screen shot 2016-05-10 at 12 12 05 pm](https://cloud.githubusercontent.com/assets/1271364/15153749/7a18b00c-16a8-11e6-86ad-ea969f46bb6c.png)

***

# Related

- [clearCookie](https://on.cypress.io/api/clearcookie)
- [clearCookies](https://on.cypress.io/api/clearcookies)
- [getCookie](https://on.cypress.io/api/getcookie)
- [setCookie](https://on.cypress.io/api/setcookie)
- [Cypress API Cookies](https://on.cypress.io/api/cookies)