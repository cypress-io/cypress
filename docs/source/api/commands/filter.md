---
title: filter
comments: true
---

Get the DOM elements that match a specific selector.

{% note info %}
Opposite of [`.not()`](https://on.cypress.io/api/not)
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
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the element

## Yields

`.filter()` yields the new DOM elements found by the command.

## Timeout

`.filter()` will continue to look for the filtered element(s) for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts).

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

<img width="522" alt="screen shot 2015-11-27 at 2 15 53 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447263/7176e824-9511-11e5-93cc-fa10b3b94482.png">

When clicking on the `filter` command within the command log, the console outputs the following:

<img width="503" alt="screen shot 2015-11-27 at 2 16 09 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447266/74b643a4-9511-11e5-8b42-6f6dfbdfb2a8.png">

# See also

- [not](https://on.cypress.io/api/not)
