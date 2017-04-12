slug: should
excerpt: Make an assertion about the current subject

[block:callout]
{
  "type": "info",
  "body": "[Read about making assertions first.](https://on.cypress.io/guides/making-assertions)",
  "title": "New to Cypress?"
}
[/block]

`cy.should` makes assertions about the current subject.

| | |
|--- | --- |
| **Returns** | the current subject but (in some cases) a new subject |
| **Timeout** | the assertion will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) |

***

# [cy.should( *chainers* )](#section-chainers-usage)

Implicitly assert about the current subject.

***

# [cy.should( *chainers*, *value* )](#section-chainers-with-value-usage)

Implicitly assert a value about the current subject. Returns the existing current subject (usually). Some chai methods and chai-jQuery methods return a new (different) subject for chain-ability.

***

# [cy.should( *chainers*, *method*, *value* )](#section-chainers-with-method-and-value-usage)

Implicitly assert about the subject by calling a method and providing a value to that method.

***

# [cy.should( *function* )](#section-function-usage)

Pass a function that can have any number of explicit assertions within it. Does not change the subject. Whatever was passed to the function is what is returned.

***

# Chainers Usage

## Assert the checkbox is disabled

```javascript
cy.get(":checkbox").should("be.disabled")
```

***

## The current subject is returned

```javascript
cy.get("option:first").should("be.selected").then(function($option)){
  // $option is still the current subject
})
```

***

# Chainers with Value Usage

## Assert the class is 'form-horizontal'

```javascript
cy.get("form").should("have.class", "form-horizontal")
```

***

## Assert the value is not 'foo'

```javascript
cy.get("input").should("not.have.value", "foo")
```

***

## The current subject is returned

```javascript
cy.get("button").should("have.id", "new-user").then(function($button){
  // $button is still the current subject
})
```

***

# Chainers with Method and Value Usage

## Assert the href is equal to '/users'

```javascript
// have.attr comes from chai-jquery
cy.get("#header a").should("have.attr", "href", "/users")
```

***

# Function Usage

## Verify length, content, and classes from multiple `<p>`

Passing a function to `should` enables you to assert on arbitrary subjects. This gives you the opportunity to *massage* what you'd like to assert on.

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
  .should(function($p){
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
  .get("button").should(function($button){
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

# Multiple Assertions

## Chaining multiple assertions

Cypress makes it easy to chain assertions together.

In this example we use [`cy.and`](https://on.cypress.io/api/and) which is identical to `should`.

```javascript
// our subject is not changed by our first assertion,
// so we can continue to use DOM based assertions
cy.get("option:first").should("be.selected").and("have.value", "Metallica")
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

# Automatic Retry Support

Cypress won't resolve your commands until all of its assertions pass.

## Wait until the assertions pass

```javascript
// Application Code
$("button").click(function(){
  $button = $(this)

  setTimeout(function(){
    $button.removeClass("inactive").addClass("active")
  }, 1000)
})
```

```javascript
cy
  .get("button")
    .click()
    .should("have.class", "active")
    .and("not.have.class", "inactive")
```

You can [read more about how Cypress resolves your assertions](https://on.cypress.io/guides/making-assertions#section-resolving-assertions) here.

***

# Notes

## What assertions and chainers can I use?

The chainers that `cy.should` accepts come from:

* Chai
* Chai-jQuery

A [list of these](https://on.cypress.io/guides/making-assertions#available-assertions) can be found here.

***

## How do I know which assertions change the subject and which keep it the same?

The chainers that come from [Chai](https://on.cypress.io/guides/bundled-tools#section-chai) or [Chai-jQuery](https://on.cypress.io/guides/bundled-tools#section-chai-jquery) will always document what they return.

Alternatively, it is very easy to use Cypress itself to figure this out.

You can [read more about debugging assertions](https://on.cypress.io/guides/making-assertions#sections-debugging-assertions) here.

***

## Can I pass options to cy.should()?

Options passed to the preceding command will be passed through to `cy.should`.

The following example is an example of increasing the `timeout` of the `cy.should`:

```javascript
cy
  .get("input", {timeout: 10000}) // <-- wait up to 10 seconds for this 'input' to be found
    .should("have.value", "foo")   // <-- and to have the value 'foo'
    .and("have.class", "radio")    // <-- and to have the class 'radio'

  .parents("#foo", {timeout: 2000}) // <--
    .should("not.exist")            // <-- wait up to 2 seconds for this element NOT to be found
```

```javascript
cy.find("input", {timeout: 10000}).should("have.value", "foo").and("have.class", "radio")
                         ↲
      // adding the timeout here will automatically
      // flow down to the assertions, and they will
      // be retried for up to 10 seconds
```

***

# Command Log

## Assert that there should be 8 children in a nav

```javascript
//
cy
  .get(".left-nav>.nav")
    .children()
      .should("have.length", 8)
```

The commands above will display in the command log as:

<img width="525" alt="screen shot 2015-11-29 at 12 08 35 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458632/04e5da58-9692-11e5-870d-8f9e274192d1.png">

When clicking on `assert` within the command log, the console outputs the following:

<img width="768" alt="screen shot 2015-11-29 at 12 08 45 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458633/08a7b238-9692-11e5-9d5d-620122436bc0.png">

***

# Related

- [and](https://on.cypress.io/api/and)
- [Assertions](https://on.cypress.io/guides/making-assertions)