---
title: window
comments: true
description: ''
---

Get the global `window` object of the remote application that was [visited](https://on.cypress.io/api/visit).

# Syntax

```javascript
cy.window()
cy.window(options)
```

## Usage

`cy.window()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.window()    
```

## Arguments

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.window()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log

## Yields

`cy.window()` yields the `window` object.

## Timeout

`cy.window()` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts)

# Examples

## Window

**Returns the remote window object**

```javascript
cy.visit('http://localhost:8080/app')
cy.window().then(function(win){
  // win is the remote window
  // of the page at: http://localhost:8080/app
})
```

## Options

**Passes timeout through to `cy.should` assertion**

```javascript
cy.window({ timeout: 10000 }).should('have.property', 'foo')
```

# Command Log

**Get the window**

```javascript
cy.window()
```

The commands above will display in the command log as:

<img width="587" alt="screen shot 2015-11-29 at 2 15 49 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459397/ced0a6de-96a3-11e5-93b4-9abd9ffabd98.png">

When clicking on `window` within the command log, the console outputs the following:

<img width="758" alt="screen shot 2015-11-29 at 2 16 22 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459398/d0e6f4be-96a3-11e5-8583-69dcffef9cd3.png">

# See also

- [visit](https://on.cypress.io/api/visit)
- [document](https://on.cypress.io/api/document)
