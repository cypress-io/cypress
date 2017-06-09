---
title: hash
comments: true
---

Get the current URL hash.

{% note info %}
This is an alias of [`cy.location('hash')`](https://on.cypress.io/api/location)
{% endnote %}

# Syntax

```javascript
cy.hash()
cy.hash(options)
```

## Usage

`cy.hash()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.hash()     // Get the url hash
```

## Arguments

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.hash()`.

**cy.hash( *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log

## Yields

`cy.hash()` yields the current URL hash as a string including the `#` character. If no `#` character is present in the URL, then an empty string will be returned.

## Timeout

# Examples

## Hash

**Assert that hash is `#/users/1` given remote URL: `http://localhost:8000/app/#/users/1`**

```javascript
// yields #/users/1
cy.hash().should('eq', '#/users/1') // => true
```

**Assert that the hash matches via RegExp**

```html
<ul id="users">
  <li>
    <a href="#/users/8fc45b67-d2e5-465a-b822-b281d9c8e4d1">Fred</a>
  </li>
</ul>
```

```javascript
cy.get('#users li').find('a').click()
cy.hash().should('match', /users\/.+$/) // => true
```

# Command Log

**Assert that the hash matches `#users/new`**

```javascript
cy.hash().should('eq', '#users/new')
```

The commands above will display in the command log as:

<img width="581" alt="screen shot 2015-11-29 at 1 34 12 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459152/ed737be4-969d-11e5-823e-1d12cd7d03b1.png">

When clicking on `hash` within the command log, the console outputs the following:

<img width="472" alt="screen shot 2015-11-29 at 1 34 17 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459153/f0aa6476-969d-11e5-9851-302957f9eb0f.png">

# See also

- {% url `cy.location()` location %}
- {% url `cy.url()` url %}
