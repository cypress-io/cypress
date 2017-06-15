---
title: title
comments: false
---

Get the title of the document.

# Syntax

```javascript
cy.title()
cy.title(options)
```

## Usage

`cy.title()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.title()    
```

## Arguments

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `cy.title()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log


## Yields

`cy.title()` yields the `document` title as a string.

## Timeout

`cy.title()` will continue to retry for the duration of the {% url `defaultCommandTimeout` configuration#Timeouts %}

# Examples

## Title

**Assert that the document's title is "My Awesome Application"**

```javascript
cy.title().should('eq', 'My Awesome Application')
```

# Command Log

**Assert that the document's title includes 'New User'**

```javascript
cy.title().should('include', 'New User')
```

The commands above will display in the command log as:

![Command Log](/img/api/commands/title/test-title-of-website-or-webapp.png)

When clicking on `title` within the command log, the console outputs the following:

![Console Log](/img/api/commands/title/see-the-string-yielded-in-the-console.png)

# See also

- {% url `cy.document()` document %}
