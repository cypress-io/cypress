slug: stub
excerpt: Create a stub and/or replace a function with a stub

A stub is used to replace a function, record its usage and control its behavior. You can track calls to the functions and what arguments the function was called with. You can also control what the function returns and even cause it to throw an exception.

`cy.stub` returns a [sinon.js stub](http://sinonjs.org/docs/#stubs). All methods found on sinon.js spies and stubs are supported. `cy.stub` creates stubs in a [sandbox](http://sinonjs.org/docs/#sandbox), so all stubs created are automatically reset/restored between tests without you having to explicitly reset/restore them.

Cypress has built-in [sinon-as-promised](https://github.com/bendrucker/sinon-as-promised) support, so the stubs returned by `cy.stub` supports the `.resolves` and `.rejects` API provided by `sinon-as-promised`.

Cypress also has built-in [sinon-chai](https://github.com/domenic/sinon-chai) support, so any [assertions](https://github.com/domenic/sinon-chai#assertions) supported by `sinon-chai` can be used without any configuration.

Unlike most Cypress commands, `cy.stub` is *synchronous* and returns a value (the stub) instead of a Promise-like chain-able object.

| | |
|--- | --- |
| **Returns** | the stub |

***

# [cy.stub()](#usage)

Creates and returns a stub. See the [sinon.js stub docs](http://sinonjs.org/docs/#stubs) for methods on the stub.

***

# [cy.stub( *object*, *"method"* )](#replace-a-method-with-a-stub)

Replaces the `method` on the `object` with a stub and returns the stub. See the [sinon.js stub docs](http://sinonjs.org/docs/#stubs) for methods on the stub.

***

# [cy.stub( *object*, *"method"*, replacerFn )](#replace-a-method-with-a-function)

Replaces the `method` on the `object` with the `replacerFn` wrapped in a spy.See the [sinon.js spy docs](http://sinonjs.org/docs/#spies) for methods on the spy.

***

# Usage

## Create a stub and manually replace a function

```javascript
// assume App.start calls util.addListeners
util.addListeners = cy.stub()
App.start()
expect(util.addListeners).to.be.called
```

***

## Replace a method with a stub

```javascript
// assume App.start calls util.addListeners
cy.stub(util, "addListeners")
App.start()
expect(util.addListeners).to.be.called
```

***

## Replace a method with a function

```javascript
// assume App.start calls util.addListeners
let listenersAdded = false
cy.stub(util, "addListeners", function () {
  listenersAdded = true
})
App.start()
expect(listenersAdded).to.be.true
```

***

## Specify the return value of a stubbed method

```javascript
// assume App.start calls util.addListeners, which returns a function
// that removes the listeners
const removeStub = cy.stub()
cy.stub(util, "addListeners").returns(removeStub)
App.start()
App.stop()
expect(removeStub).to.be.called
```

***

## Example Recipe

[block:callout]
{
  "type": "info",
  "body": "[Check out our example recipe testing spying, stubbing and time](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/spy_stub_clock_spec.js)",
  "title": "Using cy.stub"
}
[/block]

***

## Alias a stub

Adding an alias using [`cy.as`](https://on.cypress.io/api/as) to stubs makes them easier to identify in error messages and Cypress's command log.

```javascript
const obj = {
  foo () {}
}
const stub = cy.stub(obj, "foo").as("anyArgs")
const withFoo = stub.withArgs("foo").as("withFoo")
obj.foo()
expect(stub).to.be.called
expect(withFoo).to.be.called // purposefully failing assertion
```

You will see the following in the command log:

![stubs with aliases](https://cloud.githubusercontent.com/assets/1157043/22437243/4cc778a4-e6f5-11e6-8f07-e601d3438c4f.png)

***

# Command Log

## Create a stub, alias it, and call it

```javascript
const obj = {
  foo () {}
}
const stub = cy.stub(obj, "foo").as("foo")
obj.foo("foo", "bar")
expect(stub).to.be.called
```

The command above will display in the command log as:

<img width="454" alt="screen shot of command log" src="https://cloud.githubusercontent.com/assets/1157043/22437473/335f7104-e6f6-11e6-8ee8-74dc21e7d4fa.png">

When clicking on the `(stub-1)` event within the command log, the console outputs the following:

<img width="585" alt="screen shot of console output" src="https://cloud.githubusercontent.com/assets/1157043/22437546/6b01e574-e6f6-11e6-878f-e10c2316d213.png">

***

# Related

- [Guide: Stubs, Spies and Clocks ](https://on.cypress.io/guides/stubs-spies-clocks)
- [Recipe: Controlling Behavior with Spies, Stubs, and Clocks](https://github.com/cypress-io/cypress-example-recipes#controlling-behavior-with-spies-stubs-and-clocks)
- [Recipe: Unit Test - Stubbing Dependencies](https://github.com/cypress-io/cypress-example-recipes#unit-test---stubbing-dependencies)
- [spy](https://on.cypress.io/api/spy)
- [clock](https://on.cypress.io/api/clock)
