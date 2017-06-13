---
title: last
comments: false
---

Get the last DOM element within a set of DOM elements.

# Syntax

```javascript
.last()
.last(options)
```

## Usage

`.last()` requires being chained off another cy command that *yields* a DOM element or set of DOM elements.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('nav a').last()     // Yield last link in nav
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.last()                  // Errors, cannot be chained off 'cy'
cy.getCookies().last()     // Errors, 'getCookies' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.last()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | Total time to retry getting the element

## Yields

`.last()` yields the new DOM element found by the command.

## Timeout

`.last()` will continue to look for the last element for the duration of the {% url `defaultCommandTimeout` configuration#Timeouts %}.

# Examples

## Last element

**Get the last list item in a list.**

```html
<ul>
  <li class="one">Knick knack on my thumb</li>
  <li class="two">Knick knack on my shoe</li>
  <li class="three">Knick knack on my knee</li>
  <li class="four">Knick knack on my door</li>
</ul>
```

```javascript
// yields <li class="four">Knick knack on my door</li>
cy.get('li').last()
```

# Command Log

**Find the last button in the form**

```javascript
cy.get('form').find('button').last()
```

The commands above will display in the command log as:

<img width="560" alt="screen shot 2015-11-29 at 12 33 52 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458797/8e9abdf6-9695-11e5-8594-7044751d5199.png">

When clicking on `last` within the command log, the console outputs the following:

<img width="746" alt="screen shot 2015-11-29 at 12 34 07 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458799/91a115cc-9695-11e5-8569-93fbaa2704d4.png">

# See also

- {% url `.first()` first %}
