---
title: prevAll
comments: false
---

Get all previous siblings of each DOM element in a set of matched DOM elements.

# Syntax

```javascript
.prevAll()
.prevAll(selector)
.prevAll(options)
.prevAll(selector, options)
```

## Usage

`.prevAll()` requires being chained off another cy command that *yields* a DOM element or set of DOM elements.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('.active').prevAll() // Yield all links previous to `.active`
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.prevAll()                // Errors, cannot be chained off 'cy'
cy.getCookies().prevAll()   // Errors, 'getCookies' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} selector**  ***(String selector)***

A selector used to filter matching DOM elements.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.prevAll()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | Total time to retry getting the element

## Yields

`.prevAll()` yields the new DOM element(s) found by the command.

## Timeout

`.prevAll()` will continue to look for the previous elements for the duration of the {% url `defaultCommandTimeout` configuration#Timeouts %}.

# Examples

## All Previous

**Find all of the element's siblings before `.third`**

```html
<ul>
  <li>apples</li>
  <li>oranges</li>
  <li class="third">bananas</li>
  <li>pineapples</li>
  <li>grapes</li>
</ul>
```

```javascript
// yields [<li>apples</li>, <li>oranges</li>]
cy.get('.third').prevAll()
```

## Selector

**Find all of the previous siblings of each li. Keep only the ones with a class `selected`.**

```html
<ul>
  <li>apples</li>
  <li>oranges</li>
  <li>bananas</li>
  <li class="selected">pineapples</li>
  <li>grapes</li>
</ul>
```

```javascript
// yields <li>pineapples</li>
cy.get('li').prevAll('.selected')
```

# Command Log

**Find all elements before the `.active` li**

```javascript
cy.get('.left-nav').find('li.active').prevAll()
```

The commands above will display in the command log as:

![Command Log](/img/api/commands/prevall/find-all-previous-elements-with-optional-selector.png)

When clicking on `prevAll` within the command log, the console outputs the following:

![Console Log](/img/api/commands/prevall/console-log-all-previous-elements-traversed.png)

# See also

- {% url `.nextAll()` nextall %}
- {% url `.parents()` parents %}
- {% url `.prev()` prev %}
- {% url `.prevUntil()` prevuntil %}
