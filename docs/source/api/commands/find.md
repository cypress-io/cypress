---
title: find
comments: false
---

Get the descendent DOM elements of a specific selector.

# Syntax

```javascript
.find(selector)
.find(selector, options)
```

## Usage

`.find()` requires being chained off another cy command that *yields* a DOM element or DOM elements.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('.article').find('footer') // Yield 'footer' within '.article'
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.find('.progress')          // Errors, cannot be chained off 'cy'
cy.exec('node start').find()  // Errors, 'exec' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} selector**  ***(String selector)***

A selector used to filter matching descendent DOM elements.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.find()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | Total time to retry getting the element(s)

## Yields

`.find()` yields the new DOM elements found by the command.

## Timeout

`.find()` will continue to look for the filtered element(s) for the duration of the {% url `defaultCommandTimeout` configuration#Timeouts %}.

# Examples

## Selector

**Get li's within parent**

```html
<ul id="parent">
  <li class="first"></li>
  <li class="second"></li>
</ul>
```

```javascript
// yields [<li class="first"></li>, <li class="second"></li>]
cy.get('#parent').find('li')
```

# Command Log

**Find the li's within the nav**

```javascript
cy.get('.left-nav>.nav').find('>li')
```

The commands above will display in the command log as:

![Command Log find](https://cloud.githubusercontent.com/assets/1271364/11447309/f6a9be4a-9511-11e5-84a5-a111215bf1e6.png)

When clicking on the `find` command within the command log, the console outputs the following:

![console.log find](https://cloud.githubusercontent.com/assets/1271364/11447312/fa3679cc-9511-11e5-9bea-904f8c70063d.png)

# See also

- {% url `cy.get()` get %}
