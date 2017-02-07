slug: dashboard-features
excerpt: An overview of our Dashboard

# Contents

- :fa-angle-right: [What is the Dashboard?](#section-what-is-the-dashboard-)
- :fa-angle-right: [Frequently Asked Questions](#section-frequently-asked-questions)
  - [How do I record my builds?](#section-how-do-i-record-my-builds)
  - [How is this different than CI?](#section-how-is-this-different-than-ci-)
  - [How much does this cost?](#section-how-much-does-this-cost-)
  - [Can I host this myself?](#section-can-i-host-this-myself-)
  - [Can I choose not to use it?](#section-can-i-choose-not-to-use-it-)

***

# What is the Dashboard?

![screen shot 2017-02-06 at 7 26 29 pm](https://cloud.githubusercontent.com/assets/1268976/22672483/47258924-eca2-11e6-8544-268c777c46aa.png)

The Dashboard is a Cypress service that gives you access to builds you've recorded - typically when running Cypress tests from your CI provider. The Dashboard provides you insight into what happened during your build.

**The Dashboard allows you to:**

- See the number of failed, pending and passing tests
- Get the entire stack trace of failed tests
- View screenshots taken when tests fail and when using [`cy.screenshot`](https://on.cypress.io/api/screenshot)
- Watch a video of your entire test run or a clip at the point of test failure.
- Manage who has access to your build data

Additionally we've integrated the dashboard into the Cypress [Desktop Application](https://on.cypress.io/guides/installing-and-running). This means you'll see the builds in the Builds tab from within every project.

![Builds List](https://cloud.githubusercontent.com/assets/1271364/22701577/fab631d0-ed2b-11e6-8ee1-f57a89013658.png)

***

# Frequently Asked Questions

## How do I record my builds?

[By adding your project and running it in CI.](https://on.cypress.io/guides/projects)

[After recording your builds, you will see them in the Dashboard and in the Desktop Application](https://on.cypress.io/guides/projects).

***

## How is this different than CI?

Cypress is **complimentary** to your CI provider, and plays a completely different role.

It doesn't replace nor change anything related to CI. You will simply run Cypress tests in your CI provider.

The difference is that your CI provider has no idea what is going on inside of the Cypress process. It's simply programmed to know whether or not a process failed - based on whether it had an exit code greater than `0`.

Our dashboard provides you with the low level details of *what* happened during your run. Using both your CI provider + Cypress together gives the insight required to debug your test runs.

When a run happens and a test fails - instead of going and inspecting your CI provider's `stdout` output, you can log into the [Dashboard](https://on.cypress.io/dashboard) and see all of the build results. It should be instantly clear what the problem was.

***

## How much does this cost?

Everything is free while we are in Beta.

In the future, we will charge per month for private projects.

Public projects will be free but will likely have a monthly usage cap on them.

We will offer similar pricing models of other Developer Tools you are familiar with using.

***

## Can I host this myself?

No, although we are looking to build an on-prem version of the Dashboard for use in the future.

***

## Can I choose not to use it?

Of course. The dashboard is a separate service from the Desktop Application and will always remain optional. We hope you'll find a tremendous amount of value out of it, but it is not coupled to being able to run your tests.

You can simply always run your tests in CI using `cypress run` which does not communicate with our external servers and will not record any build results.
