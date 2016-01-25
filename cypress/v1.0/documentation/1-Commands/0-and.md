slug: and
excerpt: Enables chaining multiple assertions together

[block:callout]
{
  "type": "info",
  "body": "[Read about making assertions first.](https://on.cypress.io/guides/making-assertions)",
  "title": "New to Cypess?"
}
[/block]

`cy.and` makes chaining together assertions easy. `cy.and` is identical to [`cy.should`](https://on.cypress.io/api/should), but `cy.and` sometimes reads better when chaining multiple assertions together.

| | |
|--- | --- |
| **Returns** | the current subject (usually) for futher assertion chaining. |
| **Timeout** | the assertion will retry for the duration of the [Command Timeout](https://on.cypress.io/guides/configuration#section-global-options) |

***

# [cy.and( *chainers* )](#section-chainers-usage)

Make an assertion about the current subject using assertion chainers.

***

# [cy.and( *chainers*, *value* )](#section-chainers-with-value-usage)

Make an assertion about the value of the current subject.

Some chai methods and chai-jQuery methods return a new (different) subject for chain-ability.

***

# [cy.and( *chainers*, *method*, *value* )](#section-chainers-with-method-and-value-usage)

Make an assertion about the subject by calling a method and providing a value to that method.

***

# [cy.and( *function* )](#section-function-usage)

Pass a function that can have any number of explicit assertions written within it.

Does not change the subject. Whatever was passed to the function is what is returned.

***

# Chainers Usage

## Chain assertions on the same subject

```javascript
cy.get("button").should("have.class", "active").and("not.be.disabled")
```

***

# Chainers with Value Usage

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

# Chainers with Method and Value Usage

## Assert the href is equal to '/users'

```javascript
// have.attr comes from chai-jquery
cy
  .get("#header a")
  .should("have.class", "active")
  .and("have.attr", "href", "/users")
```

***

# Function Usage

## Verify length, content, and classes from multiple `<p>`

Passing a function to `and` enables you to assert on arbitrary subjects. This gives you the opportunity to *massage* what you'd like to assert on.

Just be sure *not* to include any code that has side effects in your callback function.

The callback function will be retried over and over again until no assertions within it throw.

```html
<div>
  <p class="text-primary">Hello World</p>
  <p class="text-danger">You have an error</p>
  <p class="text-default">Try again later</p>
</div>
```

```javascript
cy
  .get("p")
  .should("not.be.empty")
  .and(function($p){
    // should have found 3 elements
    expect($p).to.have.length(3)

    // make sure the first contains some text content
    expect($p.first()).to.contain("Hello World")

    // use jquery's map to grab all of their classes
    // jquery's map returns a new jquery object
    var classes = $p.map(function(i, el){
      return cy.$(el).attr("class")
    })

    // call classes.get() to make this a plain array
    expect(classes.get()).to.deep.eq([
      "text-primary",
      "text-danger",
      "text-default"
    ])
  })
```

***

## Using a callback function will not change the subject

```javascript
cy
  .get("button")
  .should("be.active")
  .and(function($button){
    // whatever we return here is ignored
    // as Cypress will always force the return
    // value for future commands to be the same
    // as the previous subject which is <button>

    expect({foo: "bar"}).to.deep.eq({foo: "bar"})

    // whatever the return value (if any) is ignored
    return {foo: "bar"}
  })

  .then(function($button){
    // $button === <button>
    // the subject is unchanged no matter what was returned
  })
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