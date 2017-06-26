---
title: prev
comments: false
---

Get the immediately preceding sibling of each element in a set of the elements.

# Syntax

```javascript
.prev()
.prev(selector)
.prev(options)
.prev(selector, options)
```

## Usage

`.prev()` requires being chained off another cy command that *yields* a DOM element or set of DOM elements.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('tr.highlight').prev() // Yield previous 'tr'
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.prev()                // Errors, cannot be chained off 'cy'
cy.getCookies().prev()   // Errors, 'getCookies' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} selector**  ***(String selector)***

A selector used to filter matching DOM elements.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.prev()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .prev %}

## Yields {% helper_icon yields %}

{% yields changes_dom_subject .prev %}

## Defaults {% helper_icon defaultAssertion %}

{% defaults existence .prev %}

## Timeouts {% helper_icon timeout %}

{% timeouts existence .prev %}

# Examples

## Previous

**Find the previous element of the element with class of `active`**

```html
<ul>
  <li>Cockatiels</li>
  <li>Lorikeets</li>
  <li class="active">Cockatoos</li>
  <li>Conures</li>
  <li>Eclectus</li>
</ul>
```

```javascript
// yields <li>Lorikeets</li>
cy.get('.active').prev()
```

## Selector

**Find the previous element with a class of `active`**

```html
<ul>
  <li>Cockatiels</li>
  <li>Lorikeets</li>
  <li class="active">Cockatoos</li>
  <li>Conures</li>
  <li>Eclectus</li>
</ul>
```

```javascript
// yields <li>Cockatoos</li>
cy.get('li').prev('.active')
```

# Command Log

**Find the previous element of the active `li`**

```javascript
cy.get('.left-nav').find('li.active').prev()
```

The commands above will display in the command log as:

![Command Log prev](/img/api/prev/find-prev-element-in-list-of-els.png)

When clicking on `prev` within the command log, the console outputs the following:

![Console Log](/img/api/prev/previous-element-in-console-log.png)

# See also

- {% url `.next()` next %}
- {% url `.prevAll()` prevall %}
- {% url `.prevUntil()` prevuntil %}
