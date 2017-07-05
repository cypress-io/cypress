---
title: setCookie
comments: false
---

Set a browser cookie.

# Syntax

```javascript
cy.setCookie(name, value)
cy.setCookie(name, value, options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.setCookie('auth_key', '123key') // Set the 'auth_key' cookie to '123key'
```

## Arguments

**{% fa fa-angle-right %} name** ***(String)***

The name of the cookie to set.

**{% fa fa-angle-right %} value** ***(String)***

The value of the cookie to set.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.setCookie()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`domain` | `window.location.hostname` | The domain the cookie is visible to
`expiry` | 20 years into the future | When the cookie expires, specified in seconds since {% url 'Unix Epoch' https://en.wikipedia.org/wiki/Unix_time %}.
`httpOnly` | `false` | Whether the cookie is an HTTP only cookie
`path` | `/` | The cookie path
`secure` | `false` | Whether the cookie is a secure cookie
`timeout` | {% url `responseTimeout` configuration#Timeouts %} | {% usage_options timeout cy.setCookie %}

## Yields {% helper_icon yields %}

`cy.setCookie()` yields a cookie object literal with the following properties:

- `name`
- `value`
- `path`
- `domain`
- `httpOnly`
- `secure`
- `expiry`

# Examples

## Name Value

***Set a cookie***

```javascript
cy.getCookies().should('be.empty')
cy.setCookie('session_id', '189jd09sufh33aaiidhf99d09')
cy.getCookie('session_id').should('have.property', 'value', '189jd09sufh33aaiidhf99d09')
```

# Rules

## Requirements {% helper_icon requirements %}

{% requirements parent cy.setCookie %}

## Assertions {% helper_icon assertions %}

{% assertions once cy.setCookie %}

## Timeouts {% helper_icon timeout %}

{% timeouts automation cy.setCookie %}

# Command Log

```javascript
cy.getCookies().should('be.empty')
cy.setCookie('fakeCookie1', '123ABC')
cy.getCookie('fakeCookie1').should('have.property', 'value', '123ABC')
```

The commands above will display in the command log as:

![Command Log](/img/api/setcookie/set-cookie-on-browser-for-testing.png)

When clicking on `setCookie` within the command log, the console outputs the following:

![Console Log](/img/api/setcookie/see-cookie-properties-expiry-domain-and-others-in-test.png)

# See also

- {% url `cy.clearCookie()` clearcookie %}
- {% url `cy.clearCookies()` clearcookies %}
- {% url 'Cypress Cookies API' cookies %}
- {% url `cy.getCookie()` getcookie %}
- {% url `cy.getCookies()` getcookies %}
