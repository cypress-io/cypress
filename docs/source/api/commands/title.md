---
title: title
comments: true
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

<img width="577" alt="screen shot 2015-11-29 at 2 12 54 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459376/587ae9b8-96a3-11e5-86b4-ce7ba00ccda5.png">

When clicking on `title` within the command log, the console outputs the following:

<img width="437" alt="screen shot 2015-11-29 at 2 13 06 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459377/5b8110e2-96a3-11e5-97e6-fbeb80f83277.png">

# See also

- {% url `cy.document()` document %}
