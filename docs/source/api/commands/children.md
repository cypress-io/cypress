---
title: children
comments: true
---

Get the children of each DOM element within a set of DOM elements.

# Syntax

```javascript
.children()
.children(selector)
.children(options)
.children(selector, options)
```

## Usage

`.children()` requires being chained off another cy command that *yields* a DOM element.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('nav').children()     // Yield children of nav
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.children()                // Errors, cannot be chained off 'cy'
cy.location().children()     // Errors, 'location' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} selector**  ***(String selector)***

A selector used to filter matching DOM elements.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.children()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the element(s)

## Yields

`.children()` yields the new DOM element(s) found by the command.

## Timeout

`.children()` will continue to look for the children elements for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts).

# Examples

## Children

**Get the children of the "secondary-nav"**

```html
<ul class="primary-nav">
  <li class="about">About</li>
  <li class="services">Services
    <ul class="secondary-nav">
      <li class="services-1">Web Design</li>
      <li class="services-2">Print Design
        <ul class="tertiary-nav">
          <li class="item-1">Signage</li>
          <li class="item-2">T-Shirt</li>
          <li class="item-3">Business Cards</li>
        </ul>
      </li>
      <li class="services-3">Logo Design</li>
    </ul>
  </li>
  <li class="Contact">Contact</li>
</ul>
```

```javascript
// yields [
//  <li class="services-1"></li>,
//  <li class="services-2"></li>,
//  <li class="services-3"></li>
// ]
cy.get('ul.secondary-nav').children()
```

## Selector

**Get the children with class 'active'**

```html
<div>
  <ul>
    <li class="active">Unit Testing</li>
    <li>Integration Testing</li>
  </ul>
</div>
```

```javascript
// yields [<li class="active">Unit Testing</li>]
cy.get('ul').children('.active')
```

# Command Log

**Assert that there should be 8 children elements in a nav**

```javascript
cy.get('.left-nav>.nav').children().should('have.length', 8)
```

The commands above will display in the command log as:

<img width="521" alt="screen shot 2015-11-27 at 1 52 26 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447069/2b0f8a7e-950e-11e5-96b5-9d82d9fdddec.png">

When clicking on the `children` command within the command log, the console outputs the following:

<img width="542" alt="screen shot 2015-11-27 at 1 52 41 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447071/2e9252bc-950e-11e5-9a32-e5860da89160.png">

# See also

- [next](https://on.cypress.io/api/next)
- [parent](https://on.cypress.io/api/parent)
- [parents](https://on.cypress.io/api/parents)
- [siblings](https://on.cypress.io/api/siblings)
