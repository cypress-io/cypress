slug: spy
excerpt: Wrap a method in a spy

Wrap a method in a spy in order to record calls to the functions and what arguments the function was called with.

`cy.spy` returns a [sinon.js spy](http://sinonjs.org/docs/#spies). All methods found on sinon.js spies are supported. `cy.spy` creates spies in a [sandbox](http://sinonjs.org/docs/#sandbox), so all spies created are automatically reset/restored between tests without you having to explicitly reset/restore them.

The main difference between `cy.spy` and `cy.stub` is that `cy.spy` does not replace the method, it only wraps it. So while invocations are recorded, the original method is still called. This can be very useful when testing methods on native browser objects. You can verify a method is being called by your code and still have the original method action invoked.

Cypress has built-in [sinon-chai](https://github.com/domenic/sinon-chai) support, so any assertions supported by `sinon-chai` can be used without any configuration.

Unlike most Cypress commands, `cy.spy` is synchronous and returns a value (the spy) instead of a Promise-like chain-able object.

***

# [cy.spy( *object*, *"method"* )](#section-usage)

Wraps the `method` on the `object` with a spy and returns the spy. See the [sinon.js spy docs](http://sinonjs.org/docs/#spies) for methods on the spy.

***

# Usage

## Wrap a method with a spy

```javascript
// assume App.start calls util.addListeners
cy.spy(util, "addListeners")
App.start()
expect(util.addListeners).to.be.called  

```

***

## Alias a spy

Cypress adds a `.as` method to spies, which makes them easier to identify in error messages and Cypress's command log.

```javascript
const obj = {
  foo () {}
}
const spy = cy.spy(obj, "foo").as("anyArgs")
const withFoo = spy.withArgs("foo").as("withFoo")
obj.foo()
expect(spy).to.be.called
expect(withFoo).to.be.called // purposefully failing assertion
```

You will see the following in the command log:

![spies with aliases](https://cloud.githubusercontent.com/assets/1157043/22427271/83d3df42-e6d0-11e6-8785-e0f22448bfe1.png)

***

# Related

- [stub](https://on.cypress.io/api/stub)
- [clock](https://on.cypress.io/api/clock)
