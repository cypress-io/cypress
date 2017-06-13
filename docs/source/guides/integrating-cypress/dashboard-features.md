---
title: The Cypress Dashboard
comments: false
---

{% url 'Dashboard' https://on.cypress.io/dashboard %} is a Cypress service that gives you access to recorded tests - typically when running Cypress tests from your {% url 'CI provider' continuous-integration %}. The Dashboard provides you insight into what happened when your tests ran.

![Dashboard Screenshot](https://cloud.githubusercontent.com/assets/1271364/22800284/d4dbe1d8-eed6-11e6-87ce-32474ea1000c.png)

**The Dashboard allows you to:**

- See the number of failed, pending and passing tests.
- Get the entire stack trace of failed tests.
- View screenshots taken when tests fail and when using {% url `cy.screenshot()` screenshot %}.
- Watch a video of your entire test run or a clip at the point of test failure.
- Manage who has access to your recorded test data.

**See Tests Runs in Desktop**

Additionally we've integrated the test runs into the Cypress {% url 'Desktop Application' installing-cypress %}). This means you can see the test runs in the *Runs* tab from within every project.

![Runs List](https://cloud.githubusercontent.com/assets/1271364/22800330/ff6c9474-eed6-11e6-9a32-8360d64b1071.png)

# Example Projects

Once you're logged into the {% url 'Dashboard' https://on.cypress.io/dashboard %} you can view any [public project](https://on.cypress.io/what-is-project-access).

**Here are some of our own public projects you can view:**

- [cypress-core-desktop-gui](https://dashboard.cypress.io/#/projects/fas5qd)
- [cypress-example-recipes](https://dashboard.cypress.io/#/projects/6p53jw)
- [cypress-example-kitchensink](https://dashboard.cypress.io/#/projects/4b7344)
- [cypress-example-todomvc](https://dashboard.cypress.io/#/projects/245obj)
- [cypress-example-piechopper](https://dashboard.cypress.io/#/projects/fuduzp)

# Frequently Asked Questions

## How do I record my tests?

1. First {% url 'setup the project to record' dashboard-projects#Set-up-a-Project-to-Record %}.
2. Then {% url 'record your runs' dashboard-features#How-do-I-record-my-tests %}.

After recording your tests, you will see them in the Dashboard and in the Desktop Application.

## How is this different than CI?

{% url 'Cypress is *complimentary* to your CI provider' continuous-integration %}, and plays a completely different role.

CI providers have no idea what is going on inside of the Cypress process while your tests run. They are simply programmed to know whether or not a process failed.

The Cypress {% url 'Dashboard' https://on.cypress.io/dashboard %} provides you with the low level details of *what* happened while the tests ran. Using both your CI provider *and* Cypress together gives you the insight to debug failing tests.

When a run happens and a test fails - instead of going and inspecting your CI provider's `stdout` output, you can log into the {% url 'Dashboard' https://on.cypress.io/dashboard %} and see all of the `stdout` as well as any errors during failures, any screenshots taken, and an entire video recording of the tests run.

## How much does this cost?

Everything is free while we are in Beta.

In the future, we will charge per month for *private* projects offering a similar pricing model of other familiar developer tools.

*Public* projects will be free, but will likely have a monthly usage cap on them.

## Can I host this myself?

No, although we are looking to build an on-premise version of the Dashboard for use in private clouds. If you're interested in our on-premise version, [let us know](mailto:hello@cypress.io)!

## Can I choose not to use it?

Yes. The dashboard is a separate service from the Desktop Application and will always remain optional. We hope you'll find a tremendous amount of value out of it, but it is not coupled to being able to run your tests.

You can always run your tests in CI using {% url '`cypress run`' cli-tool#cypress-run %} without the `--record` flag. Doing this will not record any test results or communicate to our external servers.
