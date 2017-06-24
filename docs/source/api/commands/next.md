---
title: next
comments: false
---

Get the immediately following sibling of each DOM element within a set of DOM elements.

# Syntax

```javascript
.next()
.next(selector)
.next(options)
.next(selector, options)
```

## Usage

`.next()` requires being chained off another cy command that *yields* a DOM element or set of DOM elements.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('nav a:first').next() // Yield next link in nav
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.next()                // Errors, cannot be chained off 'cy'
cy.getCookies().next()   // Errors, 'getCookies' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} selector**  ***(String selector)***

A selector used to filter matching DOM elements.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.next()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .next %}

## Yields {% helper_icon yields %}

`.next()` yields the new DOM element(s) found by the command.

## Timeout {% helper_icon timeout %}

`.next()` will continue to look for the next element for the duration of the {% url `defaultCommandTimeout` configuration#Timeouts %}.

# Examples

## Next

**Find the element next to `.second`**

```html
<ul>
  <li>apples</li>
  <li class="second">oranges</li>
  <li>bananas</li>
</ul>
```

```javascript
// yields <li>bananas</li>
cy.get('.second').next()
```

## Selector

**Find the very next sibling of each li. Keep only the ones with a class `selected`.**

```html
<ul>
  <li>apples</li>
  <li>oranges</li>
  <li>bananas</li>
  <li class="selected">pineapples</li>
</ul>
```

```javascript
// yields <li>pineapples</li>
cy.get('li').next('.selected')
```

# Command Log

**Find the element next to the `.active` li**

```javascript
cy.get('.left-nav').find('li.active').next()
```

The commands above will display in the command log as:

![Command Log next](/img/api/next/find-next-element-when-testing-dom.png)

When clicking on `next` within the command log, the console outputs the following:

![Console log next](/img/api/next/elements-next-command-applied-to.png)

# See also

- {% url `.nextAll()` nextall %}
- {% url `.nextUntil()` nextuntil %}
- {% url `.prev()` prev %}
