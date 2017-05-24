---
title: contains
comments: true
description: ''
---

Get the DOM element containing the text. DOM elements can contain *more* than the desired text and still match. Additionally, Cypress will [prefer some DOM elements](#notes) over the deepest element found.

# Syntax

```javascript
cy.contains(content)
cy.contains(selector, content)
cy.contains(selector, content, options)
```

## Usage

`.contains()` can be chained off of `cy` to find content within the entire document or chained off another cy command that *yields* a DOM element - limiting it's search of content to within yielded element.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('.nav').contains('About')  // Yields el in .nav containing 'About'
cy.contains('Hello').first()      // Yields first el in document containing 'Hello'
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.title().contains('My App')        // Errors, 'title' does not yield DOM element
cy.getCookies().contains('_key')     // Errors, 'getCookies' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} content** ***(String, Number, RegExp)***

Get the deepest DOM element containing the content.

**{% fa fa-angle-right %} selector** ***(String selector)***

Specify a selector to filter DOM elements containing the text. Cypress will *ignore* it's [default preference order](#notes) for the specified selector. Using a selector allows you to return more *shallow* elements in the tree which contain the specific text.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.contains`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry finding an element containing the content

## Yields

`cy.contains()` yields the *first*, *deepest* DOM element containing the text.

## Timeout

`cy.contains()` will try to find the content within the DOM for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts)

# Examples

## String Content

**Find the first element containing some text**

```html
<ul>
  <li>apples</li>
  <li>oranges</li>
  <li>bananas</li>
</ul>
```

```javascript
// yields <li>apples</li>
cy.contains('apples')
```

**Find the input[type='submit'] by value**

Get the form element and search in its descendants for the content "submit the form!"

```html
<div id="main">
  <form>
    <div>
      <label>name</label>
      <input name="name" />
    </div>
    <div>
      <label>age</label>
      <input name="age" />
    </div>
    <input type="submit" value="submit the form!" />
  </form>
</div>
```

```javascript
// yields input[type='submit'] element then clicks it
cy.get('form').contains('submit the form!').click()
```

**Favor of `button` over other deeper elements**

Even though the `<span>` is the deepest element that contains "Search", Cypress will yield `button` elements over spans.

```html
<form>
  <button>
    <i class="fa fa-search"></i>
    <span>Search</span>
  </button>
</form>
```

```javascript
// yields <button>
cy.contains('Search').children('i').should('have.class', 'fa-search')
```

**Favor of `a` over other deeper elements**

Even though the `<span>` is the deepest element that contains "Sign Out", Cypress will yield anchor elements over spans.

```html
<nav>
  <a href="/users">
    <span>Users</span>
  </a>
  <a href="/signout">
    <span>Sign Out</span>
  </a>
</nav>
```

```javascript
// yields <a>
cy.get('nav').contains('Sign Out').should('have.attr', 'href', '/signout')
```

**Favor of `label` over other deeper elements**

Even though the `<span>` is the deepest element that contains "Age", Cypress will yield `label` elements over `span`.

Additionally we don't need to look for content "Age:" omit as long as the element at least contains the text "Age", it will be yielded.

```html
<form>
  <label>
    <span>Name:</span>
    <input name="name" />
  </label>
  <label>
    <span>Age:</span>
    <input name="age" />
  </label>
</form>
```

```javascript
// yields label
cy.contains('Age').find('input').type('29')
```

**Only the *first* matched element will be returned**

```html
<ul id="header">
  <li>Welcome, Jane Lane</li>
</ul>
<div id="main">
  <span>These users have 10 connections with Jane Lane</span>
  <ul>
    <li>Jamal</li>
    <li>Patricia</li>
  </ul>
</div>
```

The below example will return the `<li>` in the `#header` since that is the *first* element that contains the text "Jane Lane".

```javascript
// yields #header li
cy.contains('Jane Lane')
```

If you wanted to select the `<span>` instead, you could narrow the elements yielded before the `.contains()`.

```javascript
// yields <span>
cy.get('#main').contains('Jane Lane')
```

## Number Content

**Find the first element containing some number**

Even though the `<span>` is the deepest element that contains a "4", Cypress will automatically yield `button` elements higher in the chain

```html
<button class="btn btn-primary" type="button">
  Messages <span class="badge">4</span>
</button>
```

```javascript
// yields <button>
cy.contains(4)
```

## Regular Expression Content

**Find the first element with text matching the regular expression**

```html
<ul>
  <li>apples</li>
  <li>oranges</li>
  <li>bananas</li>
</ul>
```

```javascript
// yields <li>bananas</li>
cy.contains(/^b\w+/)
```

## Selector

**Specify a selector to return a specific element**

Technically the `<html>`, `<body>`, `<ul>`, and first `<li>` in the example below all contain "apples".

Normally Cypress would return the first `<li>` since that is the *deepest* element that contains: "apples"

To override the element that is yielded, we can pass `ul` as the selector.

```html
<html>
  <body>
    <ul>
      <li>apples</li>
      <li>oranges</li>
      <li>bananas</li>
    </ul>
  </body>
</html>
```

```javascript
// yields <ul>...</ul>
cy.contains('ul', 'apples')
```

# Notes

**Element preference order**

- `input[type='submit']`
- `button`
- `a`
- `label`

**Dual command can be either parent or child**

`cy.contains` is a dual command.  This means it can act as both a `parent` and a `child` command.  Read more about [issuing commands](https://on.cypress.io/guides/issuing-commands) if this is unfamiliar.

Because it is a dual command it can either *begin* a chain of commands or work off of an *existing* subject.

***Start a chain of commands***

Search for the content within the `document`.

```javascript
cy.contains('some content')
```

***Find content within an existing scope***

Search within an existing subject for the content. `.contains()` will be scoped to the `<aside>` element and will only search it's DOM descendants for the content.

```javascript
cy.get('#main').find('aside').contains('Add a user')
```

***Be wary of chaining multiple contains***

Let's imagine a scenario where you click button to delete a user and a dialog appears asking you to confirm this deletion.

The following will not work:

```javascript

cy
  .contains('Delete User').click()
  .contains('Yes, Delete!').click()
```

Because the second `.contains()` is chained off of the existing button subject, Cypress will look inside of the existing button subject for the new content.

In other words, Cypress will look inside of the button containing "Delete User" for the content: "Yes, Delete!"

***End previous chains to get back to the root scope***

If you explicitly [`.end()`](https://on.cypress.io/api/end) the previous chain, Cypress within the `document` for the content.

```javascript
cy
  .contains('Delete User').click().end()
  .contains('Yes, Delete!').click()
```

Alternatively, you could call `cy` again which automatically creates a new chain from the `document`.

```javascript
cy.contains('Delete User').click()
cy.contains('Yes, Delete!').click()
```

You could also chain the second contains off of a parent command (such as [`.get()`](https://on.cypress.io/api/get). This automatically changes the subject to `#dialog` which contains the content we're looking for.

```javascript
cy
  .contains('Delete User').click()
  .get('#dialog').contains('Yes, Delete!').click()
```

# Command Log

**Element contains text "New User"**

```javascript
cy.get('h1').contains('New User')
```

The commands above will display in the command log as:

<img width="536" alt="screen shot 2015-11-27 at 1 43 22 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446973/009ac32c-950d-11e5-9eaa-09f8b8ddf086.png">

When clicking on the `contains` command within the command log, the console outputs the following:

<img width="477" alt="screen shot 2015-11-27 at 1 43 50 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446977/04b31be4-950d-11e5-811e-4fd83d364d00.png">

# See also

- [get](https://on.cypress.io/api/get)
- [within](https://on.cypress.io/api/within)
- [root](https://on.cypress.io/api/root)
