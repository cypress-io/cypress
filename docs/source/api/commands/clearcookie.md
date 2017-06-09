---
title: clearCookie
comments: true
---

Clear a browser cookie.

{% note warning %}
Cypress automatically clears all cookies *before* each test to prevent state from being shared across tests. You shouldn't need to use this command unless you're using it to clear all cookies inside a single test.
{% endnote %}

# Syntax


```javascript
cy.clearCookie(name)
cy.clearCookie(name, options)
```

## Usage

`cy.clearCookie()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.clearCookie('authId')    // clear the 'authId' cookie
```

## Arguments

**{% fa fa-angle-right %} name** ***(String)***

The name of the cookie to be cleared.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.clearCookie()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`timeout` | [`responseTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to wait for the `cy.clearCookie()` command to be processed

## Yields

`cy.clearCookie()` yields `null`.

## Timeout

`cy.clearCookie()` will wait up for the duration of [`responseTimeout`](https://on.cypress.io/guides/configuration#timeouts) for the automation server to process the command.

# Examples

## Clear Cookie

**Clear a cookie after logging in**

In this example, on first login, our server sends us back a session cookie. After invoking `cy.clearCookie('session_id')`, this clears the session cookie. Then upon navigating to an unauthorized page, we asset that our server has redirected us back to login.

```javascript
// assume we just logged in
cy.contains('Login').click()
cy.url().should('include', 'profile')
cy.clearCookie('session_id')
cy.visit('/dashboard') // we should be redirected back to login
cy.url().should('include', 'login')
```

# Command Log

**Clearing a cookie after setting a cookie**

```javascript
cy.setCookie('foo', 'bar')
cy.clearCookie('foo')
cy.getCookie('foo').should('be.null')
```

The commands above will display in the command log as:

![screen shot 2016-05-22 at 9 21 14 pm](https://cloud.githubusercontent.com/assets/1268976/15458066/345b5bb8-2063-11e6-91bb-173421c8440a.png)

When clicking on `clearCookie` within the command log, the console outputs the following:

![screen shot 2016-05-22 at 9 21 32 pm](https://cloud.githubusercontent.com/assets/1268976/15458067/345dba3e-2063-11e6-8739-af971bc79068.png)

# See also

- [clearCookies](https://on.cypress.io/api/clearcookies)
- [Cypress Cookies API](https://on.cypress.io/api/cookies)
- [getCookie](https://on.cypress.io/api/getcookie)
- [getCookies](https://on.cypress.io/api/getcookies)
- [setCookie](https://on.cypress.io/api/setcookie)
