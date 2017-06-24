---
title: document
comments: false
---

Get the document.

# Syntax

```javascript
cy.document()
cy.document(options)
```

## Usage

`cy.document()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.document()     // yield the window.document object
```

## Arguments

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.document()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log

## Yields {% helper_icon yields %}

`cy.document()` yields the `window.document` object.

## Timeout {% helper_icon timeout %}

`cy.document()` will retry for the duration of the {% url `defaultCommandTimeout` configuration#Timeouts %}.

# Examples

## Document

**Get document and do some work**

```javascript
cy.document().then(function(document) {
  // work with document element
})
```

**Make an assertion about the document**

```javascript
cy.document().its('contentType').should('eq', 'text/html')
```

# Command Log

**Get the document**

```javascript
cy.document()
```

The command above will display in the command log as:

![Command log document](/img/api/document/get-document-of-application-in-command-log.png)

When clicking on `document` within the command log, the console outputs the following:

![console.log document](/img/api/document/console-yields-the-document-of-aut.png)

# See also

- {% url `cy.window()` window %}
