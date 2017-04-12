slug: spy
excerpt: Wrap a method in a spy

Wrap a method in a spy in order to record calls to the functions and what arguments the function was called with.

`cy.spy` returns a [Sinon.js spy](http://sinonjs.org/docs/#spies). All [methods](http://sinonjs.org/docs/#spies-api) found on Sinon.JS spies are supported. `cy.spy` creates spies in a [sandbox](http://sinonjs.org/docs/#sandbox), so all spies created are automatically reset/restored between tests without you having to explicitly reset/restore them.

The main difference between `cy.spy` and [`cy.stub`](https://on.cypress.io/api/stub) is that `cy.spy` does not replace the method, it only wraps it. So, while invocations are recorded, the original method is still called. This can be very useful when testing methods on native browser objects. You can verify a method is being called by your test and still have the original method action invoked.

Cypress has also built-in [sinon-chai](https://github.com/domenic/sinon-chai) support, so any [assertions](https://github.com/domenic/sinon-chai#assertions) supported by `sinon-chai` can be used without any configuration.

Unlike most Cypress commands, `cy.spy` is *synchronous* and returns a value (the spy) instead of a Promise-like chain-able object.

| | |
|--- | --- |
| **Returns** | the spy |

***

# [cy.spy( *object*, *"method"* )](#usage)

Wraps the `method` on the `object` with a spy and returns the spy. See the [sinon.js spy docs](http://sinonjs.org/docs/#spies) for [methods](http://sinonjs.org/docs/#spies-api) on the spy.

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

## Example Recipe

[block:callout]
{
  "type": "info",
  "body": "[Check out our example recipe testing spying, stubbing and time](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/spy_stub_clock_spec.js)",
  "title": "Using cy.spy"
}
[/block]

***

## Alias a spy

Adding an alias using [`cy.as`](https://on.cypress.io/api/as) to spies makes them easier to identify in error messages and Cypress's command log.

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

![spies with aliases](https://cloud.githubusercontent.com/assets/1157043/22437291/805bd0d4-e6f5-11e6-99c5-bded81b9c42b.png)

***

# Command Log

## Create a spy, alias it, and call it

```javascript
const obj = {
  foo () {}
}
const spy = cy.spy(obj, "foo").as("foo")
obj.foo("foo", "bar")
expect(spy).to.be.called
```

The command above will display in the command log as:

<img width="454" alt="screen shot of command log" src="https://cloud.githubusercontent.com/assets/1157043/22437713/1d5f7be6-e6f7-11e6-9457-f35cbeaa5385.png">

When clicking on the `spy-1` event within the command log, the console outputs the following:

<img width="585" alt="screen shot of console output" src="https://cloud.githubusercontent.com/assets/1157043/22437712/1d5ed1e6-e6f7-11e6-9808-e61936b1d75f.png">

***

# Related

- [Guide: Stubs, Spies and Clocks ](https://on.cypress.io/guides/stubs-spies-clocks)
- [Recipe: Controlling Behavior with Spies, Stubs, and Clocks](https://github.com/cypress-io/cypress-example-recipes#controlling-behavior-with-spies-stubs-and-clocks)
- [stub](https://on.cypress.io/api/stub)
- [clock](https://on.cypress.io/api/clock)
