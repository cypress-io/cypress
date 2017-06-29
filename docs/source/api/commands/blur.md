---
title: blur
comments: false
---

Blur a focused element.

{% note warning %}
This element must currently be in focus. If you want to ensure an element is focused before blurring, try using {% url `.focus()` focus %} before `.blur()`.
{% endnote %}

# Syntax

```javascript
.blur()
.blur(options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.get('[type="email"]').type('me@email.com').blur() // Blur email input
cy.get('[tabindex="1"]').focus().blur()              // Blur el with tabindex
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.blur('input')              // Errors, cannot be chained off 'cy'
cy.window().blur()            // Errors, 'window' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.blur`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`force` | `false` | Forces the action, disables checking if {% urlHash 'element is focused' Requirements %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .blur %}

## Yields {% helper_icon yields %}

{% yields same_subject .blur %}

# Examples

## Blur

**Blur the comment input.**

```javascript
cy.get('[name="comment"]').type('Nice Product!').blur()
```

## Options

**Blur the first input**

Setting `force` to `true` in the options disables checking whether the input is focusable or currently has focus.

```javascript
cy.get('input:first').blur({ force: true })
```

# Rules

## Requirements {% helper_icon requirements %}

{% requirements blurability .blur %}

## Assertions {% helper_icon assertions %}

{% assertions wait .blur %}

## Timeouts {% helper_icon timeout %}

{% timeouts assertions .blur %}

# Notes

***`.blur()` can time out because your browser did not receive any blur events.***

If you see this error, you may want to ensure that the main browser window is currently focused. This means not being focused in debugger or any other window when the command is run.

# Command Log

**Blur a textarea after typing.**

```javascript
cy.get('[name="comment"]').focus().type('Nice Product!').blur()
```

The commands above will display in the command log as:

![command log for blur](/img/api/blur/blur-input-command-log.png)

When clicking on the `blur` command within the command log, the console outputs the following:

![console.log for blur](/img/api/blur/console-showing-blur-command.png)

# See also

- {% url `.focus()` focus %}
- {% url `cy.focused()` focused %}
