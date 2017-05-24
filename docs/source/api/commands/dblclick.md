---
title: dblclick
comments: true
description: ''
---

Double-click a DOM element.

# Syntax

```javascript
.dblclick()
.dblclick(options)
```

## Usage

`.dblclick()` requires being chained off another cy command that *yields* a DOM element.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('button').dblclick()          // Double clicks on button
cy.focused().dblclick()              // Double clicks on el with focus
cy.contains('Welcome').dblclick()    // Double clicks on first el containing 'Welcome'
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.click('button')          // Errors, cannot be chained off 'cy'
cy.window().click()         // Errors, 'window' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} options** ***(Object)***


Pass in an options object to change the default behavior of `.dblclick()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log


## Yields

`.dblclick()` yields the DOM subject chained from the previous command.

## Timeout

`.dblclick()` will wait for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts)

# Examples

## Double Click

**Double click an anchor link**

```html
<a href="#nav1">Menu</a>
```

```javascript
cy.get('#nav1').dblclick() // yields the <a>
```

# Command Log

**Double click on a calendar schedule**

```javascript
cy.get('[data-schedule-id="4529114"]:first').dblclick()
```

The commands above will display in the command log as:

<img width="585" alt="screen shot 2015-11-29 at 1 12 02 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459013/035a6c5e-969b-11e5-935f-dce5c8efbdd6.png">

When clicking on `dblclick` within the command log, the console outputs the following:

<img width="836" alt="screen shot 2015-11-29 at 1 12 26 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459015/0755e216-969b-11e5-9f7e-ed04245d75ef.png">

# See also

- [click](https://on.cypress.io/api/click)
