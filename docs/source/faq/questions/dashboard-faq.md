---
layout: toc-top
title: Dashboard
comments: false
containerClass: faq
---

## {% fa fa-angle-right %} What is the Dashboard?

![Dashboard Screenshot](/img/dashboard/dashboard-runs-list.png)

The {% url 'Dashboard' https://on.cypress.io/dashboard %} is a Cypress service that gives you access to tests you've recorded - typically when running Cypress tests from your {% url "CI provider" continuous-integration %}. The Dashboard provides you insight into what happened during your tests run.

You can read more {% url 'here' features-dashboard %}.

## {% fa fa-angle-right %} How do I record my tests?

1. First {% url 'setup the project to record' projects-dashboard#Set-up-a-Project-to-Record %}.
2. Then {% url 'record your runs' runs-dashboard %}.

After recording your tests, you will see them in the {% url 'Dashboard' https://on.cypress.io/dashboard %} and in the "Runs" tab of the Desktop Application.

## {% fa fa-angle-right %} How much does it cost?

Everything is free while we are in Beta.

In the future, we will charge per month for private projects.

Public projects will be free but will likely have a monthly usage cap on them.

We will offer similar pricing models of other Developer Tools you are familiar with using.

## {% fa fa-angle-right %} What is the difference between public and private projects?

**A public project** means that anyone can see the recorded runs for it. It's similar to how public projects on Github, Travis, or Circle are handled. Anyone who knows your `projectId` will be able to see the recorded runs, screenshots, and videos for public projects.

**A private project** means that only {% url 'users' organizations-dashboard#Inviting-Users %} you explicitly invite to your {% url 'organization' organizations-dashboard %} can see its recorded runs. Even if someone knows your `projectId`, they will not have access to your runs unless you have invited them.

## {% fa fa-angle-right %} How is this different than CI?

Cypress is **complimentary** to your {% url "CI provider" continuous-integration %}, and plays a completely different role.

It doesn't replace or change anything related to CI. You will simply run Cypress tests in your CI provider.

The difference between our {% url 'Dashboard' features-dashboard %} and your CI provider is that your CI provider has no idea what is going on inside of the Cypress process. It's simply programmed to know whether or not a process failed - based on whether it had an exit code greater than `0`.

Our {% url 'Dashboard' features-dashboard %} provides you with the low level details of *what* happened during your run. Using both your CI provider + Cypress together gives the insight required to debug your test runs.

When a run happens and a test fails - instead of going and inspecting your CI provider's `stdout` output, you can log into the {% url 'Dashboard' https://on.cypress.io/dashboard %}, see the `stdout` as well as screenshots and video of the tests running. It should be instantly clear what the problem was.

## {% fa fa-angle-right %} Can I host the Dashboard data myself?

No, although we are looking to build an on-premise version of the Dashboard for use in private clouds. If you're interested in our on-premise version, [let us know](mailto:hello@cypress.io)!

## {% fa fa-angle-right %} Can I choose not to use the Dashboard?

Of course. The dashboard is a separate service from the Desktop Application and will always remain optional. We hope you'll find a tremendous amount of value out of it, but it is not coupled to being able to run your tests.

You can simply always run your tests in CI using {% url "`cypress run`" command-line#cypress-run %} without the `--record` flag which does not communicate with our external servers and will not record any test results.

## {% fa fa-angle-right %} What does Cypress record?

We capture the following:

- Standard Output
- Test Failures
- Screenshots
- Video

We have already begun the implementation for capturing even more things from your run such as:

- Commands
- Network Traffic
- Browser Console Logs

These will be added in subsequent releases.

<!-- ## How many recordings can I store? -->

<!-- ## Can't I just record my app running, without the Cypress runner? -->

<!-- ## Can I see the mouse movements in my recorded video? -->

<!-- ## Is there a way to see console logs or application errors in a recorded run? -->

<!-- ## Is it possible to transfer a project to an organization I'm not a member of? -->

<!-- ## Why are my tests displaying a “still running”? -->

<!-- ## Is there any way to remove a run and the data from the Dashboard? -->

<!-- ## How secure is storing my test runs (videos and screenshots) on your servers? -->
