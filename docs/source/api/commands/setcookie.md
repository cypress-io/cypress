---
title: setcookie
comments: true
description: ''
---

Set a browser cookie.


# Syntax

```javascript
cy.setCookie(name, value)
cy.setCookie(name, value, options)
```

## Usage

`.setCookie()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.setCookie('auth_key', '123key')    
```

## Arguments

**{% fa fa-angle-right %} name** ***(String)***

The name of the cookie to set.

**{% fa fa-angle-right %} value** ***(String)***

The value of the cookie to set.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `.setCookie()`.

Option | Default | Notes
--- | --- | ---
`path` | `/` | the cookie path
`domain` | `window.location.hostname` | the domain the cookie is visible to
`secure` | `false` | whether the cookie is a secure cookie
`httpOnly` | `false` | whether the cookie is an HTTP only cookie
`expiry` | 20 years into the future | when the cookie expires, specified in seconds since [Unix Epoch](https://en.wikipedia.org/wiki/Unix_time).
`timeout` | [`responseTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to wait for the `cy.setCookie()` command to be processed
`log` | `true` | whether to display command in command log


## Yields

`.setCookie()` yields a cookie object literal with the following properties:

- `name`
- `value`
- `path`
- `domain`
- `httpOnly`
- `secure`
- `expiry`

## Timeout

`.setCookie()` will wait up for the duration of [`responseTimeout`](https://on.cypress.io/guides/configuration#timeouts) for the automation server to process this command.

# Examples

## Set Value

**Set a cookie**

```javascript
cy
  .getCookies().should('be.empty')
  .setCookie('session_id', '189jd09sufh33aaiidhf99d09')
  .getCookie('session_id').should('have.property', 'value', '189jd09sufh33aaiidhf99d09')
```

# Command Log

**Set a cookie**

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

# See also

- [clearCookie](https://on.cypress.io/api/clearcookie)
- [clearCookies](https://on.cypress.io/api/clearcookies)
- [getCookie](https://on.cypress.io/api/getcookie)
- [getCookies](https://on.cypress.io/api/getcookies)
- [Cypress Cookies API](https://on.cypress.io/api/cookies)
