---
title: Recorded Runs
comments: false
---

Recorded runs are the results and artifacts captured from your test runs.

***To record your tests:***

1. First {% url 'setup the project to record' projects-dashboard#Set-up-a-Project-to-Record %}.
2. Then {% url 'record your runs' runs-dashboard %}.

# What is recorded during a test run?

We capture the following:

- {% urlHash 'Standard Output' Standard-Output %}
- {% urlHash 'Test Failures' Test-Failures %}
- {% urlHash 'Screenshots' Screenshots %}
- {% urlHash 'Videos' Videos %}

## {% fa fa-code fa-fw %} Standard Output

Standard output includes details and summaries of your tests based on the {% url 'reporter' reporters %} you have set. By default it is the `spec` reporter.

![output](/img/dashboard/standard-output-of-recorded-test-run.png)

You will also see a summary at the bottom indicating the files we've created during the recording.

## {% fa fa-exclamation-triangle fa-fw %} Test Failures

Any tests that fail during a test run can be found under the **Failures** tab. Each failure is listed under it's test title.

***Each failure displays:***

- **Error:** The stack trace of the error.
- **Video:** The recorded video scrubbed to the point of failure in the test.
- **Screenshot:** Any screenshots taken during the test.

![failures](/img/dashboard/failures-of-recorded-run.png)

## {% fa fa-picture-o fa-fw %} Screenshots

All screenshots taken during the test run can be found under the **Screenshots** tab. Both screenshots taken during failures and screenshots taken using the {% url `cy.screenshot()` screenshot %} command will show up here. Each screenshot includes the application under test as well as the Cypress Command Log.

![Screenshots](/img/dashboard/screenshots-of-recorded-test-run.png)

## {% fa fa-video-camera fa-fw %}  Videos

Any videos recorded during the test run can be found under the **Videos** tab. You can also download the video of a run.

![Video of tests](/img/dashboard/videos-of-recorded-test-run.png)
