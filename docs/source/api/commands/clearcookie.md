---
title: clearCookie
comments: false
---

Clear a specific browser cookie.

{% note warning %}
Cypress automatically clears all cookies *before* each test to prevent state from being shared across tests. You shouldn't need to use this command unless you're using it to clear all cookies inside a single test.
{% endnote %}

# Syntax

```javascript
cy.clearCookie(name)
cy.clearCookie(name, options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.clearCookie('authId')    // clear the 'authId' cookie
```

## Arguments

**{% fa fa-angle-right %} name** ***(String)***

The name of the cookie to be cleared.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.clearCookie()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `responseTimeout` configuration#Timeouts %} | {% usage_options timeout cy.clearCookie %}

## Yields {% helper_icon yields %}

{% yields null cy.clearCookie %}

# Examples

## No Args

***Clear a cookie after logging in***

In this example, on first login, our server sends us back a session cookie. After invoking `cy.clearCookie('session_id')`, this clears the session cookie. Then upon navigating to an unauthorized page, we asset that our server has redirected us back to login.

```javascript
// assume we just logged in
cy.contains('Login').click()
cy.url().should('include', 'profile')
cy.clearCookie('session_id')
cy.visit('/dashboard') // we should be redirected back to login
cy.url().should('include', 'login')
```

# Rules

## Requirements {% helper_icon requirements %}

{% requirements parent cy.clearCookie %}

## Assertions {% helper_icon assertions %}

{% assertions none cy.clearCookie %}

## Timeouts {% helper_icon timeout %}

{% timeouts automation cy.clearCookie %}

# Command Log

***Clearing a cookie after setting a cookie***

```javascript
cy.setCookie('foo', 'bar')
cy.clearCookie('foo')
cy.getCookie('foo').should('be.null')
```

The commands above will display in the command log as:

![Command Log](/img/api/clearcookie/clear-cookie-in-browser-tests.png)

When clicking on `clearCookie` within the command log, the console outputs the following:

![Console Log](/img/api/clearcookie/cleared-cookie-shown-in-console.png)

# See also

- {% url `cy.clearCookies()` clearcookies %}
- {% url `cy.clearLocalStorage()` clearlocalstorage %}
- {% url 'Cypress Cookies API' cookies %}
- {% url `cy.getCookie()` getcookie %}
- {% url `cy.getCookies()` getcookies %}
- {% url `cy.setCookie()` setcookie %}
