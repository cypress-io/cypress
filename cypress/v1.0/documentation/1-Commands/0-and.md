slug: and
excerpt: Enables chaining multiple assertions together


[block:callout]
{
  "type": "info",
  "body": "[Read about making assertions first.](https://on.cypress.io/guides/making-assertions)",
  "title": "New to Cypess?"
}
[/block]

`cy.and` is used to make assertions about the current subject. `cy.and` is identical to [`cy.should`](https://on.cypress.io/api/should), but `cy.and` sometimes reads better when chaining multiple assertions together.

**Returns:** the current subject (usually) for futher assertion chaining.

**Timeout:** the assertion with retry for the duration of the [Command Timeout](#section-global-options)

***

# Syntax

## [cy.and( *chainers* )](#section-chainers-usage)

Make an assertion about the current subject using assertion chainers.

***

## [cy.and( *chainers*, *value* )](#section-chainers-with-value-usage)

Make an assertion about the value of the current subject.

Some chai methods and chai-jQuery methods return a new (different) subject for chain-ability.

***

## [cy.and( *chainers*, *method*, *value* )](#section-chainers-with-method-and-value-usage)

Make an assertion about the subject by calling a method and providing a value to that method.

***

## [cy.and( *function* )](#section-function-usage)

Pass a function that can have any number of explicit assertions written within it.

Does not change the subject. Whatever was passed to the function is what is returned.

***

# Chainers Usage

## Chain assertions on the same subject

```javascript
cy.get("button").should("have.class", "active").and("not.be.disabled")
```
## Chain assertions on subject change

```html
<!-- App Code -->
<ul>
  <li>
    <a href="users/123/edit">Edit User</a>
  </li>
</ul>
```

```javascript
cy
  // subject is now <a>
  .get("a")

  // assert <a> contains text: "Edit User"
  // subject is still the <a>
  .should("contain", "Edit User")

  // assert subject has 'href' attribute
  // subject now changes to return value from the 'href' attribute
  .and("have.attr", "href")

  // assert that the string returned from 'href'
  // matches the RegExp /users/
  // the subject is still the same string
  .and("match", /users/)

  // assert that the string does not
  // have a '#' character within it
  .and("not.include", "#")
```

***

# Notes

## Similarities to Chai

If you've worked in [Chai](http://chaijs.com/) before, you will recognize that `cy.and` matches the same fluent assertion syntax.

Take this *explicit* assertion for example:

```javascript
expect({foo: "bar"}).to.have.property("foo").and.eq("bar")
```

`cy.and` reproduces this same assertion behavior.

***

# Command Log

## Chain assertions on the same subject

```javascript
  .find("input[type='checkbox']")
    .should("be.checked")
    .and("not.be.disabled")
```

The commands above will display in the command log as:

<img width="530" alt="screen shot 2015-11-29 at 12 16 46 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458700/36d1e646-9693-11e5-8771-158230530fdc.png">

When clicking on `assert` within the command log, the console outputs the following:

<img width="636" alt="screen shot 2015-11-29 at 12 17 03 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458702/3b6873be-9693-11e5-88f7-a928ebdac80c.png">

***

# Related

- [should](https://on.cypress.io/api/should)
- [Making Assertions](https://on.cypress.io/guides/making-assertions)