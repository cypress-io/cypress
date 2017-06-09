---
title: getCookies
comments: true
---

Get all of the browser cookies.

# Syntax

```javascript
cy.getCookies()
cy.getCookies(options)
```

## Usage

`cy.getCookies()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.getCookies()    // Get all cookies
```

## Arguments

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.getCookies()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`timeout` | [`responseTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to wait for the `cy.getCookies()` command to be processed

## Yields

`cy.getCookies()` yields an array cookie objects. Each cookie object has the following properties:

- `name`
- `value`
- `path`
- `domain`
- `httpOnly`
- `secure`
- `expiry`

## Timeout

`cy.getCookies()` will continue to look for cookies for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts).

# Examples

## Get Cookies

**Get cookies after logging in**

In this example, on first login our server sends us back a session cookie.

```javascript
// assume we just logged in
cy.contains('Login').click()
cy.url().should('include', 'profile')
cy.getCookies()
  .should('have.length', 1)
  .then(function(cookies) {
    expect(cookies[0]).to.have.property('name', 'session_id')
  })
```

# Command Log

**Get cookies**

```javascript
cy.getCookies().should('have.length', 1).then(function(cookies) {
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

# See also

- [clearCookie](https://on.cypress.io/api/clearcookie)
- [clearCookies](https://on.cypress.io/api/clearcookies)
- [Cypress Cookies API](https://on.cypress.io/api/cookies)
- [getCookie](https://on.cypress.io/api/getcookie)
- [setCookie](https://on.cypress.io/api/setcookie)
