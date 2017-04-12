slug: title
excerpt: Get the title of the document

Get the title of the document.

| | |
|--- | --- |
| **Returns** | the `document` title as a string |
| **Timeout** | `cy.title` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) |

***

# [cy.title()](#section-usage)

Get the title of the document.

***

# Options

Pass in an options object to change the default behavior of `cy.click`.

**cy.title( *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log

***

# Usage

## Assert that the document's title contains "New User"

```javascript
cy.title().should("contain", "New User")
```

***

# Command Log

## Assert that the document's title contains "New User"

```javascript
cy.title().should("contain", "New User")
```

The commands above will display in the command log as:

<img width="577" alt="screen shot 2015-11-29 at 2 12 54 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459376/587ae9b8-96a3-11e5-86b4-ce7ba00ccda5.png">

When clicking on `title` within the command log, the console outputs the following:

<img width="437" alt="screen shot 2015-11-29 at 2 13 06 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459377/5b8110e2-96a3-11e5-97e6-fbeb80f83277.png">

***

# Related

- [document](https://on.cypress.io/api/document)