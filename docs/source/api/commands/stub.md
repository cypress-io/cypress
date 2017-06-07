---
title: stub
comments: true
---

Replace a function, record its usage and control its behavior.

# Syntax

```javascript
cy.stub()
cy.stub(object, method)
cy.stub(object, method, replacerFn)
```

## Usage

`cy.stub()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Valid Usage**

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

## Yields

Unlike most Cypress commands, `cy.stub()` is *synchronous* and returns a value (the stub) instead of a Promise-like chain-able object.

`cy.stub()` returns a [Sinon.js stub](http://sinonjs.org/docs/#stubs). All methods found on Sinon.JS [spies](http://sinonjs.org/docs/#spies-api) and [stubs](http://sinonjs.org/docs/#stubs-api) are supported.

## Timeout

# Examples

## Stub

**Create a stub and manually replace a function**

```javascript
// assume App.start calls util.addListeners
util.addListeners = cy.stub()

App.start()
expect(util.addListeners).to.be.called
```

**Replace a method with a stub**

```javascript
// assume App.start calls util.addListeners
cy.stub(util, 'addListeners')

App.start()
expect(util.addListeners).to.be.called
```

**Replace a method with a function**

```javascript
// assume App.start calls util.addListeners
let listenersAdded = false

cy.stub(util, 'addListeners', function () {
  listenersAdded = true
})

App.start()
expect(listenersAdded).to.be.true
```

**Specify the return value of a stubbed method**

```javascript
// assume App.start calls util.addListeners, which returns a function
// that removes the listeners
const removeStub = cy.stub()

cy.stub(util, 'addListeners').returns(removeStub)

App.start()
App.stop()
expect(removeStub).to.be.called
```

**Using cy.stub**

{% note info %}
[Check out our example recipe testing spying, stubbing and time](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/spy_stub_clock_spec.js)
{% endnote %}

## Alias a stub

Adding an alias using [`.as()`](https://on.cypress.io/api/as) to stubs makes them easier to identify in error messages and Cypress' command log.

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

![stubs with aliases](https://cloud.githubusercontent.com/assets/1157043/22437243/4cc778a4-e6f5-11e6-8f07-e601d3438c4f.png)

# Notes

**Automatic reset/restore between tests**

`cy.stub()` creates stubs in a [sandbox](http://sinonjs.org/docs/#sandbox), so all stubs created are automatically reset/restored between tests without you having to explicitly reset/restore them.

**Difference between cy.spy() and cy.stub()**

The main difference between `cy.spy()` and [`cy.stub()`](https://on.cypress.io/api/stub) is that `cy.spy()` does not replace the method, it only wraps it. So, while invocations are recorded, the original method is still called. This can be very useful when testing methods on native browser objects. You can verify a method is being called by your test and still have the original method action invoked.

**Assertion Support**

Cypress has built-in [sinon-as-promised](https://github.com/bendrucker/sinon-as-promised) support, so the stubs returned by `cy.stub()` supports the `.resolves` and `.rejects` API provided by `sinon-as-promised`.

# Command Log

**Create a stub, alias it, and call it**

```javascript
const obj = {
  foo () {}
}
const stub = cy.stub(obj, 'foo').as('foo')
obj.foo('foo', 'bar')
expect(stub).to.be.called
```

The command above will display in the command log as:

<img width="454" alt="screen shot of command log" src="https://cloud.githubusercontent.com/assets/1157043/22437473/335f7104-e6f6-11e6-8ee8-74dc21e7d4fa.png">

When clicking on the `(stub-1)` event within the command log, the console outputs the following:

<img width="585" alt="screen shot of console output" src="https://cloud.githubusercontent.com/assets/1157043/22437546/6b01e574-e6f6-11e6-878f-e10c2316d213.png">

# See also

- [as](https://on.cypress.io/api/as)
- [clock](https://on.cypress.io/api/clock)
- [Guide: Stubs, Spies and Clocks ](https://on.cypress.io/guides/stubs-spies-clocks)
- [Recipe: Controlling Behavior with Spies, Stubs, and Clocks](https://github.com/cypress-io/cypress-example-recipes#controlling-behavior-with-spies-stubs-and-clocks)
- [Recipe: Unit Test - Stubbing Dependencies](https://github.com/cypress-io/cypress-example-recipes#unit-test---stubbing-dependencies)
- [spy](https://on.cypress.io/api/spy)
