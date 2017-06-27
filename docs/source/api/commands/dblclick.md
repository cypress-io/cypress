---
title: dblclick
comments: false
---

Double-click a DOM element.

# Syntax

```javascript
.dblclick()
.dblclick(options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.get('button').dblclick()          // Double click on button
cy.focused().dblclick()              // Double click on el with focus
cy.contains('Welcome').dblclick()    // Double click on first el containing 'Welcome'
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.click('button')          // Errors, cannot be chained off 'cy'
cy.window().click()         // Errors, 'window' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `.dblclick()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .dblclick %}

## Yields {% helper_icon yields %}

{% yields same_subject .dblclick %}

## Requirements {% helper_icon requirements %}

{% requirements child_dom .dblclick %}

## Assertions {% helper_icon assertions %}

{% assertions actions .dblclick %}

## Timeouts {% helper_icon timeout %}

{% timeouts actions .dblclick %}

# Examples

## Double Click

**Double click an anchor link**

```javascript
cy.get('a#nav1').dblclick() // yields the <a>
```

# Command Log

**Double click on a calendar schedule**

```javascript
cy.get('[data-schedule-id="4529114"]:first').dblclick()
```

The commands above will display in the command log as:

![Command Log dblclick](/img/api/dblclick/double-click-in-testing.png)

When clicking on `dblclick` within the command log, the console outputs the following:

![console.log dblclick](/img/api/dblclick/element-double-clicked-on.png)

# See also

- {% url `.click()` click %}
