---
title: Bundled Tools
comments: false
---

{% note info %}
Cypress relies on many best-of-breed open source testing libraries to lend stability and familiarity to the platform from the get-go. If you've been testing in JavaScript, you'll recognize many old friends in this list. Understand how we exploit them and hit the ground running with Cypress!

{% endnote %}

# Mocha

{% fa fa-github %} {% url http://mochajs.org/ %}

Cypress has adopted Mocha's `bdd` syntax, which fits perfectly with both integration and unit testing. All of the tests you'll be writing sit on the fundamental harness Mocha provides, namely:

* {% url '`describe()`' http://mochajs.org/#bdd %}
* {% url '`context()`' http://mochajs.org/#bdd %}
* {% url '`it()`' http://mochajs.org/#bdd %}
* {% url '`before()`' http://mochajs.org/#hooks %}
* {% url '`beforeEach()`' http://mochajs.org/#hooks %}
* {% url '`afterEach()`' http://mochajs.org/#hooks %}
* {% url '`after()`' http://mochajs.org/#hooks %}
* {% url '`.only()`' http://mochajs.org/#exclusive-tests %}
* {% url '`.skip()`' http://mochajs.org/#exclusive-tests %}

Additionally, Mocha gives us excellent {% url '`async` support' http://mochajs.org/#asynchronous-code %}. Cypress has extended Mocha, sanding off the rough edges, weird edge cases, bugs, and error messages. These fixes are all completely transparent.

{% note info %}
{% url "Check out our guide to writing and organizing tests." writing-and-organizing-tests %}
{% endnote %}

# Chai

{% fa fa-github %} {% url http://chaijs.com/ %}

While Mocha provides us a framework to structure our tests, Chai gives us the ability to easily write assertions. Chai gives us readable assertions with excellent error messages. Cypress extends this, fixes several common pitfalls, and wraps Chai's DSL using {% url 'subjects' introduction-to-cypress#Assertions %} and the {% url `.should()` should %} command.

> {% fa fa-chevron-right  %} {% url "List of available Chai Assertions" assertions#Chai %}

# Chai-jQuery

{% fa fa-github %} {% url https://github.com/chaijs/chai-jquery %}

When writing integration tests, you will likely work a lot with the DOM. Cypress brings in Chai-jQuery, which automatically extends Chai with specific jQuery chainer methods.

> {% fa fa-chevron-right  %} {% url "List of available Chai-jQuery Assertions" assertions#Chai-jQuery %}

# Sinon

{% fa fa-github %} {% url http://sinonjs.org/ %}

When writing unit tests, or even in integration-like tests, you often need to ability to stub and spy methods. Cypress includes two methods, {% url `cy.stub()` stub %} and {% url `cy.spy()` spy %} that return Sinon stubs and spies, respectively.

{% note info %}
{% url "Check out our guide for working with spies, stubs, and clocks." stubs-spies-and-clocks %}
{% endnote %}

# Sinon-Chai

{% fa fa-github %} {% url https://github.com/domenic/sinon-chai %}

When working with `stubs` or `spies` you'll regularly want to use those when writing Chai assertions. Cypress bundles in Sinon-Chai which extends Chai allowing you to {% url 'write assertions' https://github.com/domenic/sinon-chai %} about `stubs` and `spies`.

> {% fa fa-chevron-right  %} {% url "List of available Sinon-Chai Assertions" assertions#Sinon-Chai %}

# Sinon-As-Promised

{% fa fa-github %} {% url https://github.com/bendrucker/sinon-as-promised %}

Sinon-as-Promised gives you the ability to stub methods that return Promises. To fulfill the async contract of these methods, you would use Sinon-as-Promised to force these methods to easily {% url '`resolve`' https://github.com/bendrucker/sinon-as-promised %} or {% url '`reject`' https://github.com/bendrucker/sinon-as-promised %} at your discretion.

# Other Library Utilities

Cypress also bundles the following tools on the `Cypress` object. These can be used anywhere inside of your tests.

- {% url `Cypress._` _ %} (lodash)
- {% url `Cypress.$` $ %} (jQuery)
- {% url `Cypress.minimatch` minimatch %} (minimatch.js)
- {% url `Cypress.moment` moment %} (moment.js)
- {% url `Cypress.Blob` blob %} (blob utils)
- {% url `Cypress.Promise` promise %} (Bluebird)
