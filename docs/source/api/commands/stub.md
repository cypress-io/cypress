---
title: stub
comments: false
---

Replace a function, record its usage and control its behavior.

{% note info %}
**Note:** `.stub()` assumes you are already familiar with our guide: {% url 'Stubs, Spies, and Clocks' stubs-spies-and-clocks %}
{% endnote %}

# Syntax

```javascript
cy.stub()
cy.stub(object, method)
cy.stub(object, method, replacerFn)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.stub(user, 'addFriend')    
```

## Arguments

**{% fa fa-angle-right %} object** ***(Object)***

The `object` that has the `method` to be replaced.

**{% fa fa-angle-right %} method** ***(String)***

The name of the `method` on the `object` to be wrapped.

**{% fa fa-angle-right %} replacerFn** ***(Function)***

The function used to replace the `method` on the `object`.

## Yields {% helper_icon yields %}

Unlike most Cypress commands, `cy.stub()` is *synchronous* and returns a value (the stub) instead of a Promise-like chain-able object.

`cy.stub()` returns a {% url "Sinon.js stub" http://sinonjs.org/%}. All methods found on {% url "Sinon.js" http://sinonjs.org %} spies and stubs are supported.

# Examples

## Method

***Create a stub and manually replace a function***

```javascript
// assume App.start calls util.addListeners
util.addListeners = cy.stub()

App.start()
expect(util.addListeners).to.be.called
```

***Replace a method with a stub***

```javascript
// assume App.start calls util.addListeners
cy.stub(util, 'addListeners')

App.start()
expect(util.addListeners).to.be.called
```

***Replace a method with a function***

```javascript
// assume App.start calls util.addListeners
let listenersAdded = false

cy.stub(util, 'addListeners', function () {
  listenersAdded = true
})

App.start()
expect(listenersAdded).to.be.true
```

***Specify the return value of a stubbed method***

```javascript
// assume App.start calls util.addListeners, which returns a function
// that removes the listeners
const removeStub = cy.stub()

cy.stub(util, 'addListeners').returns(removeStub)

App.start()
App.stop()
expect(removeStub).to.be.called
```

***Using cy.stub***

{% note info %}
{% url "Check out our example recipe testing spying, stubbing and time" stubs-spies-and-clocks-recipe %}
{% endnote %}

## Aliases

Adding an alias using {% url `.as()` as %} to stubs makes them easier to identify in error messages and Cypress' command log.

```javascript
const obj = {
  foo () {}
}
const stub = cy.stub(obj, 'foo').as('anyArgs')
const withFoo = stub.withArgs('foo').as('withFoo')

obj.foo()
expect(stub).to.be.called
expect(withFoo).to.be.called // purposefully failing assertion
```

You will see the following in the command log:

![stubs with aliases](/img/api/stub/stubs-with-aliases-and-error-in-command-log.png)

# Notes

## Restores

***Automatic reset/restore between tests***

`cy.stub()` creates stubs in a {% url "sandbox" http://sinonjs.org/releases/v2.0.0/sandbox/ %}, so all stubs created are automatically reset/restored between tests without you having to explicitly reset/restore them.

## Differences

***Difference between cy.spy() and cy.stub()***

The main difference between `cy.spy()` and {% url `cy.stub()` stub %} is that `cy.spy()` does not replace the method, it only wraps it. So, while invocations are recorded, the original method is still called. This can be very useful when testing methods on native browser objects. You can verify a method is being called by your test and still have the original method action invoked.

# Rules

## Requirements {% helper_icon requirements %}

{% requirements parent cy.stub %}

## Assertions {% helper_icon assertions %}

{% assertions none cy.stub %}

## Timeouts {% helper_icon timeout %}

{% timeouts none cy.stub %}

# Command Log

***Create a stub, alias it, and call it***

```javascript
const obj = {
  foo () {}
}
const stub = cy.stub(obj, 'foo').as('foo')
obj.foo('foo', 'bar')
expect(stub).to.be.called
```

The command above will display in the command log as:

![Command Log](/img/api/stub/stub-in-command-log.png)

When clicking on the `(stub-1)` event within the command log, the console outputs the following:

![Command Log](/img/api/stub/inspect-the-stubbed-object-and-any-calls-or-arguments-made.png)

# See also

- {% url `.as()` as %}
- {% url `cy.clock()` clock %}
- {% url `cy.spy()` spy %}
- {% url 'Guide: Stubs, Spies and Clocks' stubs-spies-and-clocks %}
- {% url "Recipe: Controlling Behavior with Spies, Stubs, and Clocks" stubs-spies-and-clocks-recipe %}
- {% url "Recipe: Unit Test - Stubbing Dependencies" unit-testing-recipe %}
