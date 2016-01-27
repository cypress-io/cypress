slug: reload
excerpt: Reload the page

Reload the page.

| | |
|--- | --- |
| **Returns** | the `window` object of the newly reloaded page |
| **Timeout** | `cy.reload` will retry for the duration of the [visitTimeout](https://on.cypress.io/guides/configuration#section-network-options) or the duration of the `timeout` specified in the command's [options](#section-options).  |

***

# [cy.reload()](#section-usage)

Reload the page from the current URL.

***

# [cy.reload( *forceReload* )](#section-usage)

Reload the current page, without using the cache if `forceReload` is true

***

# Options

Pass in an options object to change the default behavior of `cy.reload`.

**cy.reload( *options* )**

Option | Default | Notes
--- | --- | ---
`timeout`      | [visitTimeout](https://on.cypress.io/guides/configuration#section-network-options) | Total time to retry the visit
`log` | `true` | Display command in command log

***

# Usage

## Reload the page as if the user clicked the Refresh button

```javascript
cy
  .visit("http://localhost:3000/admin")
  .reload()
```

***

## Reload the page without using the cache

```javascript
cy
  .visit("http://localhost:3000/admin")
  .reload(true)
```

***

# Command Log

## Reload the page

```javascript
cy.reload()
```

The commands above will display in the command log as:

![screen shot 2016-01-25 at 6 07 14 pm](https://cloud.githubusercontent.com/assets/1271364/12567711/ace7f1cc-c38e-11e5-9427-f087f9f0fba0.png)

When clicking on `reload` within the command log, the console outputs the following:

![screen shot 2016-01-25 at 6 07 35 pm](https://cloud.githubusercontent.com/assets/1271364/12567712/b0590238-c38e-11e5-9833-9f3a27fd02ae.png)

***

# Related

- [location](https://on.cypress.io/api/location)