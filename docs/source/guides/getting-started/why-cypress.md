---
title: Why Cypress?
comments: false
---

{% note info %}
# {% fa fa-graduation-cap %} What You'll Learn

- How we think differently about testing the modern web
- What benefits Cypress can bring for your team
- What tradeoffs Cypress makes
{% endnote %}

# Cypress in 10 Minutes

![Cypress in 10 Minutes](http://placehold.it/1920x1080)

Welcome to Cypress: the next-generation testing tool for front-end professionals!

Typically, our users are developers or QA engineers building web applications using modern JavaScript frameworks. Cypress enables us to write **end to end tests**, **integration tests**, and **unit tests**, all of which run in the browser.

Cypress is at once an open source local testing tool *and* a value-added service for continuous integration. At first, we use Cypress to write tests **every day** as we build our application locally (we can even use TDD if we prefer). Later, once we've integrated Cypress with our CI Provider, the [Cypress Dashboard](https://on.cypress.io/dashboard-features) records our test runs and clearly presents the results so we never have to ask, "Why did this fail?"

Cypress is most often compared to [**Selenium**](http://www.seleniumhq.org/); however, Cypress is both fundamentally and architecturally different. Cypress is not bound by the same restrictions as Selenium. Cypress enables us to write faster, more reliable tests that achieve **much more** test coverage. Cypress fundamentally shifts the way we test and build web applications.

## Features
- **Familiar Tools:** built on the shoulders of such giants as [**Mocha**](https://mochajs.org/), [**Chai**](http://chaijs.com/), [**Sinon**](http://sinonjs.org/), and [**Electron**](https://electron.atom.io/)
- **Extensive APIs:** offers 80+ commands to intuitively drive the browser like a user
- **Network Stubbing:** easily mock edge cases; or, isolate from the back-end completely
- **Developer Focused:** plugs directly into our existing development workflow
- **Screenshots / Videos:** great, visual feedback for failures, great for headless runs
- **Obvious Errors:** see exactly *what* went wrong and, more importantly, *why*
- **Dev Tools / Debugger:** we can use all of our favorite developer tools while we test
- **Time Travel Snapshots:** time travel to any command; step back through every test
- **Fast Setup:** get up and running with no additional installation required
- **Blazing Fast Runs:** tests run as fast as our server can deliver the content
- **ES2015 Friendly:** write modern code with zero configuration

## Trade Offs

- **One Superdomain Per Test:** Cypress cannot navigate between multiple superdomains per test
- **One Browser Window Per Test:** Cypress cannot control multiple browsers simultaneously
- **Not a Web Crawler:** Cypress is not a general automation tool
- **Not Ideal for Live Apps:** Cypress is best when integrated during development, it isn't for testing a live site
- **Developer-focused:** Users of Cypress must understand (and probably be able to modify) the app under test
