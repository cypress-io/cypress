---
title: reload
comments: false
---

Reload the page.

# Syntax

```javascript
cy.reload()
cy.reload(forceReload)
cy.reload(options)
cy.reload(forceReload, options)
```

## Usage

`cy.reload()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.reload()    
```

## Arguments

**{% fa fa-angle-right %} forceReload** ***(Boolean)***

Whether to reload the current page without using the cache. `true` forces the reload without cache.

**{% fa fa-angle-right %} options** ***(Object)***

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`timeout`      | {% url `pageLoadTimeout` configuration#Timeouts %} | Total time to reload the page

## Yields

`cy.reload()` yields the `window` object of the newly loaded page.

## Timeout

`cy.reload()` will wait for the load event of the newly loaded page for the duration of the {% url `pageLoadTimeout` configuration#Timeouts %} or the duration of the `timeout` specified in the command's options.

# Examples

## Reload

**Reload the page as if the user clicked 'Refresh'**

```javascript
cy.visit('http://localhost:3000/admin')
cy.get('#undo-btn').click().should('not.be.visible')
cy.reload()
cy.get('#undo-btn').click().should('not.be.visible')
```

## Force Reload

**Reload the page without using the cache**

```javascript
cy.visit('http://localhost:3000/admin')
cy.reload(true)
```

# Command Log

**Reload the page**

```javascript
cy.reload()
```

The commands above will display in the command log as:

![Command Log](/img/api/commands/reload/test-page-after-reload-button.png)

When clicking on `reload` within the command log, the console outputs the following:

![Console Log](/img/api/commands/reload/command-log-for-reload-cypress.png)

# See also

- {% url `cy.go()` go %}
- {% url `cy.location()` location %}
- {% url `cy.visit()` visit %}
