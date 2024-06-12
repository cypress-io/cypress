exports['RECORD_PARAMS_WITHOUT_RECORDING-ciBuildId 1'] = `
You passed the --ci-build-id, --group, --tag, --parallel, or --auto-cancel-after-failures flag without also passing the --record flag.

The --ci-build-id flag you passed was: ciBuildId123

These flags can only be used when recording to Cypress Cloud.

https://on.cypress.io/record-params-without-recording
`

exports['INCORRECT_CI_BUILD_ID_USAGE 1'] = `
You passed the --ci-build-id flag but did not provide either a --group or --parallel flag.

The --ci-build-id flag you passed was: ciBuildId123

The --ci-build-id flag is used to either group or parallelize multiple runs together.

https://on.cypress.io/incorrect-ci-build-id-usage
`

exports['RECORD_PARAMS_WITHOUT_RECORDING-group 1'] = `
You passed the --ci-build-id, --group, --tag, --parallel, or --auto-cancel-after-failures flag without also passing the --record flag.

The --group flag you passed was: e2e-tests

These flags can only be used when recording to Cypress Cloud.

https://on.cypress.io/record-params-without-recording
`

exports['RECORD_PARAMS_WITHOUT_RECORDING-parallel 1'] = `
You passed the --ci-build-id, --group, --tag, --parallel, or --auto-cancel-after-failures flag without also passing the --record flag.

The --parallel flag you passed was: true

These flags can only be used when recording to Cypress Cloud.

https://on.cypress.io/record-params-without-recording
`

exports['RECORD_PARAMS_WITHOUT_RECORDING-group-parallel 1'] = `
You passed the --ci-build-id, --group, --tag, --parallel, or --auto-cancel-after-failures flag without also passing the --record flag.

The --group flag you passed was: electron-smoke-tests
The --parallel flag you passed was: true

These flags can only be used when recording to Cypress Cloud.

https://on.cypress.io/record-params-without-recording
`

exports['INDETERMINATE_CI_BUILD_ID-group 1'] = `
You passed the --group or --parallel flag but we could not automatically determine or generate a ciBuildId.

The --group flag you passed was: e2e-tests

In order to use either of these features a ciBuildId must be determined.

The ciBuildId is automatically detected if you are running Cypress in any of the these CI providers:

 - appveyor
 - azure
 - awsCodeBuild
 - bamboo
 - bitbucket
 - buildkite
 - circle
 - codeshipBasic
 - codeshipPro
 - concourse
 - codeFresh
 - drone
 - githubActions
 - gitlab
 - goCD
 - googleCloud
 - jenkins
 - semaphore
 - shippable
 - teamfoundation
 - travis
 - netlify
 - webappio

Because the ciBuildId could not be auto-detected you must pass the --ci-build-id flag manually.

https://on.cypress.io/indeterminate-ci-build-id
`

exports['INDETERMINATE_CI_BUILD_ID-parallel 1'] = `
You passed the --group or --parallel flag but we could not automatically determine or generate a ciBuildId.

The --parallel flag you passed was: true

In order to use either of these features a ciBuildId must be determined.

The ciBuildId is automatically detected if you are running Cypress in any of the these CI providers:

 - appveyor
 - azure
 - awsCodeBuild
 - bamboo
 - bitbucket
 - buildkite
 - circle
 - codeshipBasic
 - codeshipPro
 - concourse
 - codeFresh
 - drone
 - githubActions
 - gitlab
 - goCD
 - googleCloud
 - jenkins
 - semaphore
 - shippable
 - teamfoundation
 - travis
 - netlify
 - webappio

Because the ciBuildId could not be auto-detected you must pass the --ci-build-id flag manually.

https://on.cypress.io/indeterminate-ci-build-id
`

exports['INDETERMINATE_CI_BUILD_ID-parallel-group 1'] = `
You passed the --group or --parallel flag but we could not automatically determine or generate a ciBuildId.

The --group flag you passed was: e2e-tests-chrome
The --parallel flag you passed was: true

In order to use either of these features a ciBuildId must be determined.

The ciBuildId is automatically detected if you are running Cypress in any of the these CI providers:

 - appveyor
 - azure
 - awsCodeBuild
 - bamboo
 - bitbucket
 - buildkite
 - circle
 - codeshipBasic
 - codeshipPro
 - concourse
 - codeFresh
 - drone
 - githubActions
 - gitlab
 - goCD
 - googleCloud
 - jenkins
 - semaphore
 - shippable
 - teamfoundation
 - travis
 - netlify
 - webappio

Because the ciBuildId could not be auto-detected you must pass the --ci-build-id flag manually.

https://on.cypress.io/indeterminate-ci-build-id
`

exports['CLOUD_RUN_GROUP_NAME_NOT_UNIQUE 1'] = `
You passed the --group flag, but this group name has already been used for this run.

The existing run is: https://cloud.cypress.io/runs/12345

The --group flag you passed was: electron-smoke-tests
The --ciBuildId flag you passed was: ciBuildId123

If you are trying to parallelize this run, then also pass the --parallel flag, else pass a different group name.

It also looks like you also passed in an explicit --ci-build-id flag.

This is only necessary if you are NOT running in one of our supported CI providers.

This flag must be unique for each new run, but must also be identical for each machine you are trying to --group or run in --parallel.

https://on.cypress.io/run-group-name-not-unique
`

exports['CLOUD_PARALLEL_GROUP_PARAMS_MISMATCH 1'] = `
You passed the --parallel flag, but we do not parallelize tests across different environments.

This machine is sending different environment parameters than the first machine that started this parallel run.

The existing run is: https://cloud.cypress.io/runs/12345

In order to run in parallel mode each machine must send identical environment parameters such as:

 - specs
 - osName
 - osVersion
 - browserName
 - browserVersion (major)

This machine sent the following parameters:

{
  "osName": "darwin",
  "osVersion": "v1",
  "browserName": "Electron.... (Expected: Electron)",
  "browserVersion": "59.1.2.3.... (Expected: 64)",
  "differentSpecs": {
    "added": [],
    "missing": [
      "cypress/integration/foo_spec.js"
    ]
  }
}

https://on.cypress.io/parallel-group-params-mismatch
`

exports['CLOUD_PARALLEL_DISALLOWED 1'] = `
You passed the --parallel flag, but this run group was originally created without the --parallel flag.

The existing run is: https://cloud.cypress.io/runs/12345

The --group flag you passed was: electron-smoke-tests
The --ciBuildId flag you passed was: ciBuildId123

You can not use the --parallel flag with this group.

https://on.cypress.io/parallel-disallowed
`

exports['CLOUD_PARALLEL_REQUIRED 1'] = `
You did not pass the --parallel flag, but this run's group was originally created with the --parallel flag.

The existing run is: https://cloud.cypress.io/runs/12345

The --tag flag you passed was: nightly
The --group flag you passed was: electron-smoke-tests
The --ciBuildId flag you passed was: ciBuildId123

You must use the --parallel flag with this group.

https://on.cypress.io/parallel-required
`

exports['CLOUD_ALREADY_COMPLETE 1'] = `
The run you are attempting to access is already complete and will not accept new groups.

The existing run is: https://cloud.cypress.io/runs/12345

When a run finishes all of its groups, it waits for a configurable set of time before finally completing. You must add more groups during that time period.

The --tag flag you passed was: nightly
The --group flag you passed was: electron-smoke-tests
The --ciBuildId flag you passed was: ciBuildId123

https://on.cypress.io/already-complete
`

exports['CLOUD_STALE_RUN 1'] = `
You are attempting to pass the --parallel flag to a run that was completed over 24 hours ago.

The existing run is: https://cloud.cypress.io/runs/12345

You cannot parallelize a run that has been complete for that long.

The --tag flag you passed was: nightly
The --group flag you passed was: electron-smoke-tests
The --parallel flag you passed was: true
The --ciBuildId flag you passed was: ciBuildId123

https://on.cypress.io/stale-run
`

exports['RECORD_PARAMS_WITHOUT_RECORDING-tag 1'] = `
You passed the --ci-build-id, --group, --tag, --parallel, or --auto-cancel-after-failures flag without also passing the --record flag.

These flags can only be used when recording to Cypress Cloud.

https://on.cypress.io/record-params-without-recording
`

exports['could not parse config error'] = `
Cypress encountered an error while parsing the argument: --config

You passed: xyz

The error was: Cannot parse as valid JSON
`

exports['could not parse env error'] = `
Cypress encountered an error while parsing the argument: --env

You passed: a123

The error was: Cannot parse as valid JSON
`

exports['could not parse reporter options error'] = `
Cypress encountered an error while parsing the argument: --reporterOptions

You passed: nonono

The error was: Cannot parse as valid JSON
`

exports['INVALID_CONFIG_OPTION'] = `
The following configuration options are invalid:

 - test
 - foo

https://on.cypress.io/configuration

`

exports['Long Cypress Cloud URL'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (app.cy.js)                                                                │
  │ Searched:   cypress/e2e/**/*.cy.{js,jsx,ts,tsx}                                                │
  │ Params:     Tag: false, Group: electron-smoke-tests, Parallel: false                           │
  │ Run URL:    http://cloud.cypress.io/this-is-a-long-long-long-long-long-long-long-long-long-lon │
  │             g-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long- │
  │             long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-lo │
  │             ng-long-long-long-long-long-long-long-url                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  app.cy.js                                                                       (1 of 1)

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖                                           XX:XX        1        2        3        4        5 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        2        3        4        5  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: http://cloud.cypress.io/this-is-a-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-url

`

exports['CLOUD_RECOMMENDATION_MESSAGE'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (test1.js)                                                                 │
  │ Searched:   tests/test1.js                                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  test1.js                                                                        (1 of 1)

  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        undefined                                                                        │
  │ Passing:      undefined                                                                        │
  │ Failing:      1                                                                                │
  │ Pending:      undefined                                                                        │
  │ Skipped:      undefined                                                                        │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     undefined seconds                                                                │
  │ Spec Ran:     test1.js                                                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  test1.js                                 XX:XX        -        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        -        -        1        -        -  

----------------------------------------------------------------------------------------------------

  Having trouble debugging your CI failures?

  Record your runs to Cypress Cloud to watch video recordings for each test,
  debug failing and flaky tests, and integrate with your favorite tools.

  >> https://on.cypress.io/cloud-get-started

----------------------------------------------------------------------------------------------------
`

exports['RECORD_PARAMS_WITHOUT_RECORDING-no-auto-cancel-after-failures 1'] = `
You passed the --ci-build-id, --group, --tag, --parallel, or --auto-cancel-after-failures flag without also passing the --record flag.

These flags can only be used when recording to Cypress Cloud.

https://on.cypress.io/record-params-without-recording
`

exports['RECORD_PARAMS_WITHOUT_RECORDING-auto-cancel-after-failures 1'] = `
You passed the --ci-build-id, --group, --tag, --parallel, or --auto-cancel-after-failures flag without also passing the --record flag.

The --auto-cancel-after-failures flag you passed was: 4

These flags can only be used when recording to Cypress Cloud.

https://on.cypress.io/record-params-without-recording
`

exports['CLOUD_AUTO_CANCEL_MISMATCH 1'] = `
You passed the --auto-cancel-after-failures flag, but this run originally started with a different value for the --auto-cancel-after-failures flag.

The existing run is: https://cloud.cypress.io/runs/12345

The --tag flag you passed was: nightly
The --group flag you passed was: electron-smoke-tests
The --ciBuildId flag you passed was: ciBuildId123
The --auto-cancel-after-failures flag you passed was: 4

The first setting of --auto-cancel-after-failures for any given run takes precedent.

https://on.cypress.io/auto-cancellation-mismatch
`
