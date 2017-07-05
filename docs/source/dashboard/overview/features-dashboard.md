---
title: The Cypress Dashboard
comments: false
---

The {% url 'Cypress Dashboard' https://on.cypress.io/dashboard %} is a service we've created that gives you access to recorded tests - typically when running Cypress tests from your {% url 'CI provider' continuous-integration %}. The Dashboard provides you insight into what happened when your tests ran.

{% img /img/guides/maintain-tests.gif %}

# Overview

***The Dashboard allows you to:***

- See the number of failed, pending and passing tests.
- Get the entire stack trace of failed tests.
- View screenshots taken when tests fail and when using {% url `cy.screenshot()` screenshot %}.
- Watch a video of your entire test run or a clip at the point of test failure.
- Manage who has access to your recorded test data.

***See Tests Runs in Desktop***

Additionally we've integrated the test runs into the Cypress {% url 'Desktop Application' installing-cypress %}. This means you can see the test runs in the *Runs* tab from within every project.

![Runs List](/img/dashboard/runs-list-in-desktop-gui.png)

# Example Projects

Once you're logged into the {% url 'Dashboard' https://on.cypress.io/dashboard %} you can view any {% url "public project" projects-dashboard#Public-vs-Private-Projects %}.

**Here are some of our own public projects you can view:**

-  [{% fa fa-folder-open-o %} cypress-core-desktop-gui](https://dashboard.cypress.io/#/projects/fas5qd)
- [{% fa fa-folder-open-o %} cypress-example-recipes](https://dashboard.cypress.io/#/projects/6p53jw)
- [{% fa fa-folder-open-o %} cypress-example-kitchensink](https://dashboard.cypress.io/#/projects/4b7344)
- [{% fa fa-folder-open-o %} cypress-example-todomvc](https://dashboard.cypress.io/#/projects/245obj)
- [{% fa fa-folder-open-o %} cypress-example-piechopper](https://dashboard.cypress.io/#/projects/fuduzp)

# Frequently Asked Questions

Want to know more? {% url "We've answered common questions here" dashboard-faq %}.
