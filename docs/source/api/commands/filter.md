---
title: filter
comments: false
---

Get the DOM elements that match a specific selector.

{% note info %}
Opposite of {% url `.not()` not %}
{% endnote %}

# Syntax

```javascript
.filter(selector)
.filter(selector, options)
```

## Usage

`.filter()` requires being chained off another cy command that *yields* a DOM element or DOM elements.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('td').filter('.users') // Yield all el's with class '.users'
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.filter('.animated')  // Errors, cannot be chained off 'cy'
cy.location().filter()  // Errors, 'location' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} selector**  ***(String selector)***

A selector used to filter matching DOM elements.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.filter()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | Total time to retry getting the element

## Yields

`.filter()` yields the new DOM elements found by the command.

## Timeout

`.filter()` will continue to look for the filtered element(s) for the duration of the {% url `defaultCommandTimeout` configuration#Timeouts %}.

# Examples

## Selector

**Filter the current subject to the elements with the class 'active'.**

```html
<ul>
  <li>Home</li>
  <li class="active">About</li>
  <li>Services</li>
  <li>Pricing</li>
  <li>Contact</li>
</ul>
```

```javascript
// yields <li>About</li>
cy.get('ul').find('>li').filter('.active')
```

# Command Log

**Filter the li's to the li with the class 'active'.**

```javascript
cy.get('.left-nav>.nav').find('>li').filter('.active')
```

The commands above will display in the command log as:

![Command Log filter](/img/api/commands/filter/filter-el-by-selector.png)

When clicking on the `filter` command within the command log, the console outputs the following:

![console.log filter](/img/api/commands/filter/console-shows-list-and-filtered-element.png)

# See also

- {% url `.not()` not %}
