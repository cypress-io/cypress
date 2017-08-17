---
title: hover
comments: false
---

{% note danger %}
Cypress does not have a **cy.hover()** command. See {% issue 10 'Issue #10' %}.
{% endnote %}

If `cy.hover()` is used, an error will display and redirect you to this page.

# Workaround

Sometimes an element has specific logic on hover and you *do* need to "hover" in Cypress. Maybe the element doesn't even display to be clickable until you hover over another element.

Oftentimes you can use {% url `.invoke()` invoke %} or {% url `cy.wrap()` wrap %} to show the element before you perform the action.

## Invoke

***Example of showing an element in order to perform action***
```javascript
cy.get('.content').invoke('show').click()
```

{% note info %}
{% url 'Check out our example recipe on testing hover and working with hidden elements' testing-the-dom-recipe %}
{% endnote %}

You can also force the action to be performed on the element regardless of whether the element is visible or not.

## Force click

***Example of clicking on a hidden element***
```javascript
cy.get('.content').click({ force: true })
```

***Example of checking a hidden element***
```javascript
cy.get('.checkbox').check({ force: true })
```
<!--
## Trigger

If the hover behavior depends on a JavaScript event like `mouseover`, you can trigger the event to achieve that behavior.

**Example of triggering a mouseover event**
```javascript
cy.get('.content').trigger('mouseover')
``` -->

# See also

- {% url `.invoke()` invoke %}
- {% url `cy.wrap()` wrap %}
- {% url 'Recipe: Dealing with Hover and Hidden Elements' testing-the-dom-recipe %}
