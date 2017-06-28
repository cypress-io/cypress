---
title: Why Cypress?
comments: false
---

{% note info %}
# {% fa fa-graduation-cap %} What You'll Learn

- Who Cypress is for and what can be done with Cypress
- What benefits Cypress can bring to your team
- What tradeoffs Cypress makes
{% endnote %}

# Who is Cypress For

Typically, our users are developers or QA engineers building web applications using modern JavaScript frameworks, although you can use Cypress to test *anything that runs in a web browser*. Cypress enables you to write:

- End to end tests
- Integration tests
- Unit tests

...all of which run directly in the browser.

Cypress is an open source, {% url "locally installed" installing-cypress %} testing tool *and* a value-added service for {% url 'continuous integration' continuous-integration %}.

- **First:** Cypress is easy to setup and useful for writing tests *every day* as you build your application locally. TDD at its best!
- **Later:** After {% url "integrating Cypress with your CI Provider" continuous-integration %}, the  {% url 'Dashboard' features %} records your test runs and presents the results so you never have to ask, "Why did this fail?".

# Features

## Setup Tests

- **Automate your workflow.** Drive your application with automated tests instead of manually verifying that your app works.
- **Get started in minutes.** Don't spend days setting up a test environment. Just {% url "download our desktop app" installing-cypress %}, {% url "add your project" testing-your-app#Adding-Your-Project %} and {% url "start testing" writing-your-first-test %}!
- **No changes to your code.** You don't need to change your code and Cypress doesn't need to modify your code.
- **Works with all languages & frameworks.** Test in any major language or framework. Does your app run in a browser? Yes? You can test it in Cypress.
- **No Dependencies.** There's no need to download Selenium, Webdriver, Node, or any other code dependencies to get your tests up and running.
- **ES2015 Friendly:** Write modern code with zero configuration.

{% img /img/guides/setup-tests-graphic.jpg %}

## Run Tests

- **Real-time command execution.** Cypress automatically reloads whenever you make changes. See commands execute in real-time in your app.
- **Clear visibility.** Testing through a console obscures what caused failures. Cypress runs in the browser with your application always visible.
- **Easily Debug.** Debug directly from familiar tools like [Chrome DevTools](https://developer.chrome.com/devtools). Our readable errors and stack traces make debugging lightning fast.
- **No more async hell.** Handling complicated asynchronous logic in most SPAs is a nightmare. Not in Cypress. {% url "We utilize Promises for simple async testing." introduction-to-cypress#Commands-Are-Asynchronous %}
- **Time Travel Snapshots:**{% url "Time travel to any command" overview-of-the-gui %}; step back through every test.
- **Automatic waiting.** Never add waits or sleeps to your tests. {% url "Cypress automatically waits for commands and assertions before moving on." introduction-to-cypress#Default-Assertions %}"
- **Intelligent network requests.** {% url "Handling AJAX/XHR is ridiculously simple." network-requests %} Our extensible API lets you control every aspect of every {% url "request" route %}. Easily mock edge cases or isolate from the back-end completely.
- **Simple API.** Every method is in clear English. {% url "Every command" api %}  uses a familiar API to locate and verify elements on a page.
- **Blazing Fast Runs:** Tests run as fast as your application and server can deliver the content.

{% img /img/guides/run-tests-graphic.jpg %}

## Maintain Tests

- **Consistent Results.** Our architecture runs {% url "inside the browser" launching-browsers %} instead of blindly driving actions outside of the browser like Selenium. This means less brittle, flaky tests.
- **Continuous Integration Support.** Know as soon as there's a failure by {% url "using Cypress in CI" continuous-integration %}. Cypress supports {% url "TravisCI" https://travis-ci.org/ %}, {% url "Jenkins" https://jenkins.io/ %}, {% url "CircleCI" https://circleci.com/ %}, {% url "Codeship" https://codeship.com/ %}, and more.
- **Screenshots & Videos:** {% url "View screenshots taken when tests fail" runs %} or {% url "watch a video of your entire headless test run" runs %}.
- **Cypress {% fa fa-heart %}'s Open Source** We're free for open source projects and {% url "many of our tools are open source" https://github.com/cypress-io/cypress %} with constant improvements in our roadmap.
- **Excellent Support.** Get stuck? We're here to help you. {% open_an_issue "Open an issue" %}, join us in {% url "our Gitter chat" https://gitter.im/cypress-io/cypress %}, [email us](mailto:support@cypress.io), or {% url "ask a question on Stackoverflow" https://stackoverflow.com/search?q=cypress.io %}.

{% img /img/guides/maintain-tests-graphic.jpg %}

# Trade Offs

- **One Superdomain Per Test:** Cypress cannot navigate between multiple superdomains *inside a single test*.
- **One Browser Window Per Test:** Cypress cannot control multiple browsers simultaneously.
- **Not a Web Crawler:** Cypress is not intended to be a general automation tool.
- **Not Ideal for Live Apps:** Cypress is best when integrated during development, it isn't best for testing a live website.
- **Developer-focused:** Users of Cypress must understand (and probably should be able to modify) the app under test.
