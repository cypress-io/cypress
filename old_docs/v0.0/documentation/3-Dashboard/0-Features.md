slug: dashboard-features
excerpt: An overview of our Dashboard

# Contents

- :fa-angle-right: [What is the Dashboard?](#section-what-is-the-dashboard-)
  - [Example Projects](#section-example-projects)
- :fa-angle-right: [Frequently Asked Questions](#section-frequently-asked-questions)
  - [How do I record my tests?](#section-how-do-i-record-my-tests)
  - [How is this different than CI?](#section-how-is-this-different-than-ci-)
  - [How much does this cost?](#section-how-much-does-this-cost-)
  - [Can I host this myself?](#section-can-i-host-this-myself-)
  - [Can I choose not to use it?](#section-can-i-choose-not-to-use-it-)

***

# What is the Dashboard?

![Dashboard Screenshot](https://cloud.githubusercontent.com/assets/1271364/22800284/d4dbe1d8-eed6-11e6-87ce-32474ea1000c.png)

[The Dashboard](https://on.cypress.io/dashboard) is a Cypress service that gives you access to tests you've recorded - typically when running Cypress tests from your CI provider. The Dashboard provides you insight into what happened during your run.

**The Dashboard allows you to:**

- See the number of failed, pending and passing tests
- Get the entire stack trace of failed tests
- View screenshots taken when tests fail and when using [`cy.screenshot`](https://on.cypress.io/api/screenshot)
- Watch a video of your entire test run or a clip at the point of test failure.
- Manage who has access to your run data

Additionally we've integrated the dashboard into the Cypress [Desktop Application](https://on.cypress.io/guides/installing-and-running). This means you'll see the test runs in the Tunes tab from within every project.

![Runs List](https://cloud.githubusercontent.com/assets/1271364/22800330/ff6c9474-eed6-11e6-9a32-8360d64b1071.png)

***

## Example Projects

Once you're logged into the [Dashboard](https://on.cypress.io/dashboard) you can view any [public project](https://on.cypress.io/what-is-project-access).

Here are some of our own public projects you can look at:

- [cypress-core-desktop-gui](https://dashboard.cypress.io/#/projects/fas5qd)
- [cypress-example-recipes](https://dashboard.cypress.io/#/projects/6p53jw)
- [cypress-example-kitchensink](https://dashboard.cypress.io/#/projects/4b7344)
- [cypress-example-todomvc](https://dashboard.cypress.io/#/projects/245obj)
- [cypress-example-piechopper](https://dashboard.cypress.io/#/projects/fuduzp)

***

# Frequently Asked Questions

## How do I record my tests?

1. First [setup your project to record](https://on.cypress.io/recording-project-runs).
2. Then [record your runs](https://on.cypress.io/how-do-i-record-runs).

After recording your tests, you will see them in the Dashboard and in the Desktop Application.

***

## How is this different than CI?

Cypress is **complimentary** to your CI provider, and plays a completely different role.

It doesn't replace nor change anything related to CI. You will simply run Cypress tests in your CI provider.

The difference is that your CI provider has no idea what is going on inside of the Cypress process. It's simply programmed to know whether or not a process failed - based on whether it had an exit code greater than `0`.

Our dashboard provides you with the low level details of *what* happened during your run. Using both your CI provider + Cypress together gives the insight required to debug your test runs.

When a run happens and a test fails - instead of going and inspecting your CI provider's `stdout` output, you can log into the [Dashboard](https://on.cypress.io/dashboard) and see all of the test run results. It should be instantly clear what the problem was.

***

## How much does this cost?

Everything is free while we are in Beta.

In the future, we will charge per month for private projects.

Public projects will be free but will likely have a monthly usage cap on them.

We will offer similar pricing models of other Developer Tools you are familiar with using.

Plans will likely start around the $99/month level.
***

## Can I host this myself?

No, although we are looking to build an on-premise version of the Dashboard for use in private clouds. If you're interested in our on-premise version, [let us know](mailto:hello@cypress.io)!

***

## Can I choose not to use it?

Of course. The dashboard is a separate service from the Desktop Application and will always remain optional. We hope you'll find a tremendous amount of value out of it, but it is not coupled to being able to run your tests.

You can simply always run your tests in CI using `cypress run` without the `--record` flag which does not communicate with our external servers and will not record any test results.
