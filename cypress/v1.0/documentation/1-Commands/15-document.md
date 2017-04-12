slug: document
excerpt: Get the document

Get the document and work with its properties or methods.

| | |
|--- | --- |
| **Returns** | the `window.document` object |
| **Timeout** | `cy.document` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) |

***

# [cy.document()](#usage)

Get the document.

***

# Options

Pass in an options object to change the default behavior of `cy.document`.

**cy.document(*options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log

***

# Usage

## Get document and do some work

```javascript
cy.document().then(function(document) {
  // work with document element
});
```

## Make an assertion about the document

```javascript
cy.document().its("contentType").should("eq", "text/html")
```

***

# Command Log

## Get the document

```javascript
cy.document()
```

The commands above will display in the command log as:

<img width="588" alt="screen shot 2015-11-29 at 2 00 09 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459311/aab8fe88-96a1-11e5-9b72-b0501204030d.png">

When clicking on `document` within the command log, the console outputs the following:

<img width="491" alt="screen shot 2015-11-29 at 2 00 22 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459314/ad27d7e8-96a1-11e5-8d1c-9c4ede6c54aa.png">

***

# Related

- [window](https://on.cypress.io/api/window)
