---
title: Dashboard&#58; Recorded Runs
comments: true
---

Recorded runs are the results and artifacts captured from your test runs.

**To record your tests:**

1. First [setup your project to record](https://on.cypress.io/recording-project-runs).
2. Then [run the command](https://on.cypress.io/how-do-i-record-runs) `cypress run --record --key <record_key>`.

# What is recorded during a test run?

We capture the following:

- [Standard Output](#Standard-Output)
- [Test Failures](#Test-Failures)
- [Screenshots](Screenshots)
- [Video](Video)

## Standard Output

Standard output includes details and summaries of your tests based on the [reporter](https://on.cypress.io/guides/reporters) you have set. By default it is the `spec` reporter.

![output](https://cloud.githubusercontent.com/assets/1271364/22707798/f5e5608e-ed41-11e6-8832-d66e5a68094b.png)

You will also see a summary at the bottom indicating the files we've created during the recording.

## Test Failures

Any tests that fail during a test run can be found under the *Failures* tab. Each failure is listed under it's test title.

**Each failure displays:**

- **Error:** The stack trace of the error.
- **Video:** The recorded video scrubbed to the point of failure in the test.
- **Screenshot:** Any screenshots taken during the test.

![failures](https://cloud.githubusercontent.com/assets/1271364/22707770/dce3664e-ed41-11e6-84de-03acdc499daa.png)

## Screenshots

All screenshots taken during the test run can be found under the *Screenshots* tab. Both screenshots taken during failures and screenshots taken using the {% url `cy.screenshot()` screenshot %} command will show up here. Each screenshot includes the application under test as well as the Cypress Command Log.

![Screenshots](https://cloud.githubusercontent.com/assets/1271364/22707241/28bf50de-ed40-11e6-93a1-4e09c2767605.png)

## Videos

Any videos recorded during the test run can be found under the *Videos* tab. You can also download the video of a run.

![Video of tests](https://cloud.githubusercontent.com/assets/1271364/22706030/c3a442f8-ed3b-11e6-812e-a12980057e39.png)
