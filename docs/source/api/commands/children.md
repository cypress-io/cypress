---
title: children
comments: false
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

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .children %}

## Yields {% helper_icon yields %}

`.children()` yields the new DOM element(s) found by the command.

## Defaults {% helper_icon defaultAssertion %}

`.children()` will automatically wait until the element(s) can be found in the DOM.

## Timeouts {% helper_icon timeout %}

`.children()` will continue to look for the children elements for the duration of the {% url `defaultCommandTimeout` configuration#Timeouts %}.

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

![Command log for children](/img/api/children/children-elements-shown-in-command-log.png)

When clicking on the `children` command within the command log, the console outputs the following:

![console.log for children](/img/api/children/children-yielded-in-console.png)

# See also

- {% url `.next()` next %}
- {% url `.parent()` parent %}
- {% url `.parents()` parents %}
- {% url `.siblings()` siblings %}
