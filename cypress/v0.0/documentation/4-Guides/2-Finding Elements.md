slug: finding-elements
excerpt: Traverse the DOM, find elements, make assertions

# Contents

- :fa-angle-right: [Traversal](#traversing-the-dom)
  - [List of Commands](#list-of-commands)
  - [Starting a Query](#starting-a-query)
  - [CSS Selectors](#css-selectors)
- :fa-angle-right: [Existence](#existence)
  - [Waiting for an element to exist](#waiting-for-an-element-to-exist)
  - [Waiting for an element to not exist](#waiting-for-an-element-to-not-exist)
- :fa-angle-right: [Timeouts](#timeouts)
  - [How retrying works](#how-retrying-works)
  - [Increasing timeouts](#increasing-timeouts)
- :fa-angle-right: [Assertions](#assertions)
  - [Length Assertions](#length-assertions)
  - [Class Assertions](#class-assertions)
  - [Value Assertions](#value-assertions)
  - [Text Content Assertions](#text-content-assertions)
  - [Visibility Assertions](#visibility-assertions)
  - [Existence Assertions](#existence-assertions)
  - [State Assertions](#state-assertions)

***

# Traversal

At the heart of all integration tests is the DOM. Cypress gives you a host of familiar commands to make traversing the DOM as easy as possible.

You'll notice many of these commands match the same behavior as their [jQuery counterparts](https://api.jquery.com/category/traversing/).

***

## List of Commands

- [children](https://on.cypress.io/api/children)
- [closest](https://on.cypress.io/api/closest)
- [contains](https://on.cypress.io/api/contains)
- [eq](https://on.cypress.io/api/eq)
- [find](https://on.cypress.io/api/find)
- [filter](https://on.cypress.io/api/filter)
- [first](https://on.cypress.io/api/first)
- [get](https://on.cypress.io/api/get)
- [last](https://on.cypress.io/api/last)
- [next](https://on.cypress.io/api/next)
- [not](https://on.cypress.io/api/not)
- [parent](https://on.cypress.io/api/parent)
- [parents](https://on.cypress.io/api/parents)
- [prev](https://on.cypress.io/api/prev)
- [siblings](https://on.cypress.io/api/siblings)

***

## Starting a Query

In Cypress, you will almost always start a sequence of traversal commands with [`cy.get`](https://on.cypress.io/api/get). You can think of [`cy.get`](https://on.cypress.io/api/get) as the same as jQuery's `$` for getting DOM elements.

**The following examples are equivalent:**

```javascript
// return the element with id: 'main'
cy.get("#main") // in cypress
$("#main")      // in jquery

// we can chain other traversal commands
// using the same familiar pattern
cy.get("#main").find("ul").children("li").first() // in cypress
$("#main").find("ul").children("li").first()      // in jquery
```

***

## CSS Selectors

All DOM commands support the same CSS selectors found in the [jQuery Sizzle](https://sizzlejs.com/) engine.


```javascript
// All of the commands below are valid

cy.get("ul").find("li:nth-child(odd)")

cy.get("select[name=list] :not(:selected)")

cy.get(".container").children("input:disabled'")

cy.get("header").find("*")

cy.get("input[type=checkbox]").first("input:checked")

cy.get("span:nth-of-type(2)")

cy.get("input[data-js='user-name'][ng-input]")
```

***

# Existence

## Waiting for an element to exist

If you're coming to Cypress from another framework you'll likely first wonder:

> How do I wait until an element exists?

At first glance you may think you need to write this in Cypress:

```javascript
cy.get("#container").should("exist")
                          ↲
         // this assertion is unnecessary
```

In Cypress you **never have to explicitly wait for an element to exist**. By default Cypress does this for you.

**What's going on under the hood?**

Under the hood, Cypress will *automatically* retry commands which do not find elements. Cypress will continue retrying a command until it times outs.

*Imagine this example:*

```javascript
cy.get("form").find("inpit").type("foo").parent(".row")
                       ↲
    // oops we have a typo here in our selector
```

Cypress will continue to retry finding the `inpit` element for **4 seconds** and then time out since this element does not exist. The [`cy.type`](https://on.cypress.io/api/type) and [`cy.parent`](https://on.cypress.io/api/parent) commands are never issued because Cypress will give up after failing to find the `inpit` element.

Another way to look at it is to imagine there being an implied `.should("exist")` after every DOM command.

It's as if Cypress is writing the code below for you:

```javascript
cy
  .get("form").should("exist")
  .find("input").should("exist").type("foo")
  .parent(".row").should("exist")
```

***

## Waiting for an element not to exist

If you've read the previous section you may be wondering:

> If Cypress automatically waits for elements to exist, how do I tell Cypress to **wait for an element not to exist**?

The answer is quite simple - just add that assertion and Cypress will *reverse* its default behavior.

```javascript
cy
  .get("button").click()

  // now cypress will reverse its behavior.
  //
  // instead of retrying until an element DOES exist
  // it will now retry until this element DOES NOT exist
  .get("#loading-spinner").should("not.exist")
```

In fact - assertions *always* tell Cypress when to resolve your DOM commands.

You simply describe the state of your element with assertions, and Cypress knows not to resolve your command until the element(s) in question match the assertion(s) behavior.

***

# Timeouts

## How retrying works

When you provide assertions, Cypress knows to automatically wait until those assertions pass.

When an assertion does not pass, Cypress will wait a brief period of time and retry again.

By default, all commands will retry until [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) is exceeded. By default this means Cypress will wait up to **4 seconds** per DOM command + its associated assertions.

Imagine this example:

```javascript
cy
  .get("#main")     // <-- wait up to 4 seconds for '#main' to be found

  .children("form") // <-- wait up to 4 seconds for 'form' children to be found

  .find("input")                  // <-- wait up to 4 seconds for this 'input' to be found
    .should("have.value", "foo")  // <-- and to have the value 'foo'
    .and("have.class", "radio")   // <-- and to have the class 'radio'

  .parents("#foo")
    .should("not.exist")          // <-- wait up to 4 seconds for this element NOT to be found
```

***

## Increasing timeouts

You have two ways of increasing the amount of time Cypress waits for resolving DOM commands.

1. Change the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) globally
2. Override the timeout option on a specific command

Overriding the timeout option on a specific command looks like this:

```javascript
cy
  .get("#main", {timeout: 5000})   // <-- wait up to 5 seconds for '#main' to be found

  .children("form")                // <-- wait up to 4 seconds again

  .find("input", {timeout: 10000}) // <-- wait up to 10 seconds for this 'input' to be found
    .should("have.value", "foo")   // <-- and to have the value 'foo'
    .and("have.class", "radio")    // <-- and to have the class 'radio'

  .parents("#foo", {timeout: 2000})
    .should("not.exist")            // <-- wait up to 2 seconds for this element NOT to be found
```

It's important to note that timeouts will automatically flow down to their cooresponding assertions.

**In the example we wait up to a total of 10 seconds to:**

1. find the `<input>`
2. ensure it has a value of `foo`
3. ensure it has a class of `radio`

```javascript
cy.find("input", {timeout: 10000}).should("have.value", "foo").and("have.class", "radio")
                         ↲
      // adding the timeout here will automatically
      // flow down to the assertions, and they will
      // be retried for up to 10 seconds
```

[block:callout]
{
  "type": "warning",
  "body": "Assuming you have two assertions, if one passes, and one fails, Cypress will continue to retry until they **both** pass. If Cypress eventually times out you'll get a visual indicator in your Command Log to know which specific assertion failed."
}
[/block]

***

# Assertions

[block:callout]
{
  "type": "info",
  "body": "Read about [Making Assertions](https://on.cypress.io/guides/making-assertions) and where they come from.",
  "title": "New to Cypress?"
}
[/block]

## Length Assertions

```javascript
// retry until we find 3 matching <li.selected>
cy.get("li.selected").should("have.length", 3)
```

***

## Class Assertions

```javascript
// retry until this input does not have class disabled
cy.get("form").find("input").should("not.have.class", "disabled")
```

***

## Value Assertions

```javascript
// retry until this textarea has the correct value
cy.get("textarea").should("have.value", "foo bar baz")
```

***

## Text Content Assertions

```javascript
// retry until this span does not contain 'click me'
cy.get("a").parent("span.help").should("not.contain", "click me")
```

***

## Visibility Assertions

```javascript
// retry until this button is visible
cy.get("button").should("be.visible")
```

***

## Existence Assertions

```javascript
// retry until loading spinner no longer exists
cy.get("#loading").should("not.exist")
```

***

## State Assertions

```javascript
// retry until our radio is checked
cy.get(":radio").should("be.checked")
```
