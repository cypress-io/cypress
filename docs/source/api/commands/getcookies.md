---
title: getCookies
comments: false
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
`timeout` | {% url `responseTimeout` configuration#Timeouts %} | Total time to wait for the `cy.getCookies()` command to be processed

## Yields {% helper_icon yields %}

`cy.getCookies()` yields an array cookie objects. Each cookie object has the following properties:

- `name`
- `value`
- `path`
- `domain`
- `httpOnly`
- `secure`
- `expiry`

## Timeout {% helper_icon timeout %}

`cy.getCookies()` will continue to look for cookies for the duration of the {% url `defaultCommandTimeout` configuration#Timeouts %}.

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

![Command Log](/img/api/getcookies/get-browser-cookies-and-inspect-all-properties.png)

When clicking on `getCookies` within the command log, the console outputs the following:

![Console Log](/img/api/getcookies/test-application-cookies.png)

# See also

- {% url `cy.clearCookie()` clearcookie %}
- {% url `cy.clearCookies()` clearcookies %}
- {% url 'Cypress Cookies API' cookies %}
- {% url `cy.getCookie()` getcookie %}
- {% url `cy.setCookie()` setcookie %}
