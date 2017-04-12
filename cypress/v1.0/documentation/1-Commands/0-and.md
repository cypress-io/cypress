slug: and
excerpt: Chain multiple assertions together

[block:callout]
{
  "type": "info",
  "body": "[Read about Making Assertions first.](https://on.cypress.io/guides/making-assertions)",
  "title": "New to Cypress?"
}
[/block]

`cy.and` makes chaining together assertions easy.

You'd typically use `cy.and` when you are making multiple assertions about the same subject.

| | |
|--- | --- |
| **Returns** | the current subject but (in some cases) a new subject  |
| **Timeout** | the assertion will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) |

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

Passing a function to `cy.and` enables you to assert on arbitrary subjects. This gives you the opportunity to *massage* what you'd like to assert on.

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

## Assertions that change the subject

Sometimes using a specific chainer will automatically change the assertion subject.

For instance in `chai`, the method [`have.property("...")`](http://chaijs.com/api/bdd/) will automatically change the subject.

Additionally in [`Chai-jQuery`](https://github.com/chaijs/chai-jquery#attrname-value), the methods: `attr`, `prop`, `css`, and `data` also change the subject.

This allows you to utilize other `chainer` methods such as `match` when making assertions about values.

```javascript
// in this example our subject changed to the string 'sans-serif' because
// have.css("font-family") returned a string instead of the <body> element
cy
  // subject is <body>
  .get("body")

  // subject changes to the string return value of 'font-family'
  .should("have.css", "font-family")

  // use match to assert the string matches a regular expression
  .and("match", /sans-serif/)
```

```javascript
// in this example our subject changed to the string '/users' because
// have.attr, href, /users returned a string instead of the <a> element
cy
  // subject is <a>
  .get("a")

  // subject changes to the string 'users'
  .should("have.attr", "href", "/users")
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

## Can I pass options to cy.and()?

Options passed to the preceding command will be passed through to `cy.and`.

The following example is an example of increasing the `timeout` of the `cy.and`:

```javascript
cy
  .get("input", {timeout: 10000}) // <-- wait up to 10 seconds for this 'input' to be found
    .should("have.value", "foo")   // <-- and to have the value 'foo'
    .and("have.class", "radio")    // <-- and to have the class 'radio'
```

```javascript
cy.find("input", {timeout: 10000}).should("have.value", "foo").and("have.class", "radio")
                         ↲
      // adding the timeout here will automatically
      // flow down to the assertions, and they will
      // be retried for up to 10 seconds
```

***

## How do I know which assertions change the subject and which keep it the same?

The chainers that come from [Chai](https://on.cypress.io/guides/bundled-tools#section-chai) or [Chai-jQuery](https://on.cypress.io/guides/bundled-tools#section-chai-jquery) will always document what they return.

Alternatively, it is very easy to use Cypress itself to figure this out.

You can [read more about debugging assertions](https://on.cypress.io/guides/making-assertions#debugging-assertions) here.

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