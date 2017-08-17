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

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.getCookies()    // Get all cookies
```

## Arguments

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.getCookies()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `responseTimeout` configuration#Timeouts %} | {% usage_options timeout cy.getCookies %}

## Yields {% helper_icon yields %}

`cy.getCookies()` yields an array of cookie objects. Each cookie object has the following properties:

- `name`
- `value`
- `path`
- `domain`
- `httpOnly`
- `secure`
- `expiry`

# Examples

## Get Cookies

***Get cookies after logging in***

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

# Rules

## Requirements {% helper_icon requirements %}

{% requirements parent cy.getCookies %}

## Assertions {% helper_icon assertions %}

{% assertions once cy.getCookies %}

## Timeouts {% helper_icon timeout %}

{% timeouts automation cy.getCookies %}

# Command Log

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
