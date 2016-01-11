slug: should

#### **New to Cypress?** [Read about assertions first.](assertions)

***

`cy.should` makes assertions about the current subject.

### [cy.should( *chainers* )](#chainers-usage)

Implicitly assert about the current subject.

Returns the existing current subject.

```js
cy.get("button[type='submit']").should("not.be.disabled")
```
***

### [cy.should( *chainers*, *value* )](#chainers-with-value-usage)

Implicitly assert a value about the current subject.

Returns the existing current subject (usually).

Some chai methods and chai-jQuery methods return a new (different) subject for chain-ability.

```js
cy.get("li").should("have.class", "active")
```
***

### [cy.should( *chainers*, *method*, *value* )](#chainers-with-method-and-value-usage)

Implicitly assert about the subject by calling a method and providing a value to that method.

Returns the new assertion subject for further assertion chain-ability.

```js
// have.attr comes from chai-jquery
cy.get("input").should("have.attr", "name", "firstName")
```

***

### [cy.should( *function* )](#function-usage)

Pass a function which can have any number of explicit assertions within it.

Does not change the subject. Whatever was passed to the function is what is returned.

```js
cy.get("p").should(function($p){
  expect($p.eq(0)).to.contain("text from the 1st p")
  expect($p.eq(1)).to.contain("text from the 2nd p")
  expect($p.eq(2)).to.contain("text from the 3rd p")
})
```

***

## Chainers Usage

#### Assert the checkbox is disabled

```js
cy.get(":checkbox").should("be.disabled")
```

***

#### The current subject is returned

```js
cy.get("option:first").should("be.selected").then(function($option)){
  // $option is still the current subject
})
```

***

## Chainers with Value Usage

#### Assert the class is 'form-horizontal'

```js
cy.get("form").should("have.class", "form-horizontal")
```

***

#### Assert the value is not 'foo'

```js
cy.get("input").should("not.have.value", "foo")
```

***

#### The current subject is returned

```js
cy.get("button").should("have.id", "new-user").then(function($button){
  // $button is still the current subject
})
```

***

## Chainers with Method and Value Usage

#### Assert the href is equal to '/users'

```js
cy.get("#header a").should("have.attr", "href", "/users")
```

***

## Function Usage

#### Verify length, content, and classes from multiple \<p\>

Passing a function to `should` enables you to assert on arbitrary subjects.

This gives you the opportunity to *massage* what you'd like to assert on.

Just be sure **not** to include any code that has side effects in your callback function.

The callback function will potentially be retried over and over again until no assertions within it throw.

```js
cy
  .get("p")
  .should(function($p){
    // should have found 3 elements
    expect($p).to.have.length(3)

    // make sure the first contains this text content
    expect($p.first()).to.contain("text from the first p")

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

#### Using a callback function will not change the subject

```js
cy.get("button").should(function($button){
  // whatever we return here is ignored
  // as Cypress will always force the return
  // value for future commands to be the same <button> subject

  expect({foo: "bar"}).to.deep.eq({foo: "bar"})

  // whatever the return value (if any) is ignored
  return {foo: "bar"}
}).then(function($button){
  // $button === <button>
  // the subject is unchanged no matter what was returned
})
```

***

## Multiple Assertions

#### Chaining multiple assertions

Cypress makes it easy to chain assertions together.

In this example we use `and` which is identical to `should`.

```js
// our subject is not changed by our first assertion,
// so we can continue to use DOM based assertions
cy.get("option:first").should("be.selected").and("have.value", "Metallica")
```

***

#### Assertions which change the subject

Sometimes using a specific chainer will automatically change the assertion subject. Cypress will follow this new subject.

For instance in `chai`, the method [`have.property("...")`](http://chaijs.com/api/bdd/) will automatically change the subject.

Additionally in [`Chai-jQuery`](https://github.com/chaijs/chai-jquery#attrname-value), the methods: `attr`, `prop`, `css`, and `data` also change the subject.

This allows you to utilize other `chainer` methods such as `match` when making assertions about values.

```js
// in this example our subject was changed to the string 'sans-serif' because
// have.css("font-family") returned a string instead of the <body> element
cy
  // subject is <body>
  .get("body")

  // subject changes to the string return value of 'font-family'
  .should("have.css", "font-family")

  // use match to assert the string matches a regular expression
  .and("match", /sans-serif/)
```

***

## Automatic Retry Support

Cypress won't resolve your commands until all of its assertions pass.

#### Wait until the assertion passes

```js
// Application Code
$("button").click(function(){
  $button = $(this)

  setTimeout(function(){
    $button.removeClass("inactive").addClass("active")
  }, 1000)
})
```

```js
cy
  .get("button")
    .click()
    .should("have.class", "active")
    .and("not.have.class", "inactive")
```

You can [read more about how Cypress resolves your assertions](assertions#resolving-assertions) here.

***

## Notes

#### How do I know what assertions and chainers I can use?

The `chainers` that `cy.should` accepts come from:

* Chai
* Chai-jQuery

A [list of these](assertions#available-assertions) can be found here.

***

#### How do I know which assertions change the subject and which keep it the same?

The chainers that come from [Chai](tools#chai) or [Chai-jQuery](tools#chai-jquery) will always document what they return.

Alternatively it is very easy to use Cypress itself to figure this out.

You can [read more about debugging assertions](assertions#debugging-assertions) here.

***

## Command Log

```js
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

## Related

1. [and](and)
2. [Assertions](assertions)