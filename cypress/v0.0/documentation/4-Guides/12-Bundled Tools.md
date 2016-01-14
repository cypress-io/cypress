excerpt: Tools used in Cypress
slug: bundled-tools

Cypress bundles together a familiar set of tools and builds heavily on them. Much of the Cypress API is rooted in the path these tools have paved.

## Mocha

[Mocha docs](http://mochajs.org/)

Cypress has adopted Mocha's `bdd` syntax, which fits perfectly with both integration and unit testing. All of the tests you'll be writing sit on the fundamental harness Mocha provides namely:

* describe
* context
* it
* before
* beforeEach
* afterEach
* after

Additionally Mocha gives us excellent `async` support, along with support for using `it.only` to run a single test. Cypress has extended Mocha, sanding off the rough edges, weird edge cases, bugs, and error messages. These fixes are all completely transparent.

## Chai

[Chai docs](http://chaijs.com/)

While Mocha provides us a framework to structure our tests, `chai` gives us the ability to easily write assertions. Chai gives us very readable assertions with excellent error messages. Cypress extends this, fixes several common pitfalls, and wraps `chai's` DSL using [subjects](http://on.cypress.io/guides/making-assertions) and the [should](http://on.cypress.io/api/should) command.

## Chai-jQuery

[Chai-jQuery docs](https://github.com/chaijs/chai-jquery)

When writing integration tests, you will work endlessly with the DOM. Cypress brings in `chai-jquery`, which automatically extends `chai` with specific `jquery` chainer methods.

## Sinon

[Sinon docs](http://sinonjs.org/)

When writing unit tests, or even in integration-like tests, you'll regularly need to ability to `stub` and `spy` methods. Additionally `sinon` brings in the ability to stop or accelerate time, and create fake servers. Cypress passes on some of `sinons` API without modifying it, but Cypress has built an entire layer on the concept of [creating servers and routing](http://on.cypress.io/guides/network-requests-xhr) on the client.

Dealing with AJAX/XHR's on the client has traditionally been extremely difficult to manage. Cypress provides an incredibly easy yet powerful API for managing the request/response lifecycle.

## Sinon-Chai

[Sinon-Chai docs](https://github.com/domenic/sinon-chai)

When working with `stubs` or `spies` you'll regularly want to use those when writing `chai` assertions. Cypress bundles in `sinon-chai` which extends `chai` allowing you to write assertions about these `stubs` and `spies`.

## Sinon-As-Promised

[Sinon-As-Promised docs](https://github.com/bendrucker/sinon-as-promised)

`sinon-as-promised` gives you the ability to stub methods which return `Promises`. To fulfill the async contract of these methods, you'll use `sinon-as-promised` to force these methods to easily `resolve` or `reject` at your discretion.

## Utilities

Cypress also bundles the following other tools on the `cy` object. These can be used anywhere inside of your tests.

- [cy._](underscore)  (Underscore)
- [cy.$](jquery) (jQuery)
- [cy.Promise](promise) (Bluebird)
- [cy.moment](moment) (moment.js)
- [cy.Blob](blob) (blob utils)