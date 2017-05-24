---
title: debug
comments: true
description: ''
---

Sets a `debugger` and log what the previous command yields. You need to have your Developer Tools open for `.debug()` to hit the breakpoint.

# Syntax

```javascript
.debug()
.debug(options)
```

## Usage

`.debug()` can be chained off of `cy` or any cy command.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.debug().getCookie('app') // Pause to debug at beginning of commands
cy.get('nav').debug()       // Debug the `get` commands yield
```

## Arguments

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.debug()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log

# Examples

## Debug

**Pause with debugger after `get()`**

```javascript
cy.get('a').debug().should('have.attr', 'href')
```

# Command Log

**Log out the current subject for debugging**

```javascript
cy.get(".ls-btn").click({ force: true }).debug()
```

The commands above will display in the command log as:

<img width="466" alt="screen shot 2017-05-24 at 4 10 23 pm" src="https://cloud.githubusercontent.com/assets/1271364/26423391/896b858e-409b-11e7-91ce-14c5bf38ab11.png">

When clicking on the `debug` command within the command log, the console outputs the following:

<img width="572" alt="screen shot 2017-05-24 at 4 10 08 pm" src="https://cloud.githubusercontent.com/assets/1271364/26423392/89725486-409b-11e7-94d5-aebdffe16abf.png">

# See also

- [pause](https://on.cypress.io/api/pause)
