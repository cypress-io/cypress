slug: reload
excerpt: Reload the page

Reload the page.

| | |
|--- | --- |
| **Returns** | the `window` object of the newly reloaded page |
| **Timeout** | `cy.reload` will retry for the duration of the [pageLoadTimeout](https://on.cypress.io/guides/configuration#timeouts) or the duration of the `timeout` specified in the command's [options](#options).  |

***

# [cy.reload()](#usage)

Reload the page from the current URL.

***

# [cy.reload( *forceReload* )](#force-reload-usage)

Reload the current page, without using the cache if `forceReload` is true

***

# Options

Pass in an options object to change the default behavior of `cy.reload`.

**cy.reload( *options* )**

Option | Default | Notes
--- | --- | ---
`timeout`      | [pageLoadTimeout](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry the visit
`log` | `true` | whether to display command in command log

***

# Usage

## Reload the page as if the user clicked the Refresh button

```javascript
cy
  .visit("http://localhost:3000/admin")
  .reload()
```

# Force Reload Usage

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

![screen shot 2016-01-27 at 2 49 44 pm](https://cloud.githubusercontent.com/assets/1271364/12626196/6deb6fd0-c505-11e5-8803-cd2998ec0a12.png)

When clicking on `cy.reload` within the command log, the console outputs the following:

![screen shot 2016-01-27 at 2 50 01 pm](https://cloud.githubusercontent.com/assets/1271364/12626199/71a62ea8-c505-11e5-97cf-e7e4b92015e3.png)

***

# Related

- [location](https://on.cypress.io/api/location)
