slug: stubs-spies-clocks
excerpt: Learn about when and why to use stubs, spies, and control clock time

# Contents

- :fa-angle-right: [Capabilities](#section-capabilities)
- :fa-angle-right: [Libraries and Tools](#section-libraries-and-tools)
- :fa-angle-right: [Common Scenarios](#section-common-scenarios)
  - [Stubs](#section-stubs)
  - [Spies](#section-spies)
  - [Clock](#section-clock)
  - [Assertions](#section-assertions)
- :fa-angle-right: [Integration and Extensions](#section-integration-and-extensions)

***

# Capabilities

Cypress comes built in with the ability to `stub`, `spy` or modify your applications `clock` - such as controlling `Date`, `setTimeout`, and `setInterval`.

These commands are useful when writing both **unit tests** and **integration tests**.

***

# Libraries and Tools

Cypress automatically bundles and wraps these libraries:

| Name | What it does |
| --- | ---- |
| [`sinon`](http://sinonjs.org) | provides the `stub` and `spy` API's |
| [`lolex`](https://github.com/sinonjs/lolex) | provides the `clock` and `tick` API's |
| [`sinon-as-promised`](https://github.com/bendrucker/sinon-as-promised) | makes it easy to stub `Promise` returning functions |
| [`sinon-chai`](https://github.com/domenic/sinon-chai) | adds `chai` assertions for stubs and spies |

You can refer to each of these libraries documentation for more examples and explanations.

***

# Common Scenarios

## Stubs

A stub is a way to modify a function and force its behavior to be controlled by you (the programmer).

A stub is most commonly used in a unit test but is still useful during an integration / e2e test.

```javascript
cy.stub() // create a standalone stub (generally for use in unit test)
cy.stub(obj, "method") // replace obj.method() with a stubbed function
cy.stub(obj, "method").returns("foo") // force obj.method() to return "foo"
cy.stub(obj, "method").withArgs("bar").returns("foo") // force obj.method() when called with "bar" argument to return "foo"
cy.stub(obj, "method").resolves("foo") // force obj.method() to return a promise which resolves to "foo"
cy.stub(obj, "method").rejects(new Error("foo")) // force obj.method() to return a promise rejected with an error
```

You generally stub a function when it has side effects you are trying to control.

**Common Scenarios:**

- You have an function that accepts a callback, and want to invoke the callback
- Your function returns a Promise, and you want to automatically resolve or reject it
- You have a function that wraps `window.location` and don't want your application to be navigated
- You're trying to test your applications "failure path" by forcing things to fail
- You're trying to test your applications "happy path" by forcing things to pass
- You want to "trick" your application into thinking its logged in / logged out
- You're using `oauth` and want to stub login methods

***

## Spies

A spy gives you the ability to "spy" on a function, by being able to capture and then assert it was calling with the right arguments, or it was called a certain number of times, or even what the return value or context the function was called with.

A spy does **not** modify the behavior of the function - it is left perfectly intact. A spy most useful when you are testing the contract between multiple functions and you don't care about the side effects the real function may create (if any).

```javascript
cy.spy(obj, "method")
```

***

## Clock

There are situations when it is useful to control your applications notion of both `date` and `time` in order to force its behavior and avoid slow tests.

`cy.clock` gives you the ability to control:

- `Date`
- `setTimeout`
- `setInterval`

**Common Scenarios:**

- You're polling something in your application with `setInterval` and want to control that
- You have **throttled** or **debounced** functions which you want to control

Once you've enabled `cy.clock` you can then control time by **ticking** it ahead by milliseconds.

```javascript
cy
  .clock()
  .visit("http://localhost:3333")
  .get("#search").type("foobarbaz")
  .tick(1000)
```

`cy.clock` is special in that it can be called **prior** to visiting your application, and we will automatically bind it to the application on the next visit. We bind **before** any timers from your application can be invoked. This works identically to `cy.server` + `cy.route`.

***

## Assertions

Once you have a `stub` or a `spy` in hand, you can then create assertions about them.

```javascript
const obj = {
  foo: function(arg){
    return arg
  },

  bar: function(arg){
    return arg
  },

  fail: function(){
    throw new Error("fail whale")
  }
}

// force obj.foo() to return "quux"
cy.stub(obj, "foo").returns("quux")

// spy on bar but do not change its behavior
cy.spy(obj, "bar")

// spy on fail but do not change its behavior
cy.spy(obj, "fail")

const ret  = obj.foo("123") // invoke foo
const ret2 = obj.bar("123") // invoke bar

try {
  // invoke fail
  obj.fail()
} catch (e) {

}

expect(ret).to.eq("quux") // true
expect(obj.foo).to.be.calledOnce // true
expect(obj.foo).not.to.be.calledTwice // true
expect(obj.foo).to.be.calledWith("123")
expect(obj.foo).to.be.calledMatch(/1/) // true
expect(obj.foo).to.be.calledOn(obj) // true

expect(ret2).to.eq("123") // true
expect(obj.bar).to.be.calledWith("123") // true
expect(obj.bar).to.have.returned("123") // true

expect(obj.fail).to.have.thrown("fail whale") // true
```

***

# Integration and Extensions

Beyond just integrating these tools together we have also extended and improved the collaboration of these tools.

Some examples:

- We replaced `sinons` argument stringifier for a much less noisy, more performant custom version
- We improved the `sinon-chai` assertion output by changing what displays during a passing vs failing test
- We've added aliasing support to `stub` and `spy` API's
- We automatically restore and teardown `stub`, `spy`, and `clock` between tests

We also integrated all of these API's directly into the Command Log so you can visually see what's happening in your application.

We visually indicate when:

- A `stub` is called
- A `spy` is called
- A `clock` is ticked

(image here)

When you take advantage of the new `.as(alias)` method which has been added to stubs and spies we also coorelate those aliases with the calls. This works identically to  aliasing a `cy.route`.

(image here)

When stubs are created by calling the method `.withArgs(...)` we also visually link these together.

(image here)

When you click on a stub or spy we also output **incredibly** helpful debugging information.

For instance we automatically:

- Display the call count (and total number of calls)
- Display the arguments without transforming them (they are the real arguments)
- Display the return value of the function
- Display the context the function was invoked with

(image here)
