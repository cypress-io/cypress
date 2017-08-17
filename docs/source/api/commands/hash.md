---
title: hash
comments: false
---

Get the current URL hash of the page that is currently active.

{% note info %}
This is an alias of {% url "`cy.location('hash')`" location %}
{% endnote %}

# Syntax

```javascript
cy.hash()
cy.hash(options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.hash()     // Get the url hash
```

## Arguments

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.hash()`.

**cy.hash( *options* )**

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout cy.hash %}

## Yields {% helper_icon yields %}

***When the current URL contains a hash:***

{% yields sets_subject cy.hash "yields the current URL's hash (including the `#` character)" %}

***When the current URL does not contain a hash:***

{% yields sets_subject cy.hash "yields an empty string" %}

# Examples

## No Args

***Assert that hash is `#/users/1` given remote URL: `http://localhost:8000/app/#/users/1`***

```javascript
// yields #/users/1
cy.hash().should('eq', '#/users/1') // => true
```

***Assert that the hash matches via RegExp***

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

# Rules

## Requirements {% helper_icon requirements %}

{% requirements parent cy.hash %}

## Assertions {% helper_icon assertions %}

{% assertions retry cy.hash %}

## Timeouts {% helper_icon timeout %}

{% timeouts assertions cy.hash %}

# Command Log

***Assert that the hash matches `#users/new`***

```javascript
cy.hash().should('eq', '#users/new')
```

The commands above will display in the command log as:

![Command Log for hash](/img/api/hash/test-url-hash-for-users-page.png)

When clicking on `hash` within the command log, the console outputs the following:

![Console Log for hash](/img/api/hash/hash-command-yields-url-after-hash.png)

# See also

- {% url `cy.location()` location %}
- {% url `cy.url()` url %}
