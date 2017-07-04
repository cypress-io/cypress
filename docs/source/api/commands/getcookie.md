---
title: getCookie
comments: false
---

Get a browser cookie by it's name.

# Syntax

```javascript
cy.getCookie(name)
cy.getCookie(name, options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.getCookie('auth_key')     // Get cookie with name 'auth_key'
```

## Arguments

**{% fa fa-angle-right %} name** ***(String)***

The name of the cookie to get.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.getCookie()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `responseTimeout` configuration#Timeouts %} | {% usage_options timeout cy.getCookie %}

## Yields {% helper_icon yields %}

`cy.getCookie()` yields a cookie object with the following properties:

- `name`
- `value`
- `path`
- `domain`
- `httpOnly`
- `secure`
- `expiry`

***When a cookie matching the name could not be found:***

`cy.getCookie()` yields `null`.

# Examples

## No Args

***Get `session_id` cookie after logging in***

In this example, on first login, our server sends us back a session cookie.

```javascript
// assume we just logged in
cy.contains('Login').click()
cy.url().should('include', 'profile')
cy.getCookie('session_id')
  .should('have.property', 'value', '189jd09su')
```

***Using `cy.getCookie()` to test logging in***

{% note info %}
Check out our example recipes using `cy.getCookie()` to test {% url 'logging in using HTML web forms' logging-in-recipe %}, {% url 'logging in using XHR web forms' logging-in-recipe %} and {% url 'logging in with single sign on' logging-in-recipe %}
{% endnote %}

# Rules

## Requirements {% helper_icon requirements %}

{% requirements parent cy.getCookie %}

## Assertions {% helper_icon assertions %}

{% assertions once cy.getCookie %}

## Timeouts {% helper_icon timeout %}

{% timeouts automation cy.getCookie %}

# Command Log

```javascript
cy.getCookie('fakeCookie1').should('have.property', 'value', '123ABC')
```

The commands above will display in the command log as:

![Command Log](/img/api/getcookie/get-browser-cookie-and-make-assertions-about-object.png)

When clicking on `getCookie` within the command log, the console outputs the following:

![Console Log](/img/api/getcookie/inspect-cookie-object-properties-in-console.png)

# See also

- {% url `cy.clearCookie()` clearcookie %}
- {% url `cy.clearCookies()` clearcookies %}
- {% url 'Cypress Cookies API' cookies %}
- {% url `cy.getCookies()` getcookies %}
- {% url `cy.setCookie()` setcookie %}
