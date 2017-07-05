---
title: Assertions
comments: false
---

Cypress bundles the popular {% url 'Chai' assertions#Chai %} assertion library, as well as helpful extensions for {% url 'Sinon' assertions#Sinon-Chai %} and {% url 'jQuery' assertions#Chai-jQuery %}, bringing you dozens of powerful assertions for free.

# Chai

{% fa fa-github %} {% url http://chaijs.com/ %}

These chainers are available for assertions.

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

These getters are also available. They don't actually do anything, but they enable you to write simple, english sentences.

| Chainable getters |
| --- |
| `to`, `be`, `been`, `is`, `that`, `which`, `and`, `has`, `have`, `with`, `at`, `of`, `same` |

# Chai-jQuery

{% fa fa-github %} {% url https://github.com/chaijs/chai-jquery %}

These chainers are available when asserting about a DOM object.

You will commonly use these chainers after using DOM commands like: {% url `cy.get()` get %}, {% url `cy.contains()` contains %}, etc.

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

# Sinon-Chai

{% fa fa-github %} {% url https://github.com/domenic/sinon-chai %}

These chainers are used on assertions with {% url `cy.stub()` stub %} and {% url `cy.spy()` spy %}.

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

# Adding New Assertions

Because we are using `chai`, that means you can extend it however you'd like. Cypress will automatically "just work" with new assertions added to `chai`. You can simply:

- Write your own `chai` assertions as {% url 'documented here' http://chaijs.com/api/plugins/ %}.
- ...or NPM install any existing `chai` library and import into your test file or support file.

{% note info %}
{% url 'Check out our example recipe extending chai with new assertions.' extending-cypress-recipe %}
{% endnote %}

# Common Assertions

Here is a list of common element assertions.

Notice how we use these assertions (listed above) with {% url `.should()` should %}.

## Length

```javascript
// retry until we find 3 matching <li.selected>
cy.get("li.selected").should("have.length", 3)
```

## Class

```javascript
// retry until this input does not have class disabled
cy.get("form").find("input").should("not.have.class", "disabled")
```

## Value

```javascript
// retry until this textarea has the correct value
cy.get("textarea").should("have.value", "foo bar baz")
```

## Text Content

```javascript
// retry until this span does not contain 'click me'
cy.get("a").parent("span.help").should("not.contain", "click me")
```

## Visibility

```javascript
// retry until this button is visible
cy.get("button").should("be.visible")
```

## Existence

```javascript
// retry until loading spinner no longer exists
cy.get("#loading").should("not.exist")
```

## State

```javascript
// retry until our radio is checked
cy.get(":radio").should("be.checked")
```
