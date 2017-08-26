---
title: Testing the DOM
comments: false
containerClass: examples
---

## [Tab Handling and Anchor Links](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/tab_handling_anchor_links_spec.js)

- Test anchor links opening in new tabs: `<a target="_blank">`.
- Test anchor links that link to external domains: `<a href="...">`.
- Prevent content from opening in a new tab.
- Request external content that would open in a new tab using {% url "`cy.request()`" request%}.
- Speed up tests by reducing loading times.

## [Dealing with Hover and Hidden Elements](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/hover_hidden_elements_spec.js)

- Interact with elements that are hidden by CSS.
- Trigger `mouseover`, `mouseout`, `mouseenter`, `mouseleave` events.
