slug: and
excerpt: Enables chaining multiple assertions together

# [cy.and( *chainers*)](#chainers-usage)

`cy.and` makes assertions about the current subject. Implicitly assert about the current subject. Returns the existing current subject.

When chaining multiple assertions together, `cy.and` sometimes reads better than [`cy.should`](https://on.cypress.io/api/should).

`cy.and` is identical to [`cy.should`](https://on.cypress.io/api/should).

[block:callout]
{
  "type": "info",
  "body": "[Read about making assertions first.](https://on.cypress.io/guides/making-assertions)",
  "title": "New to Cypess?"
}
[/block]

***

# [cy.and( *chainers*, *value* )](#chainers-with-value-usage)

Implicitly assert a value about the current subject. Returns the existing current subject (usually).

Some chai methods and chai-jQuery methods return a new (different) subject for chain-ability.

***

# [cy.and( *chainers*, *method*, *value* )](#chainers-with-method-and-value-usage)

Implicitly assert about the subject by calling a method and providing a value to that method.

Returns the new assertion subject for further assertion chain-ability.

***

# [cy.and( *function* )](#function-usage)

Pass a function that can have any number of explicit assertions within it.

Does not change the subject. Whatever was passed to the function is what is returned.


# Chainers Usage

```javascript
cy.get("button").should("have.class", "active").and("not.be.disabled")
```

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

If you've worked in [Chai](http://chaijs.com/) before, you will recognize that `cy.and` matches the same fluent assertion syntax.

Take this *explicit* assertion for example:

```javascript
expect({foo: "bar"}).to.have.property("foo").and.eq("bar")
```

`cy.and` reproduces this same assertion behavior.

***

# Command Log

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

1. [should](https://on.cypress.io/api/should)
2. [Assertions](https://on.cypress.io/guides/making-assertions)