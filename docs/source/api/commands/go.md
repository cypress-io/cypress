---
title: go
comments: true
---

Navigate back or forward to the previous or next URL in the browser's history.


# Syntax

```javascript
cy.go(direction)
cy.go(direction, options)
```

## Usage

`cy.go()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.go('back')    
```

## Arguments

**{% fa fa-angle-right %} direction** ***(String, Number)***

The direction to navigate.

You can use `back` or `forward` to go one step back or forward. You could also navigate to a specific history position (`-1` goes back one page, `1` goes forward one page, etc).

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.go()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`timeout`      | [pageLoadTimeout](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry the navigation

## Yields

`cy.go()` yields the `window` object.

## Timeout

`cy.go()` will retry for the duration of the [pageLoadTimeout](https://on.cypress.io/guides/configuration#timeouts) or the duration of the `timeout` specified in the command's options.

# Examples

## Back / Forward

**Go back in browser's history**

```javascript
cy.go('back')   // equivalent to clicking back button
```

**Go forward in browser's history**

```javascript
cy.go('forward') // equivalent to clicking forward button
```

## Number

**Go back in browser's history**

```javascript
cy.go(-1)       // equivalent to clicking back button
```

**Go forward in browser's history**

```javascript
cy.go(1)        // equivalent to clicking forward button
```

# Notes

**Refreshing and loading the page**

If going forward or back causes a full page refresh, Cypress will wait for the new page to load before moving on to new commands. Cypress additionally handles situations where a page load was not caused (such as hash routing) and will resolve immediately.

# Command Log

**Go back in browser's history**

```javascript
cy
  .visit('http://localhost:8000/folders')
  .go('back')
```

The commands above will display in the command log as:

![screen shot 2016-01-21 at 1 45 25 pm](https://cloud.githubusercontent.com/assets/1271364/12491029/c33087f0-c046-11e5-8475-4e6c35296085.png)

When clicking on the `go` command within the command log, the console outputs the following:

![screen shot 2016-01-21 at 1 46 02 pm](https://cloud.githubusercontent.com/assets/1271364/12491359/b22e569c-c048-11e5-8ec3-f46217a19fc1.png)

# See also

- {% url `cy.reload()` reload %}
- {% url `cy.visit()` visit %}
