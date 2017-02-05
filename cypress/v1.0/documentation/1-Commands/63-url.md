slug: url
excerpt: Get the current URL

Get the current URL. `cy.url()` uses [`cy.location.href`](https://on.cypress.io/api/location) under the hood.

| | |
|--- | --- |
| **Returns** | the current URL as a string |
| **Timeout** | *cannot timeout* |

***

# [cy.url()](#section-usage)

Get the current URL.

***

# Options

Pass in an options object to change the default behavior of `cy.url`.

**cy.url( *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log

***

# Usage

## Assert the URL is `http://localhost:8000/users/1/edit`

```javascript
// clicking the anchor causes the browser to follow the link
cy
  .get("#user-edit a").click()
  .url().should("eq", "http://localhost:8000/users/1/edit") // => true
```

***

## URL is a shortcut for `cy.location().href`

`cy.url()` uses `href` under the hood.

```javascript
cy.url()                  // these return the same string
cy.location().its("href") // these return the same string
```

***

# Notes

## Why is this command called `url` instead of `href`?

Given the remote URL, `http://localhost:8000/index.html`, all 3 of these assertions are the same.

```javascript
cy.location().its("href").should("eq", "http://localhost:8000/index.html")

cy.location().invoke("toString").should("eq", "http://localhost:8000/index.html")

cy.url().should("eq", "http://localhost:8000/index.html")
```

`href` and `toString` come from the `window.location` spec.

But you may be wondering where the `url` property comes from.  Per the `window.location` spec, there actually isn't a `url` property on the `location` object.

`cy.url()` exists because it's what most developers naturally assume would return them the full current URL.  We almost never refer to the URL as an `href`.

***

# Command Log

## Assert that the url contains "#users/new"

```javascript
cy.url().should("contain", "#users/new")
```

The commands above will display in the command log as:

<img width="583" alt="screen shot 2015-11-29 at 1 42 40 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459196/20645888-969f-11e5-973a-6a4a98339b15.png">

When clicking on `url` within the command log, the console outputs the following:

<img width="440" alt="screen shot 2015-11-29 at 1 42 52 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459197/229e2552-969f-11e5-80a9-eeaf3221a178.png">

***

# Related

- [hash](https://on.cypress.io/api/hash)
- [location](https://on.cypress.io/api/location)