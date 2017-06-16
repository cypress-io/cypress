---
title: Logging In
comments: false
containerClass: examples
---

## {% url "HTML Web Form" https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_html_web_form_spec.js %}

- Test a standard `username/password` HTML form.
- Test errors submitting invalid data.
- Test unauthenticated redirects.
- Authenticate users with cookies.
- Create a custom `cy.login()` test command.
- Bypass needing to use your actual UI.
- Increase speed of testing with {% url `cy.request()` request %}.

## {% url "XHR Web Form" https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_xhr_web_form_spec.js %}

- Test an AJAX backed `username/password` form.
- Test errors submitting invalid data.
- Stub JSON based XHR requests.
- Stub application functions.
- Create a custom `cy.login()` test command.
- Bypass needing to use your actual UI.
- Increase speed of testing with {% url `cy.request()` request %}.

## {% url "CSRF Tokens" https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_csrf_tokens_spec.js %}

- Use {% url `cy.request()` request %} to get around CSRF protections.
- Parse CSRF tokens out of HTML.
- Parse CSRF tokens out of response headers.
- Expose CSRF via a route.
- Disable CSRF when not in production.

## {% url "Single Sign On" https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_single_sign_on_spec.js %}

- Login when authentication is done on a 3rd party server.
- Parse tokens using {% url `cy.request()` request %}.
- Manually set tokens on local storage.
- Map external hosts and point to local servers.
