slug: making-assertions
excerpt: Verify expectations

Assertions verify an expectation.



## Writing an Assertion

There are two ways to write an assertion within Cypress.

1. **Implicit Subjects:** Using `cy.should`
2. **Explicit Subjects:** Using `expect` or `assert`

**Implicit Subjects with `cy.should`**

Using Cypress' [`should`](http://on.cypress.io/api/should) command is the preferred way of making an assertion. The subject of the assertion is inferred from the subject of the last Cypress command, which is why this is called an **implicit subject**.

```javascript
// the implicit subject here is the <button>
cy.get("button").should("have.class", "active")
```

![assertions](https://cloud.githubusercontent.com/assets/1268976/10002810/3102a8a6-6077-11e5-85bf-5f8666bcb1a8.png)

**Explicit Subjects with `expect` or `assert`**

 Using `expect` or `assert` allows you to pass in a specific subject when making an assertion.

These assertions are more commonly used when writing unit tests, but can also be used when writing integration tests. Cypress comes bundled with some existing tools that already handle assertions such as:

* [Chai](http://on.cypress.io/guides/bundled-tolls#chai)
* [Chai-jQuery](http://on.cypress.io/guides/bundled-tolls#chai-jquery)
* [Chai-Sinon](http://on.cypress.io/guides/bundled-tolls#sinon-chai)

```javascript
// the explicit subject here is the boolean: true
expect(true).to.be.true
```

```javascript
// assert is also available
assert.isTrue(true, "true should be true")
```

Explicit assertions are great when you want to perform custom logic prior to making the assertion.

```javascript
cy
  .get("p")
  .should(function($p){
    // return an array of texts from all of the p's
    var texts = $p.map(function(i, el){
      return cy.$(el).text()
    })

    // jquery map returns jquery object
    // and .get() convert this to simple array
    var texts = texts.get()

    // array should have length of 3
    expect(texts).to.have.length(3)

    // set this specific subject
    expect(texts).to.deep.eq([
      "Some text from first p",
      "More text from second p",
      "And even more text from third p"
    ])
})
```

## Available Assertions

An assertion is comprised of a subject, chainer methods, and an optional value.

```javascript
expect({foo: "bar"}).to.have.property("foo")
           ↲              ↲            ↲
        subject        chainers      value
```

The following chainers are available for your use:

#### [Chai](http://chaijs.com/api/bdd/)
- to
- be
- been
- is
- that
- which
- and
- has
- have
- with
- at
- of
- same
- not
- deep
- any
- all
- a / an
- include / contain / includes / contains
- ok
- true
- false
- null
- undefined
- exist
- empty
- arguments / Arguments
- equal / equals / eq / deep.equal
- eql / eqls
- above / gt / greaterThan
- least / gte
- below / lt / lessThan
- most / lte
- within
- instanceof / instanceOf
- property / deep.property
- ownProperty / haveOwnProperty
- length / lengthOf
- match
- string
- keys / key
- throw / throws
- respondTo
- itself
- satisfy
- closeTo
- members
- change / changes
- increase / increases
- decrease / decreases

#### [Chai-jQuery](https://github.com/chaijs/chai-jquery)

Additionally these chainers are added when asserting about a DOM object.

- attr
- prop
- css
- data
- class
- id
- html
- text
- value
- visible
- hidden
- selected
- checked
- enabled
- disabled
- empty
- exist
- match
- contain
- descendents

You will commonly use these chainers after using DOM commands like: [`cy.get`](http://on.cypress.io/api/get), [`cy.contains`](http://on.cypress.io/api/contains), etc.

**Using Chainers with [`cy.should`](http://on.cypress.io/api/should)**

When utilizing [`cy.should`](http://on.cypress.io/api/should), instead of writing chainers as properties and methods, they are instead transformed into a string argument.

If we convert the previous example to use `cy.should`, it would look like:

```javascript
cy.wrap({foo: "bar"}).should("have.property", "foo")
           ↲                      ↲            ↲
        subject                chainers       value
```

The chainers are shifted and become the first argument to [`cy.should`](http://on.cypress.io/api/should), with values simply being passed in as additional arguments.

```javascript
// we can additionally continue to chain and add
// multiple assertions about our <button> subject
cy.get("button").should("have.class", "active").and("be.visible")
          ↲                  ↲          ↲             ↲
        subject           chainers     value         chainers
```

If we converted the above example to use an explicit subject, this is what it would look like:

```javascript
cy.get("button").should(function($button){
  expect($button).to.have.class("active")
  expect($button).to.be.visible
})
```

This example above may be more familiar to you if you've written tests in JavaScript before.

If you look closely, you'll see that we've passed a callback function to the [`cy.should`](http://on.cypress.io/api/should) method. This allows us to write expectations inside of that callback function, yet still receive all of the wonderful benefits of [`cy.should`](http://on.cypress.io/api/should).

Read about [resolving assertions](http://on.cypress.io/guides/making-assertions#resolving-assertions) below to learn how [`cy.should`](http://on.cypress.io/api/should) works under the hood.

## Resolving Assertions

Knowing when and how to resolve assertions is can be challenging, made even more difficult by modern JavaScript frameworks. Yet accurately resolving assertions is the key for preventing flaky and brittle tests.

Cypress's API is built to consistently pass or fail every time. As part of this strategy, Cypress will automatically look downstream at assertions and modify its behavior based on upcoming assertions.

Internally, Cypress will retry commands which are associated to assertions, and will not continue until **all** assertions pass. Using assertions as guards enables you to specify conditions that must be resolved prior to moving on.

What conditions should you specify? Anything that guarantees your app is in the correct state.

Here are some typical scenarios:

* Clicking an `<a>` then verifying the url is correct after you expect your server to redirect.
* Focusing, then blurring on an `<input>` and expecting an error message with a specific class to be visible.
* Clicking a `<button>` and waiting for a modal to animate in.
* Typing into a `<form>` and verifying an element should not exist or not be visible.

Every command that comes before a [`cy.should`](http://on.cypress.io/api/should) will not resolve until **all** of its associated assertions pass.

This enables you to accurately test the following situation:

```html
<!-- Our App Code -->
<form>
  <input name="name" placeholder="What is your name?" />
  <span id="error" style="display: none;"></span>
</form>

<script type="text/javascript">
  function waitRandomlyThen(fn){
    setTimeout(fn, Math.random() * 3000)
  }

  $("form").submit(function(e){
    e.preventDefault()

    waitRandomlyThen(function(){
      $("#error").show()
    })

    waitRandomlyThen(function(){
      $("#error").addClass("alert-danger")
    })

    waitRandomlyThen(function(){
      $("#error").html("Your <strong>name</strong> is required.")
    })
  })
</script>
```

The above app code could can be tested with the following assertions:

```javascript
cy
  .get("form").submit()
  .get("#error")
    .should("be.visible")
    .and("have.class", "alert-danger")
    .and("contain", "Your name is required.")
```

Our tests' code is insulated from flaky failures because it is not coupled to any specific timing mechanism. If you look closely, our application code is written in such a way that introduces random wait times - yet Cypress will pass 100% of the time, without any explicit `wait` calls. The moment all 3 of the assertions pass, Cypress will resolve.

![assertions](https://cloud.githubusercontent.com/assets/1268976/10004440/b1c53294-607f-11e5-8d7d-3f5694a1fb1a.gif)

In modern JavaScript frameworks, and in many common web-based actions, there is usually an *indeterminate* amount of time between an action and a side effect such as:

* Network Requests
* Redirects
* Form Submissions
* AJAX Requests
* Websockets
* Page Navigation
* setTimeout's
* DOM Events

Cypress makes it easy to test and make assertions about all of these.

## Debugging Assertions

- When assertions fail
- Determining Subject Changes
- Clicking on an assertion for more information
- Inspecting Objects
- Making multiple assertions

## Common Assertions

- Element existence
- Element non-existance
- Element text / content
- Element Visibility
- Counting number of elements
- Animations and Transitions
- Classes and Properties
- Request URL
- Request Headers
- Request Body
- Counting number of requests
- Verifying an object deep equals another object
- Matching a property with regular expression
- Matching the URL with a regular expression
