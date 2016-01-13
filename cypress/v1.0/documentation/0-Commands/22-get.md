excerpt: Get an element
slug: get

### [cy.get( *selector* )](#selector-usage)
Matches one or more DOM elements based on the CSS-based selector.  The selector can be any valid jQuery selector.

`cy.get(...)` will **always** query from the current scope (default: document), and ignore previous commands.

If Cypress does not find any matching element(s), it will continue to retry until the `commandTimeout` has been reached.

***

### [cy.get( *alias* )](#alias-usage)
Alternatively, pass in an '@' character to find an [aliased](/docs/using-aliases) element.

Internally Cypress keeps a cache of all aliased elements.  If the element currently exists in the DOM, it is immediately returned.  If the element no longer exists, Cypress will re-query the element based on the previous selector path to find it again.

***

## Selector Usage

> Find the element with an id of `main`

```javascript
cy.get("#main")
```

***

> Find the first `li` descendent within `ul`

```javascript
cy.get("ul li:first")
```

***

> Find the element with class `dropdown menu`, and click it. <br>
> Break out of previous command chain and query for `#search` from the root document.

```javascript
cy
  .get(".dropdown-menu").click()
  .get("#search").type("mogwai")
```

***

> Find the element `form`. <br>
> Scope all new queries to within `form`. <br>
> Find the element `input` within `form`. <br>
> Type `brian` into the `input`. <br>
> Find the element `textarea` within `form`. <br>
> Type `is so cool` into the `textarea`.

```javascript
cy.get("form").within(function(){
  cy
    .get("input").type("brian")
    .get("textarea").type("is so cool")
})
```

***

> Specify that an element should be visible

```javascript
// here we are specifying to only resolve the 'get'
// when the matched element becomes visible
cy.get("#search input", {visible: true}).type("brian")
```

***

> Specify that an element should not be visible

```javascript
cy.get("button", {visible: false})
```

***

> Specify that an element should not exist

```javascript
cy.get("#footer", {exist: false})
```

> Specific that a collection of elements should have length of 5

```javascript
cy.get("ul>li", {length: 5})
```

***

## Alias Usage

> Retrieve existing `todos` elements

```javascript
cy.get("ul#todos li").as("todos")

//...hack hack hack...

//later retreive the todos
cy.get("@todos")
```

***

> Alias the `submitBtn` in a `beforeEach`

```javascript
beforeEach(function(){
  cy.get("button[type=submit]").as("submitBtn")
})

it("disables on click", function(){
  cy.get("@submitBtn").click().should("be.disabled")
})
```

***

For a detailed explanation of aliasing, [read more about aliasing here](/docs/using-aliases).

## Command Log

<img width="524" alt="screen shot 2015-11-27 at 1 24 20 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446808/5d2f2180-950a-11e5-8645-4f0f14321f86.png">

When clicking on the `get` command within the command log, the console outputs the following:

<img width="543" alt="screen shot 2015-11-27 at 1 24 45 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446809/61a6f4f4-950a-11e5-9b23-a9efa1fbccfc.png">

## Related

1. [contains](/v1.0/docs/contains)
2. [within](/v1.0/docs/within)
3. [find](/v1.0/docs/find)
4. [root](/v1.0/docs/root)