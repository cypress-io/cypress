slug: dom
excerpt: Find out whether an element is hidden

`Cypress.Dom` holds methods and logic related to DOM.

# [Cypress.Dom.isHidden( *element* )](#is-hidden-usage)

Returns a boolean indicating whether an element is hidden.

Cypress internally uses this method *everywhere* to figure out whether an element is hidden.

***

# Is Hidden Usage

```javascript
var $el = $("#modal")

Cypress.Dom.isHidden($el) // => false

```

