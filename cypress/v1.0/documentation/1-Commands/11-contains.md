slug: contains
excerpt: Get a DOM element that contains specific text

Get the DOM element containing the text. DOM elements can contain *more* than the desired text and still match. Additionally, Cypress will prefer some DOM elements over the deepest element found.

**Preference order:**

- `input[type='submit']`
- `button`
- `a`
- `label`

| | |
|--- | --- |
| **Returns** | the deepest DOM element containing the text  |
| **Timeout** | `cy.contains` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) |

***

# [cy.contains( *text* )](#section-text-usage)

Get the deepest DOM element containing the text.

***

# [cy.contains( *number* )](#section-number-usage)

Get the deepest DOM element containing the number.

***

# [cy.contains( *regexp* )](#section-regular-expression-usage)

Get the deepest DOM element containing the text matching the regular expression.

***

# [cy.contains( *selector*, *text* )](#section-selector-and-text-usage)

Specify a selector to filter DOM elements containing the text. Cypress will **ignore** it's default preference for the specified selector. Using a selector allows you to return more *shallow* elements in the tree which contain the specific text.

***

# Options

Pass in an options object to change the default behavior of `cy.contains`.

**cy.contains( *text*, *options* )**
**cy.contains( *selector*, *text*, *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) | Total time to retry finding an element

***

# Text Usage

## Find the first element containing some text

```html
<ul>
  <li>apples</li>
  <li>oranges</li>
  <li>bananas</li>
</ul>
```

```javascript
// returns <li>apples</li>
cy.contains("apples")
```

***

## Find the input[type='submit'] by value

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
// get the form element
// search inside its descendants for the content 'submit the form!'
// find the input[type='submit'] element
// click it
cy.get("form").contains("submit the form!").click()
```

***

## Favor of `button` over other deeper elements

```html
<form>
  <button>
    <i class="fa fa-search"></i>
    <span>Search</span>
  </button>
</form>
```

```javascript
// even though the <span> is the deepest element that contains: "Search"
// Cypress will automatically favor button elements higher in the chain

// in this case the <button> is returned which is why we can now drill
// into its children
cy.contains("Search").children("i").should("have.class", "fa-search")
```

***

## Favor of `a` over other deeper elements

```html
<nav>
  <a href="/dashboard">
    <span>Dashboard</span>
  </a>
  <a href="/users">
    <span>Users</span>
  </a>
  <a href="/signout">
    <span>Sign Out</span>
  </a>
</nav>
```

```javascript
// even though the <span> is the deepest element that contains: "Sign Out"
// Cypress will automatically favor anchor elements higher in the chain

// in this case we can assert on the anchors properties
cy.get("nav").contains("Sign Out").should("have.attr", "href", "/signout")
```

***

## Favor of `label` over other deeper elements

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
// even though the <span> is the deepest element that contains: "Age"
// Cypress will favor label elements higher in the chain

// additionally we can omit the colon as long as the element
// at least contains the text 'Age'

cy.contains("Age").find("input").type("29")
```

***

## Only the *first* matched element will be returned

```html
<ul id="header">
  <li>Welcome, Jane Lane</li>
</ul>
<div id="main">
  <span>These users have 10 connections with Jane Lane</span>
  <ul>
    <li>User 1</li>
    <li>User 2</li>
    <li>User 3</li>
  </ul>
</div>
```

```javascript
// this will return the <li> in the #header since that is the first
// element that contains the text "Jane Lane"
cy.contains("Jane Lane")

// if you want to select the <span> inside of #main instead
// you need to scope the contains first

//now the <span> is returned
cy.get("#main").contains("Jane Lane")
```

***

# Number Usage

## Find the first element containing some number

```html
<button class="btn btn-primary" type="button">
  Messages <span class="badge">4</span>
</button>
```

```javascript
// even though the <span> is the deepest element that contains: 4
// Cypress will automatically favor button elements higher in the chain

// in this case the <button> is returned
cy.contains(4)
```

***

# Regular Expression Usage

## Find the first element with text matching the regular expression

```html
<ul>
  <li>apples</li>
  <li>oranges</li>
  <li>bananas</li>
</ul>
```

```javascript
// <li>bananas</li> is returned
cy.contains(/^b\w+/)
```

***


# Selector and Text Usage

## Specify a selector to return a specific element

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
// technically the <html>, <body>, <ul>, and first <li> all contain "apples"

// normally Cypress would return the first <li> since that is the deepest
// element that contains: "apples"

// to override this behavior, pass a 'ul' selector
// this returns the ul element since it also contains the text

// returns <ul>...</ul>
cy.contains("ul", "apples")
```

***

# Notes

## Dual command can be either parent or child

`cy.contains` is a dual command.  This means it can act as both a `parent` and a `child` command.  Read more about [issuing commands](https://on.cypress.io/guides/issuing-commands) if this is unfamiliar.

Because it is a dual command it can either *begin* a chain of commands or work off of an *existing* subject.

**Start a chain of commands**

```javascript
// search from the root scope (default: document)
cy.contains("some content")
```

**Find content within an existing scope**

```javascript
// search within an existing subject for the content
// contains is now scoped to the <aside> element and will
// only search its DOM descendants for the content
cy.get("#main").find("aside").contains("Add a user")
```

**Be wary of chaining multiple contains**

```javascript
// let's imagine a scenario where you click a user's delete button
// and a dialog appears asking you to confirm this deletion.

// the following will not work:
cy
  .contains("Delete User").click()

  // because this is chained off of the existing button subject
  // Cypress will look inside of the existing button subject
  // for the new content

  // in other words Cypress will look inside of the element
  // containing "Delete User" for the content: "Yes I'm sure!"
  .contains("Yes, I'm sure!").click()

```

**End previous chains to get back to the root scope**

```javascript
cy
  // explicitly .end() the previous chain
  .contains("Delete User").click().end()

  // Cypress will now search the root scope
  // for this content (default: document)
  .contains("Yes, I'm sure!").click()
```

```javascript
// alternatively just call cy again which
// automatically creates a new chain from the root scope
cy.contains("Delete User").click()
cy.contains("Yes I'm sure!").click()
```

```javascript
// you can also do this
cy
  .contains("Delete User").click()

  // by using the parent command .get() we automatically
  // abort previous chains and change the scope to #dialog
  // which contains the content we're looking for
  .get("#dialog").contains("Yes I'm sure!").click()
```

***

# Command Log

## Element contains text "New User"

<img width="536" alt="screen shot 2015-11-27 at 1 43 22 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446973/009ac32c-950d-11e5-9eaa-09f8b8ddf086.png">

When clicking on the `contains` command within the command log, the console outputs the following:

<img width="477" alt="screen shot 2015-11-27 at 1 43 50 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446977/04b31be4-950d-11e5-811e-4fd83d364d00.png">

***

# Related

- [get](https://on.cypress.io/api/get)
- [within](https://on.cypress.io/api/within)
- [root](https://on.cypress.io/api/root)