slug: reload
excerpt: Refresh the page

# [cy.reload()](#section-usage)

Reload the resource from the current URL.

***

# [cy.reload( *forceReload* )](#section-usage)

Reload the current page, without using the cache if `forceReload` is true

***

# Options

Pass in an options object to change the default behavior of `cy.reload`.

**cy.reload( *options* )**

Option | Default | Notes
--- | --- | ---
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

# Related

- [location](https://on.cypress.io/api/location)