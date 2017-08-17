---
title: title
comments: false
---

Get the `document.title` property of the page that is currently active.

# Syntax

```javascript
cy.title()
cy.title(options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.title()    // Yields the documents title as a string
```

## Arguments

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `cy.title()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout cy.title %}

## Yields {% helper_icon yields %}

{% yields sets_subject cy.title 'yields the `document.title` property of the current page' %}

# Examples

## No Args

***Assert that the document's title is "My Awesome Application"***

```javascript
cy.title().should('eq', 'My Awesome Application')
```

# Rules

## Requirements {% helper_icon requirements %}

{% requirements parent cy.title %}

## Assertions {% helper_icon assertions %}

{% assertions retry cy.title %}

## Timeouts {% helper_icon timeout %}

{% timeouts assertions cy.title %}

# Command Log

***Assert that the document's title includes 'New User'***

```javascript
cy.title().should('include', 'New User')
```

The commands above will display in the command log as:

![Command Log](/img/api/title/test-title-of-website-or-webapp.png)

When clicking on `title` within the command log, the console outputs the following:

![Console Log](/img/api/title/see-the-string-yielded-in-the-console.png)

# See also

- {% url `cy.document()` document %}
