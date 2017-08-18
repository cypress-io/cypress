---
title: Known Issues
comments: false
---

# Missing Commands

Some commands have not been implemented in Cypress. Some commands will be implemented in the future and some do not make sense to implement in Cypress.

## Right click

{% fa fa-github %} {% issue 53 'Issue #53' %}

**Workaround**

Oftentimes you can use {% url `.trigger()` trigger %}, {% url `.invoke()` invoke %} or {% url `cy.wrap()` wrap %} to trigger the event or execute the action in the DOM.

**Example of triggering `contextmenu` event**
```javascript
cy.get('#nav').first().trigger('contextmenu')
```

**Example of right clicking on an element using jQuery**
```javascript
cy.get('#nav').first().invoke('trigger', 'contextmenu')
```

## Hover

{% fa fa-github %} {% issue 10 'Issue #10' %}

Sometimes an element has specific logic on hover. Maybe the element doesn't even display to be clickable until you hover over a specific element.

{% url "Check out document on `cy.hover()` for workarounds." hover %}

# Difficult use cases

Cypress does not support the following use cases.

## Iframes

{% fa fa-github %} {% issue 136 'Issue #136' %}

You cannot target elements or interact with anything in an iframe - regardless of it being a same domain or cross domain iframe.

This is actively being worked on in Cypress and you'll first see support for same domain iframes, followed by cross domain (they are much harder to do).

**Workaround**

Sit tight, {% issue 136 'comment on the issue' %} so we know you care about this support, and be patient.

## OAuth

This is related to the iframe issue above, but basically `oauth` usually will not work. This is one of the hardest things for Cypress to be able to handle as there are so many different implementations and mechanisms.

Likely we will be able to support server side oauth redirects, but for client side popups you'll simply use `sinon` and `stub` the oauth response directly in your code. This is actually possible to do right now but we don't have any good docs or tutorials on it.

**Workaround**

[Come into Gitter](https://gitter.im/cypress-io/cypress) and talk to us about what you're trying to do. We'll tell you if you're able to mock this and how to do it.

## `window.fetch` routing and stubbing

{% fa fa-github %} {% issue 95 'Issue #95' %}

Support for `fetch` has not been added but it's possible to handle in the same way as we handle `XHRs`. This biggest challenge here is that you can use `fetch` in `Service Workers` outside of the global context. We'll likely have to move routing to the server and handle it in the proxy layer but it should be possible.

While we currently provide things like the stack trace and initiator line for XHR's we will not be able to provide that for `fetch`.

**Workaround**

Sit tight, {% issue 95 'comment on the issue' %} so we know you care about this support, and be patient.
