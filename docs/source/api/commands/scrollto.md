---
title: scrollTo
comments: false
---

Scroll to a specific position.

# Syntax

```javascript
cy.scrollTo(position)
cy.scrollTo(x, y)
cy.scrollTo(position, options)
cy.scrollTo(x, y, options)

// ---or---

.scrollTo(position)
.scrollTo(x, y)
.scrollTo(position, options)
.scrollTo(x, y, options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.scrollTo(0, 500)                     // Scroll the window 500px down
cy.get('.sidebar').scrollTo('bottom')   // Scroll 'sidebar' to it's bottom
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.title().scrollTo('My App')  // Errors, 'title' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} position** ***(String)***

A specified position to scroll the window or element to. Valid positions are `topLeft`, `top`, `topRight`, `left`, `center`, `right`, `bottomLeft`, `bottom`, and `bottomRight`.

{% img /img/api/coordinates-diagram.jpg "cypress-command-positions-diagram" %}

**{% fa fa-angle-right %} x** ***(Number, String)***

The distance in pixels from window/element's left or percentage of the window/element's width to scroll to.

**{% fa fa-angle-right %} y** ***(Number, String)***

The distance in pixels from window/element's top or percentage of the window/element's height to scroll to.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.scrollTo()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`duration` | `0` | Scrolls over the duration (in ms)
`easing` | `swing` | Will scroll with the easing animation
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .scrollTo %}

## Yields {% helper_icon yields %}

{% yields same_subject cy.scrollTo %}

# Examples

## Position

***Scroll to the bottom of the window***

```javascript
cy.scrollTo('bottom')
```

***Scroll to the center of the list***

```javascript
cy.get('#movies-list').scrollTo('center')
```

## Coordinates

***Scroll 500px down the list***

```javascript
cy.get('#infinite-scroll-list').scrollTo(0, 500)
```

***Scroll the window 500px to the right***

```javascript
cy.scrollTo('500px')
```

***Scroll 25% down the element's height***

```javascript
 cy.get('.user-photo').scrollTo('0%', '25%')
```

## Options

***Use linear easing animation to scroll***

```javascript
cy.get('.documentation').scrollTo('top', { easing: 'linear'} )
```

***Scroll to the right over 2000ms***

```javascript
cy.get('#slider').scrollTo('right', { duration: 2000} )
```

# Notes

## Actionability

`cy.scrollTo()` is an "action command" that follows all the rules {% url 'defined here' interacting-with-elements %}.

## Scopes

`cy.scrollTo()` acts differently whether its starting a series of commands or being chained off of an existing.

***When starting a series of commands:***

This scrolls the `window`.

```javascript
cy.scrollTo('bottom')
```

***When chained to an existing series of commands:***

This will scroll the `<#checkout-items>` element.

```javascript
cy.get('#checkout-items').scrollTo('right')
```

## Snapshots

***Snapshots do not reflect scroll behavior***

*Cypress does not reflect the accurate scroll positions of any elements within snapshots.* If you want to see the actual scrolling behavior in action, we recommend using {% url `.pause()` pause %} to walk through each command or {% url 'watching the video of the test run' screenshots-and-videos#Videos %}.

# Rules

## Requirements {% helper_icon requirements %}

{% requirements scrollability .scrollTo %}

## Timeouts {% helper_icon timeout %}

{% timeouts assertions .scrollTo %}

# Command Log

***Scroll to the bottom of the window then scroll the element to the "right"***

```javascript
cy.scrollTo('bottom')
cy.get('#scrollable-horizontal').scrollTo('right')
```

The commands above will display in the command log as:

{% img /img/api/scrollto/command-log-scrollto.png "command log for scrollTo" %}

When clicking on `scrollTo` within the command log, the console outputs the following:

{% img /img/api/scrollto/console-log-scrollto.png "console.log for scrollTo" %}

# See also

- {% url `.scrollIntoView()` scrollintoview %}
