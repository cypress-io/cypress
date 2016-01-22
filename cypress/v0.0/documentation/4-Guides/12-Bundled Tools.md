slug: bundled-tools
excerpt: Cypress bundles together a familiar set of tools and builds heavily on them.

# Contents

- :fa-angle-right: [Mocha](#section-mocha)
- :fa-angle-right: [Chai](#section-chai)
- :fa-angle-right: [Chai-jQuery](#section-chai-jquery)
- :fa-angle-right: [Sinon](#section-sinon)
- :fa-angle-right: [Sinon-Chai](#section-sinon-chai)
- :fa-angle-right: [Sinon-as-Promised](#section-sinon-as-romised)
- :fa-angle-right: [Utilities](#section-utilies)

***

# Mocha

[Mocha docs](http://mochajs.org/)

Cypress has adopted Mocha's `bdd` syntax, which fits perfectly with both integration and unit testing. All of the tests you'll be writing sit on the fundamental harness Mocha provides, namely:

* [describe()](https://mochajs.org/#bdd)
* [context()](https://mochajs.org/#bdd)
* [it()](https://mochajs.org/#bdd)
* [before()](https://mochajs.org/#hooks)
* [beforeEach()](https://mochajs.org/#hooks)
* [afterEach()](https://mochajs.org/#hooks)
* [after()](https://mochajs.org/#hooks)
* [.only()](https://mochajs.org/#exclusive-tests)
* [.skip()](https://mochajs.org/#inclusive-tests)

Additionally, Mocha gives us excellent [`async` support](https://mochajs.org/#asynchronous-code). Cypress has extended Mocha, sanding off the rough edges, weird edge cases, bugs, and error messages. These fixes are all completely transparent.

***

# Chai

[Chai docs](http://chaijs.com/)

While Mocha provides us a framework to structure our tests, Chai gives us the ability to easily write assertions. Chai gives us readable assertions with excellent error messages. Cypress extends this, fixes several common pitfalls, and wraps Chai's DSL using [subjects](https://on.cypress.io/guides/making-assertions) and the [cy.should](https://on.cypress.io/api/should) command.

***

# Chai-jQuery

[Chai-jQuery docs](https://github.com/chaijs/chai-jquery)

When writing integration tests, you will likely work a lot with the DOM. Cypress brings in Chai-jQuery, which automatically extends Chai with specific jQuery chainer methods.

***

# Sinon

[Sinon docs](http://sinonjs.org/)

When writing unit tests, or even in integration-like tests, you often need to ability to [`stub`](http://sinonjs.org/docs/#stubs) and [`spy`](http://sinonjs.org/docs/#spies) methods. Sinon brings in the ability to [`stub`](http://sinonjs.org/docs/#stubs) and [`spy`](http://sinonjs.org/docs/#spies) methods, [stop or accelerate time](http://sinonjs.org/docs/#clock), and create [fake servers](http://sinonjs.org/docs/#fakeServer). Cypress passes on some of Sinons' API without modifying it, but Cypress has also built an entire layer for [creating servers and routing](https://on.cypress.io/guides/network-requests-xhr) on the client.

Dealing with AJAX/XHR's on the client has traditionally been very difficult to manage. Cypress provides an easy yet powerful API for managing the request/response lifecycle.

***

# Sinon-Chai

[Sinon-Chai docs](https://github.com/domenic/sinon-chai)

When working with `stubs` or `spies` you'll regularly want to use those when writing Chai assertions. Cypress bundles in Sinon-Chai which extends Chai allowing you to [write assertions](https://github.com/domenic/sinon-chai#assertions) about `stubs` and `spies`.

***

# Sinon-As-Promised

[Sinon-As-Promised docs](https://github.com/bendrucker/sinon-as-promised)

Sinon-as-Promised gives you the ability to stub methods that return Promises. To fulfill the async contract of these methods, you would use Sinon-as-Promised to force these methods to easily [`resolve`](https://github.com/bendrucker/sinon-as-promised#stubresolvesvalue---stub) or [`reject`](https://github.com/bendrucker/sinon-as-promised#stubrejectserr---stub) at your discretion.

***

# Utilities

Cypress also bundles the following tools on the `cy` object. These can be used anywhere inside of your tests.

- [cy._](https://on.cypress.io/api/underscore) (Underscore)
- [cy.$](https://on.cypress.io/api/jquery) (jQuery)
- [cy.moment](https://on.cypress.io/api/moment) (moment.js)
- [cy.Blob](https://on.cypress.io/api/blob) (blob utils)
- [cy.Promise](https://on.cypress.io/api/promise) (Bluebird)