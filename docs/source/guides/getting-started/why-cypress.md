---
title: Why Cypress?
comments: false
---

{% note info %}
# {% fa fa-graduation-cap %} What You'll Learn

- How we think differently about testing the modern web
- What benefits Cypress can bring to your team
- What tradeoffs Cypress makes
{% endnote %}

# Modern Web Testing with Cypress

Welcome to Cypress: the next-generation testing tool for front-end professionals!

Typically, our users are developers or QA engineers building web applications using modern JavaScript frameworks. Cypress enables us to write:

- End to end tests
- Integration tests
- Unit tests

...all of which run in the browser.

Cypress is an open source local testing tool *and* a value-added service for {% url 'continuous integration' continuous-integration %}.

- **First:** Cypress is useful to write tests *every day* as you build your application locally (you can even use TDD if you prefer).
- **Later:** Once you've integrated Cypress with your CI Provider, the  {% url 'Dashboard' features %} records your test runs and clearly presents the results so we never have to ask, "Why did this fail?".

Cypress is most often compared to [**Selenium**](http://www.seleniumhq.org/); however, Cypress is fundamentally and architecturally different. Cypress is not bound by the same restrictions as Selenium. Cypress enables us to write faster, more reliable tests that achieve *much more* test coverage. Cypress fundamentally shifts the way we test and build web applications.

## Features
- **Familiar Tools:** built on the shoulders of giants such as [**Mocha**](https://mochajs.org/), [**Chai**](http://chaijs.com/), [**Sinon**](http://sinonjs.org/), and [**Electron**](https://electron.atom.io/).
- **Extensive APIs:** offers 80+ commands to intuitively drive the browser like a user.
- **Network Stubbing:** easily mock edge cases or isolate from the back-end completely.
- **Developer Focused:** plugs directly into our existing development workflow.
- **Screenshots / Videos:** great, visual feedback for failures, great for headless runs.
- **Obvious Errors:** see exactly *what* went wrong and, more importantly, *why*.
- **Dev Tools / Debugger:** you can use all of your favorite developer tools while you test.
- **Time Travel Snapshots:** time travel to any command; step back through every test.
- **Fast Setup:** get up and running with no additional installation required.
- **Blazing Fast Runs:** tests run as fast as our server can deliver the content.
- **ES2015 Friendly:** write modern code with zero configuration.

## Trade Offs

- **One Superdomain Per Test:** Cypress cannot navigate between multiple superdomains per test.
- **One Browser Window Per Test:** Cypress cannot control multiple browsers simultaneously.
- **Not a Web Crawler:** Cypress is not intended to be a general automation tool.
- **Not Ideal for Live Apps:** Cypress is best when integrated during development, it isn't best for testing a live site.
- **Developer-focused:** Users of Cypress must understand (and probably be able to modify) the app under test.
