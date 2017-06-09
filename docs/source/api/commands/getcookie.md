---
title: getCookie
comments: true
---

Get a browser cookie by it's name.

# Syntax

```javascript
cy.getCookie(name)
cy.getCookie(name, options)
```

## Usage

`cy.getCookie()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.getCookie('auth_key')     // Get cookie with name 'auth_key'
```

## Arguments

**{% fa fa-angle-right %} name** ***(String)***

The name of the cookie to get.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.getCookie()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`timeout` | [`responseTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to wait for the `cy.getCookie()` command to be processed

## Yields

`cy.getCookie()` yields a cookie object literal with the following properties:

- `name`
- `value`
- `path`
- `domain`
- `httpOnly`
- `secure`
- `expiry`

## Timeout

`cy.getCookie()` will continue to look for the cookie for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts).

# Examples

## Get Cookie

**Get `session_id` cookie after logging in**

In this example, on first login, our server sends us back a session cookie.

```javascript
// assume we just logged in
cy.contains('Login').click()
cy.url().should('include', 'profile')
cy.getCookie('session_id')
  .should('have.property', 'value', '189jd09su')
```

**Using `cy.getCookie()` to test logging in**

{% note info %}
Check out our example recipes using `cy.getCookie()` to test [logging in using HTML web forms](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_html_web_form_spec.js), [logging in using XHR web forms](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_xhr_web_form_spec.js) and [logging in with single sign on](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_single_sign_on_spec.js)
{% endnote %}

# Command Log

**Get cookie**

```javascript
cy.getCookie('fakeCookie1').should('have.property', 'value', '123ABC')
```

The commands above will display in the command log as:

![screen shot 2016-05-10 at 12 12 13 pm](https://cloud.githubusercontent.com/assets/1271364/15153750/7a1caa40-16a8-11e6-9f70-3858dacb6792.png)

When clicking on `getCookie` within the command log, the console outputs the following:

![screen shot 2016-05-10 at 12 12 05 pm](https://cloud.githubusercontent.com/assets/1271364/15153749/7a18b00c-16a8-11e6-86ad-ea969f46bb6c.png)

# See also

- {% url `cy.clearCookie()` clearcookie %}
- {% url `cy.clearCookies()` clearcookies %}
- [Cypress Cookies API](https://on.cypress.io/api/cookies)
- {% url `cy.getCookies()` getcookies %}
- {% url `cy.setCookie()` setcookie %}
