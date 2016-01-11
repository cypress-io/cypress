slug: contains

### [cy.contains( *text* )](#text-usage)

Returns the deepest element containing the text.  Elements can contain *more* than the desired text and still match.

Additionally, Cypress will prefer these elements (in this order) `input[type='submit']`, `button`, `a`, `label` over the deepest element found.

If Cypress does not find a matching element, it will continue to retry until the [`commandTimeout`](options) has been reached.

***

### [cy.contains( *text*, *options* )](#text-options)

Pass in an options object to specify the conditions of the element.

***

### [cy.contains( *selector*, *text* )](#selector-and-text-usage)

Specify a selector to filter elements containing the text.  Cypress will **ignore** it's default preference of `input[type='submit']`, `button`, `a`, `label` for the specified selector.

Using a selector allows you to return more *shallow* elements in the tree which contain the specific text.

***

## Text Usage

> Find the deepest element containing the text `apples`

```html
<ul>
  <li>apples</li>
  <li>oranges</li>
  <li>bananas</li>
</ul>
```

```js
// returns <li>apples</li>
cy.contains("apples")
```

***

> Find the input[type='submit'] by value <br>

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

```js
// get the form element
// search inside its descendants for the content 'submit the form!'
// find the input[type='submit'] element
// click it
cy.get("form").contains("submit the form!").click()
```

***

> Cypress will favor `button` of any type

```html
<form>
  <input name="search" />
  <button>
    <i class="fa fa-search"></i>
    <span>Search</span>
  </button>
</form>
```

```js
// let's make sure the <i> has the class: "fa-search"

// even though the <span> is the deepest element which contains: "Search"
// Cypress will automatically favor button elements higher in the chain

// in this case the <button> is returned which is why we can now drill
// into its children
cy.contains("Search").children("i").should("have.class", "fa-search")
```

***

> Cypress will favor `a`

```html
<nav>
  <a href="/dashboard">
    <i class="fa fa-dashboard"></i>
    <span>Dashboard</span>
  </a>
  <a href="/users">
    <i class="fa fa-users"></i>
    <span>Users</span>
  </a>
  <a href="/signout">
    <i class="fa fa-sign-out"></i>
    <span>Sign Out</span>
  </a>
</nav>
```

```js
// even though the <span> is the deepest element which contains: "Sign Out"
// Cypress will automatically favor anchor elements higher in the chain

// in this case we can assert on the anchors properties
cy.get("nav").contains("Sign Out").should("have.attr", "href", "/signout")
```

***

> Cypress will favor `label`

```html
<form>
  <label>
    <span>Name:</span>
    <span>
      <input name="name" />
    </span>
  </label>
  <label>
    <span>Age:</span>
    <span>
      <input name="age" />
    </span>
  </label>
  <button type="submit">Submit</button>
</form>
```

```js
// even though the <span> is the deepest element which contains: "Age"
// Cypress will automatically favor label elements higher in the chain

// additionally we can omit the colon as long as the element
// at least contains the text 'Age'

//in this case we can easily target the input
//because the label is returned
cy.contains("Age").find("input").type("29")
```

***

> Only the first matched element will be returned

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

```js
// this will return the <li> in the #header since that is the first
// element which contains the text "Jane Lane"
cy.contains("Jane Lane")

// if you want to select the <span> inside of #main instead
// you need to scope the contains first

//now the <span> is returned
cy.get("#main").contains("Jane Lane")
```

***

## Selector and Text Usage

> Specify a selector to return a specific element

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

```js
// technically the <html>, <body>, <ul>, and first <li> all contain "apples"

// normally Cypress would return the first <li> since that is the deepest
// element which contains: "apples"

// to override this behavior, pass a 'ul' selector
// this returns the ul element since it also contains the text

// returns <ul>...</ul>
cy.contains("ul", "apples")
```

***

## Notes

`cy.contains` is a dual command.  This means it can act as both a `parent` and a `child` command.  Read more about [`commands`](commands) if this is unfamiliar.

Because it is a dual command it can either **begin** a chain of commands or work off of an **existing** subject.

Read more about [`chaining`](chaining) here.

***

> Start a chain of commands

```js
// search from the root scope (default: document)
cy.contains("some content")
```

***

> Find content within an existing scope

```js
// search within an existing subject for the content
// contains is now scoped to the <aside> element and will
// only search its DOM descendants for the content
cy.get("#main").find("aside").contains("Add a user")
```

***

> Be wary of chaining multiple contains <br>

```js
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

***

> End previous chains to get back to the root scope <br>

```js
cy
  // explicitly .end() the previous chain
  .contains("Delete User").click().end()

  // Cypress will now search the root scope
  // for this content (default: document)
  .contains("Yes, I'm sure!").click()
```

```js
// alternatively just call cy again which
// automatically creates a new chain from the root scope
cy.contains("Delete User").click()
cy.contains("Yes I'm sure!").click()
```

```js
// you can also do this
cy
  .contains("Delete User").click()

  // by using the parent command .get() we automatically
  // abort previous chains and change the scope to #dialog
  // which contains the content we're looking for
  .get("#dialog").contains("Yes I'm sure!").click()
```

***

## Command Log

<img width="536" alt="screen shot 2015-11-27 at 1 43 22 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446973/009ac32c-950d-11e5-9eaa-09f8b8ddf086.png">

When clicking on the `contains` command within the command log, the console outputs the following:

<img width="477" alt="screen shot 2015-11-27 at 1 43 50 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446977/04b31be4-950d-11e5-811e-4fd83d364d00.png">
***

## Related
1. [get](get)
2. [within](within)
3. [root](root)