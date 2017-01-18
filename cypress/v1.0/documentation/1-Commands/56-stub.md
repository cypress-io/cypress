slug: stub
excerpt: Create a stub and/or replace a function with a stub

A stub is used to replace a function and both records its usage and control its behavior. You can track calls to the functions and what arguments the function was called with. You can also control what the function returns and even cause it to throw an exception.

`cy.stub` returns a [sinon.js stub](http://sinonjs.org/docs/#stubs). All methods found on sinon.js spies and stubs are supported. `cy.stub` creates stubs in a [sandbox](http://sinonjs.org/docs/#sandbox), so all stubs created are automatically reset/restored between tests without you having to explicitly reset/restore them.

Cypress has built-in [sinon-as-promised](https://github.com/bendrucker/sinon-as-promised) support, so the stubs returned by `cy.stub` support the `.resolves` and `.rejects` API provided by `sinon-as-promised`.

Cypress also has built-in [sinon-chai](https://github.com/domenic/sinon-chai) support, so any assertions supported by `sinon-chai` can be used without any configuration.


Unlike most Cypress commands, `cy.stub` is synchronous and returns a value (the stub) instead of a Promise-like chain-able object.

***

# [cy.stub()](#section-usage)

Creates and returns a stub. See the [sinon.js stub docs](http://sinonjs.org/docs/#stubs) for methods on the stub.

***

# [cy.stub( *object*, *"method"* )](#section-two-arguments)

Replaces the `method` on the `object` with a stub and returns the stub. See the [sinon.js stub docs](http://sinonjs.org/docs/#stubs) for methods on the stub.

***

# [cy.stub( *object*, *"method"*, replacerFn )](#section-three-arguments)

Replaces the `method` on the `object` with the `replacerFn` wrapped in a spy.See the [sinon.js spy docs](http://sinonjs.org/docs/#spies) for methods on the spy.

***

# Usage

## Create a stub and manually replace a function

```javascript
cy.window().then((win) => {
  win.reload = cy.stub()
  // ...some action that triggers window.reload() in app...
  expect(win.reload).to.be.called  
})
```

## Replace a method with a stub

```javascript
cy.window().then((win) => {
  cy.stub(win, "reload")
  // ...trigger action that triggers window.reload() in app...
  expect(win.reload).to.be.called  
})
```

## Replace a method with a function

```javascript
cy.window().then((win) => {
  let reloadCalled = false
  cy.stub(win, "reload", function () {
    reloadCalled = true
  })
  // ...trigger action that triggers window.reload() in app...
  expect(reloadCalled).to.be.true
})
```

***

# Related

- [spy](https://on.cypress.io/api/spy)
- [clock](https://on.cypress.io/api/clock)
