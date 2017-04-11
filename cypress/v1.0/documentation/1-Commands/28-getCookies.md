slug: getcookies
excerpt: Get all browser cookies

Gets all of the browser cookies.

| | |
|--- | --- |
| **Returns** | an array of cookie objects |
| **Timeout** | `cy.getCookies` will wait up for the duration of [`responseTimeout`](https://on.cypress.io/guides/configuration#timeouts) for the automation server to process this command.  |

***

# [cy.getCookies()](#usage)

Gets the browser cookies.

Each cookie object will have the following properties:

| Properties |
| --- |
| `name` |
| `value` |
| `path` |
| `domain` |
| `httpOnly` |
| `secure` |
| `expiry` |

***


# Options

Pass in an options object to change the default behavior of `cy.getCookies`.

**[cy.getCookies(*options* )](#options-usage)**

Option | Default | Notes
--- | --- | ---
`timeout` | [`responseTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to wait for the `cy.getCookies` command to be processed
`log` | `true` | whether to display command in command log

***

# Usage

## Get cookies after logging in

In this example, on first login our server sends us back a session cookie.

```javascript
cy
  .login("bob@example.com", "p@ssw0rd") // example of a custom command
  .getCookies()
    .should('have.length', 1)
    .then(function(cookies) {
      expect(cookies[0]).to.have.property('name', 'session_id')
    })
```

***

# Command Log

## Get cookies

```javascript
cy
  .getCookies()
    .should('have.length', 1)
    .then( function(cookies) {
      // each cookie has these properties
      expect(cookies[0]).to.have.property('name', 'fakeCookie1')
      expect(cookies[0]).to.have.property('value', '123ABC')
      expect(cookies[0]).to.have.property('domain')
      expect(cookies[0]).to.have.property('httpOnly')
      expect(cookies[0]).to.have.property('path')
      expect(cookies[0]).to.have.property('secure')
    })
```

The commands above will display in the command log as:

![screen shot 2016-05-10 at 12 06 46 pm](https://cloud.githubusercontent.com/assets/1271364/15153582/bc370c32-16a7-11e6-94b5-add51d7df7e5.png)

When clicking on `getCookies` within the command log, the console outputs the following:

![screen shot 2016-05-10 at 12 07 00 pm](https://cloud.githubusercontent.com/assets/1271364/15153583/bc374300-16a7-11e6-8e40-2cba54b95a5a.png)

***

# Related

- [clearCookie](https://on.cypress.io/api/clearcookie)
- [clearCookies](https://on.cypress.io/api/clearcookies)
- [getCookie](https://on.cypress.io/api/getcookie)
- [setCookie](https://on.cypress.io/api/setcookie)
- [Cypress Cookies API](https://on.cypress.io/api/cookies)
