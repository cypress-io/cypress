slug: making-assertions
excerpt: Assertions verify an expectation.

# Contents

- :fa-angle-right: [Writing an Assertion](#section-writing-an-assertion)
  - :fa-minus: [Implicit Subjects with `cy.should` or `cy.and`](#section-implicit-subjects-with-cy-should-or-cy-and-)
  - :fa-minus: [Explicit Subjects with `expect` and `assert`](#section-explicit-subjects-with-expect-and-assert-)
- :fa-angle-right: [Available Assertions](#section-available-assertions)
  - :fa-minus: [Chai](#section-chai)
  - :fa-minus: [Chai-jQuery](#section-chai-jquery)
  - :fa-minus: [Chai-Sinon](#section-chai-sinon)
- :fa-angle-right: [Using Chainers with Implicit Subjects](#section-using-chainers-with-implicit-subjects)
- :fa-angle-right: [Resolving Assertions](#section-resolving-assertions)

***

# Writing an Assertion

There are two ways to write an assertion in Cypress.

1. **Implicit Subjects:** Using [`cy.should`](https://on.cypress.io/api/should) or [`cy.and`](https://on.cypress.io/api/and)
2. **Explicit Subjects:** Using `expect` or `assert`

***

## Implicit Subjects with [`cy.should`](https://on.cypress.io/api/should) or [`cy.and`](https://on.cypress.io/api/and)

Using [`cy.should`](https://on.cypress.io/api/should) or [`cy.and`](https://on.cypress.io/api/and) commands is the preferred way of making an assertion in Cypress. The subject of the assertion is inferred from the subject of the last Cypress command, which is why this is called an **implicit subject**.

```javascript
// the implicit subject here is the first <tr>
// this asserts that the <tr> has an .active class
cy.get("tbody tr:first").should("have.class", "active")
```

![implicit_assertion_class_active](https://cloud.githubusercontent.com/assets/1271364/12554600/4cb4115c-c34b-11e5-891c-84ff176ea38f.jpg)

***

## Explicit Subjects with `expect` or `assert`

Using `expect` or `assert` allows you to pass in a specific subject and make an assertion on the specified subject.

These assertions are more commonly used when writing unit tests, but can also be used when writing integration tests. Cypress comes bundled with some existing tools that handle assertions such as:

* [Chai](https://on.cypress.io/guides/bundled-tolls#chai)
* [Chai-jQuery](https://on.cypress.io/guides/bundled-tolls#chai-jquery)
* [Chai-Sinon](https://on.cypress.io/guides/bundled-tolls#sinon-chai)

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

***

# Available Assertions

An assertion is comprised of a subject, chainer methods, and an optional value.

```javascript
expect({foo: "bar"}).to.have.property("foo")
           ↲              ↲            ↲
        subject        chainers      value
```

The following chainers are available for your use:

- [Chai](#section-chai)
- [Chai-jQuery](#section-chai-jquery)
- [Chai-Sinon](#section-chai-sinon)

***

## Chai

[Chai](http://chaijs.com/) chainers are available for assertions.

| Chainable getters |
| --- |
| to |
| be |
| been |
| is |
| that |
| which |
| and |
| has |
| have |
| with |
| at |
| of |
| same |

| Assertion | Example |
| --- | --- |
| not | `expect(foo).to.not.equal('bar')` |
| deep | `expect(foo).to.deep.equal({ bar: 'baz' })` |
| any | `expect(foo).to.have.any.keys('bar', 'baz')` |
| all | `expect(foo).to.have.all.keys('bar', 'baz')` |
| a( *type* ) | `expect('test').to.be.a('string')` |
| an( *type* ) | `expect(undefined).to.be.an('undefined')` |
| include( *value* )  | `expect([1,2,3]).to.include(2)` |
| contain( *value* )  | `expect('foobar').to.contain('foo')` |
| includes( *value* )  | `expect([1,2,3]).includes(2)` |
| contains( *value* ) | `expect('foobar').contains('foo')` |
| ok | `expect(undefined).to.not.be.ok` |
| true | `expect(true).to.be.true` |
| false | `expect(false).to.be.false` |
| null | `expect(null).to.be.null` |
| undefined | `expect(undefined).to.be.undefined` |
| exist | `expect(foo).to.exist` |
| empty | `expect([]).to.be.empty` |
| arguments | `expect(arguments).to.be.arguments` |
| equal( *value* )  | `expect(42).to.equal(42)` |
| equals( *value* )  | `expect(42).equals(42)` |
| eq( *value* )  | `expect(42).to.eq(42)` |
| deep.equal( *value* ) | `expect({ foo: 'bar' }).to.deep.equal({ foo: 'bar' })` |
| eql( *value* )  | `expect({ foo: 'bar' }).to.eql({ foo: 'bar' })` |
| eqls( *value* )  | `expect([ 1, 2, 3 ]).eqls([ 1, 2, 3 ])` |
| above( *value* )  | `expect(10).to.be.above(5)` |
| gt( *value* )  | `expect(10).to.be.gt(5)` |
| greaterThan( *value* ) | `expect(10).to.be.greaterThan(5)` |
| least( *value* ) | `expect(10).to.be.at.least(10)` |
| gte( *value* ) | `expect(10).to.be.gte(10)` |
| below( *value* ) | `expect('foo').to.have.length.below(4)` |
| lt( *value* )  | `expect(3).to.be.ls(4)` |
| lessThan( *value* ) | `expect(5).to.be.lessThan(10)` |
| most( *value* ) | `expect('foo').to.have.length.of.at.most(4)` |
| lte( *value* ) | `expect(5).to.be.lte(5)` |
| within( *start*, *finish* ) | `expect(7).to.be.within(5,10)` |
| instanceof( *constructor* )| `expect([ 1, 2, 3 ]).to.be.instanceof(Array)` |
| instanceOf( *constructor* ) | `expect([ 1, 2, 3 ]).to.be.instanceOf(Array)` |
| property( *name*, *[value]* ) | `expect(obj).to.have.property('foo')` |
| deep.property( *name*, *[value]* ) | `expect(deepObj).to.have.deep.property('teas[1]', 'matcha')` |
| ownProperty( *name* )  | `expect('test').to.have.ownProperty('length')` |
| haveOwnProperty( *name* ) | `expect('test').to.haveOwnProperty('length')` |
| length( *value* )  | `expect('foo').to.have.length.above(2)` |
| lengthOf( *value* ) | `expect('foo').to.have.lengthOf(3)` |
| match( *regexp* ) | `expect('foobar').to.match(/^foo/)` |
| string( *string* ) | `expect('foobar').to.have.string('bar')` |
| keys( *key1*, *[key2]*, *[...]* ) | `expect({ foo: 1, bar: 2 }).to.have.key('foo')` |
| key( *key1*, *[key2]*, *[...]* ) | `expect({ foo: 1, bar: 2 }).to.have.any.keys('foo')` |
| throw( *constructor* ) | `expect(fn).to.throw(Error)` |
| throws( *constructor* ) | `expect(fn).throws(ReferenceError, /bad function/)` |
| respondTo( *method* ) | `expect(obj).to.respondTo('bar')` |
| itself | `expect(Foo).itself.to.respondTo('bar')` |
| satisfy( *method* ) | `expect(1).to.satisfy(function(num) { return num > 0; })` |
| closeTo( *expected*, *delta*) | `expect(1.5).to.be.closeTo(1, 0.5)` |
| members( *set* ) | `expect([1, 2, 3]).to.include.members([3, 2])` |
| change( *function* )  | `expect(fn).to.change(obj, 'val')` |
| changes( *function* ) | `expect(fn).changes(obj, 'val')` |
| increase( *function* )  | `expect(fn).to.increase(obj, 'val')` |
| increases( *function* ) | `expect(fn).increases(obj, 'val')` |
| decrease( *function* )  | `expect(fn).to.decrease(obj, 'val')` |
| decreases( *function* ) | `expect(fn).decreases(obj, 'val')` |

***

## Chai-jQuery

[Chai-jQuery](https://github.com/chaijs/chai-jquery) chainers are available when asserting about a DOM object.

| Chainers | Assertion |
| --- | --- |
| attr( *name*, *[value]*) | `expect($('body')).to.have.attr('foo', 'bar')` |
| prop( *name*, *[value]*) | `expect($('body')).to.have.prop('disabled', false)` |
| css( *name*, *[value]*) | `expect($('body')).to.have.css('background-color', 'rgb(0, 0, 0)')` |
| data( *name*, *[value]*) | `expect($('body')).to.have.data('foo', 'bar')` |
| class( *className* ) | `expect($('body')).to.have.class('foo')` |
| id( *id* ) | `expect($('body')).to.have.id('foo')` |
| html( *html*)  | `expect($('#title')).to.have.html('Chai Tea')` |
| text( *text* ) | `expect($('#title')).to.have.text('Chai Tea')` |
| value( *value* ) | `expect($('.year')).to.have.value('2012')` |
| visible | `expect($('.year')).to.be.visible` |
| hidden | `expect($('.year')).to.be.hidden` |
| selected | `expect($('option')).not.to.be.selected` |
| checked | `expect($('input')).not.to.be.checked` |
| enabled | `expect($('enabled')).to.be.enabled` |
| disabled | `expect($('input')).not.to.be.disabled` |
| empty | `expect($('body')).not.to.be.empty` |
| exist | `expect($('#nonexistent')).not.to.exist` |
| match( *selector* ) | `expect($('#empty')).to.match(':empty')` |
| contain( *text* ) | `expect($('#content')).to.contain('text')` |
| descendents( *selector* ) | `expect($('#content')).to.have.descendants('div')` |
| focus() | `expect($('#nonfocused')).not.have.focus()` |

You will commonly use these chainers after using DOM commands like: [`cy.get`](https://on.cypress.io/api/get), [`cy.contains`](https://on.cypress.io/api/contains), etc.

***

## Chai-Sinon

All Sinon assertions are available in [Sinon–Chai](https://github.com/domenic/sinon-chai).

| Sinon.JS property/method | Assertion |
| -- | -- |
| called |  `expect(spy).to.be.called` |
| callCount | `expect(spy).to.have.callCount(n)` |
| calledOnce |  `expect(spy).to.be.calledOnce` |
| calledTwice | `expect(spy).to.be.calledTwice` |
| calledThrice |  `expect(spy).to.be.calledThrice` |
| calledBefore |  `expect(spy1).to.be.calledBefore(spy2)` |
| calledAfter | `expect(spy1).to.be.calledAfter(spy2)` |
| calledWithNew | `expect(spy).to.be.calledWithNew` |
| alwaysCalledWithNew | `expect(spy).to.always.be.calledWithNew` |
| calledOn |  `expect(spy).to.be.calledOn(context)` |
| alwaysCalledOn |  `expect(spy).to.always.be.calledOn(context)` |
| calledWith |  `expect(spy).to.be.calledWith(...args)` |
| alwaysCalledWith |  `expect(spy).to.always.be.calledWith(...args)` |
| calledWithExactly | `expect(spy).to.be.calledWithExactly(...args)` |
| alwaysCalledWithExactly | `expect(spy).to.always.be.calledWithExactly(...args)` |
| calledWithMatch | `expect(spy).to.be.calledWithMatch(...args)` |
| alwaysCalledWithMatch | `expect(spy).to.always.be.calledWithMatch(...args)` |
| returned |  `expect(spy).to.have.returned(returnVal)` |
| alwaysReturned |  `expect(spy).to.have.always.returned(returnVal)` |
| threw | `expect(spy).to.have.thrown(errorObjOrErrorTypeStringOrNothing)` |
| alwaysThrew | `expect(spy).to.have.always.thrown(errorObjOrErrorTypeStringOrNothing)` |

***

# Using Chainers with Implicit Subjects

When utilizing [`cy.should`](https://on.cypress.io/api/should) or [`cy.and`](https://on.cypress.io/api/should), instead of writing chainers as properties and methods, they are instead transformed into a string argument.

If we convert the previous example to use [`cy.should`](https://on.cypress.io/api/should), it would look like:

```javascript
cy.wrap({foo: "bar"}).should("have.property", "foo")
           ↲                      ↲            ↲
        subject                chainers       value
```

The chainers are shifted and become the first argument to [`cy.should`](https://on.cypress.io/api/should), with values simply being passed in as additional arguments.

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

If you look closely, you'll see that we've passed a callback function to the [`cy.should`](https://on.cypress.io/api/should) method. This allows us to write expectations inside of that callback function, yet still receive all of the wonderful benefits of [`cy.should`](https://on.cypress.io/api/should).

Read about [resolving assertions](https://on.cypress.io/guides/making-assertions#section-resolving-assertions) below to learn how [`cy.should`](https://on.cypress.io/api/should) works under the hood.

***

# Resolving Assertions

Knowing when and how to resolve assertions is can be challenging, made even more difficult by modern JavaScript frameworks. Yet accurately resolving assertions is the key for preventing flaky and brittle tests.

Cypress's API is built to consistently pass or fail every time. As part of this strategy, Cypress will automatically look downstream at assertions and modify its behavior based on upcoming assertions.

Internally, Cypress will retry commands which are associated to assertions, and will not continue until **all** assertions pass. Using assertions as guards enables you to specify conditions that must be resolved prior to moving on.

What conditions should you specify? Anything that guarantees your app is in the correct state.

**Here are some scenarios of using assertions as guards:**

* Clicking an `<a>` then verifying the url is correct after you expect your server to redirect.
* Focusing, then blurring on an `<input>` and expecting an error message with a specific class to be visible.
* Clicking a `<button>` and waiting for a modal to animate in.
* Typing into a `<form>` and verifying an element should not exist or not be visible.

Every command that comes before a [`cy.should`](https://on.cypress.io/api/should) will not resolve until **all** of its associated assertions pass. This enables you to accurately test the following situation:

```html
<!-- Our App Code -->
<form>
  <input name="name" placeholder="What is your name?" />
  <span id="error" style="display: none;"></span>
</form>
```

```javascript
<!-- Our App Code -->
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