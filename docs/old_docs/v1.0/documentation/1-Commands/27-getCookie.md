slug: getcookie
excerpt: Get a browser cookie

Get a browser cookie.

| | |
|--- | --- |
| **Returns** | a cookie object literal |
| **Timeout** | `cy.getCookie` will wait up for the duration of [`responseTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) for the automation server to process this command. |

***

# [cy.getCookie( *name* )](#section-usage)

Gets a browser cookie by its name.

This object will have the following properties:

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

Pass in an options object to change the default behavior of `cy.getCookie`.

**cy.getCookie( *name*, *options* )**

Option | Default | Notes
--- | --- | ---
`timeout` | [`responseTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) | Total time to wait for the `cy.getCookie` command to be processed
`log` | `true` | whether to display command in command log

***

# Usage

## Get `session_id` cookie after logging in

In this example, on first login our server sends us back a session cookie.

```javascript
cy
  .login('bob@example.com', 'p@ssw0rd') // example of a custom command
  .getCookie('session_id')
    .should('have.property', 'value', '189jd09sufh33aaiidhf99d09')
```

[block:callout]
{
  "type": "info",
  "body": "Check out our example recipes using cy.getCookie to test [logging in using HTML web forms](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_html_web_form_spec.js), [logging in using XHR web forms](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_xhr_web_form_spec.js) and [logging in with single sign on](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_single_sign_on_spec.js)",
  "title": "Using cy.getCookie to test login"
}
[/block]

***

# Command Log

## Get cookie

```javascript
cy
  .getCookie('fakeCookie1')
    .should('have.property', 'value', '123ABC')
```

The commands above will display in the command log as:

![screen shot 2016-05-10 at 12 12 13 pm](https://cloud.githubusercontent.com/assets/1271364/15153750/7a1caa40-16a8-11e6-9f70-3858dacb6792.png)

When clicking on `getCookie` within the command log, the console outputs the following:

![screen shot 2016-05-10 at 12 12 05 pm](https://cloud.githubusercontent.com/assets/1271364/15153749/7a18b00c-16a8-11e6-86ad-ea969f46bb6c.png)

***

# Related

- [clearCookie](https://on.cypress.io/api/clearcookie)
- [clearCookies](https://on.cypress.io/api/clearcookies)
- [getCookies](https://on.cypress.io/api/getcookies)
- [setCookie](https://on.cypress.io/api/setcookie)
- [Cypress Cookies API](https://on.cypress.io/api/cookies)
