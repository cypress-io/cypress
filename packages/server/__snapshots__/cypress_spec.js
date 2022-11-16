exports['RECORD_PARAMS_WITHOUT_RECORDING-ciBuildId 1'] = `
You passed the --ci-build-id, --group, --tag, or --parallel flag without also passing the --record flag.

The --ci-build-id flag you passed was: ciBuildId123

These flags can only be used when recording to the Cypress Dashboard service.

https://on.cypress.io/record-params-without-recording
`

exports['INCORRECT_CI_BUILD_ID_USAGE 1'] = `
You passed the --ci-build-id flag but did not provide either a --group or --parallel flag.

The --ci-build-id flag you passed was: ciBuildId123

The --ci-build-id flag is used to either group or parallelize multiple runs together.

https://on.cypress.io/incorrect-ci-build-id-usage
`

exports['RECORD_PARAMS_WITHOUT_RECORDING-group 1'] = `
You passed the --ci-build-id, --group, --tag, or --parallel flag without also passing the --record flag.

The --group flag you passed was: e2e-tests

These flags can only be used when recording to the Cypress Dashboard service.

https://on.cypress.io/record-params-without-recording
`

exports['RECORD_PARAMS_WITHOUT_RECORDING-parallel 1'] = `
You passed the --ci-build-id, --group, --tag, or --parallel flag without also passing the --record flag.

The --parallel flag you passed was: true

These flags can only be used when recording to the Cypress Dashboard service.

https://on.cypress.io/record-params-without-recording
`

exports['RECORD_PARAMS_WITHOUT_RECORDING-group-parallel 1'] = `
You passed the --ci-build-id, --group, --tag, or --parallel flag without also passing the --record flag.

The --group flag you passed was: electron-smoke-tests
The --parallel flag you passed was: true

These flags can only be used when recording to the Cypress Dashboard service.

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
 - layerci

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
 - layerci

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
 - layerci

Because the ciBuildId could not be auto-detected you must pass the --ci-build-id flag manually.

https://on.cypress.io/indeterminate-ci-build-id
`

exports['DASHBOARD_RUN_GROUP_NAME_NOT_UNIQUE 1'] = `
You passed the --group flag, but this group name has already been used for this run.

The existing run is: https://dashboard.cypress.io/runs/12345

The --group flag you passed was: electron-smoke-tests
The --ciBuildId flag you passed was: ciBuildId123

If you are trying to parallelize this run, then also pass the --parallel flag, else pass a different group name.

It also looks like you also passed in an explicit --ci-build-id flag.

This is only necessary if you are NOT running in one of our supported CI providers.

This flag must be unique for each new run, but must also be identical for each machine you are trying to --group or run in --parallel.

https://on.cypress.io/run-group-name-not-unique
`

exports['DASHBOARD_PARALLEL_GROUP_PARAMS_MISMATCH 1'] = `
You passed the --parallel flag, but we do not parallelize tests across different environments.

This machine is sending different environment parameters than the first machine that started this parallel run.

The existing run is: https://dashboard.cypress.io/runs/12345

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
  "browserName": "Electron",
  "browserVersion": "59.1.2.3",
  "specs": [
    "cypress/e2e/app.cy.js"
  ]
}

https://on.cypress.io/parallel-group-params-mismatch
`

exports['DASHBOARD_PARALLEL_DISALLOWED 1'] = `
You passed the --parallel flag, but this run group was originally created without the --parallel flag.

The existing run is: https://dashboard.cypress.io/runs/12345

The --group flag you passed was: electron-smoke-tests
The --ciBuildId flag you passed was: ciBuildId123

You can not use the --parallel flag with this group.

https://on.cypress.io/parallel-disallowed
`

exports['DASHBOARD_PARALLEL_REQUIRED 1'] = `
You did not pass the --parallel flag, but this run's group was originally created with the --parallel flag.

The existing run is: https://dashboard.cypress.io/runs/12345

The --tag flag you passed was: nightly
The --group flag you passed was: electron-smoke-tests
The --ciBuildId flag you passed was: ciBuildId123

You must use the --parallel flag with this group.

https://on.cypress.io/parallel-required
`

exports['DASHBOARD_ALREADY_COMPLETE 1'] = `
The run you are attempting to access is already complete and will not accept new groups.

The existing run is: https://dashboard.cypress.io/runs/12345

When a run finishes all of its groups, it waits for a configurable set of time before finally completing. You must add more groups during that time period.

The --tag flag you passed was: nightly
The --group flag you passed was: electron-smoke-tests
The --ciBuildId flag you passed was: ciBuildId123

https://on.cypress.io/already-complete
`

exports['DASHBOARD_STALE_RUN 1'] = `
You are attempting to pass the --parallel flag to a run that was completed over 24 hours ago.

The existing run is: https://dashboard.cypress.io/runs/12345

You cannot parallelize a run that has been complete for that long.

The --tag flag you passed was: nightly
The --group flag you passed was: electron-smoke-tests
The --parallel flag you passed was: true
The --ciBuildId flag you passed was: ciBuildId123

https://on.cypress.io/stale-run
`

exports['RECORD_PARAMS_WITHOUT_RECORDING-tag 1'] = `
You passed the --ci-build-id, --group, --tag, or --parallel flag without also passing the --record flag.

These flags can only be used when recording to the Cypress Dashboard service.

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

exports['Long Dashboard URL'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (app.cy.js)                                                                │
  │ Searched:   cypress/e2e/**/*.cy.{js,jsx,ts,tsx}                                                │
  │ Params:     Tag: false, Group: electron-smoke-tests, Parallel: false                           │
  │ Run URL:    http://dashboard.cypress.io/this-is-a-long-long-long-long-long-long-long-long-long │
  │             -long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-l │
  │             ong-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-lon │
  │             g-long-long-long-long-long-long-long-long-url                                      │
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
                                                                                                       
  Recorded Run: http://dashboard.cypress.io/this-is-a-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-url

`

exports['CLOUD_RECOMMENDATION_MESSAGE'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      41 found (test1.js, test2.coffee, _support/spec_helper.js, _fixtures/ascii.foo, _f │
  │             ixtures/bad_coffee.coffee, _fixtures/bad_js.js, _fixtures/bad_json.json, _fixtures │
  │             /bar.js, _fixtures/bar_coffee.coffee, _fixtures/data.csv, _fixtures/empty_objects. │
  │             json, _fixt...)                                                                    │
  │ Searched:   tests/**/*                                                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  test1.js                                                                       (1 of 41)

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


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  test2.coffee                                                                   (2 of 41)

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
  │ Spec Ran:     test2.coffee                                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _support/spec_helper.js                                                        (3 of 41)

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
  │ Spec Ran:     _support/spec_helper.js                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/ascii.foo                                                            (4 of 41)

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
  │ Spec Ran:     _fixtures/ascii.foo                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/bad_coffee.coffee                                                    (5 of 41)

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
  │ Spec Ran:     _fixtures/bad_coffee.coffee                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/bad_js.js                                                            (6 of 41)

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
  │ Spec Ran:     _fixtures/bad_js.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/bad_json.json                                                        (7 of 41)

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
  │ Spec Ran:     _fixtures/bad_json.json                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/bar.js                                                               (8 of 41)

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
  │ Spec Ran:     _fixtures/bar.js                                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/bar_coffee.coffee                                                    (9 of 41)

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
  │ Spec Ran:     _fixtures/bar_coffee.coffee                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/data.csv                                                            (10 of 41)

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
  │ Spec Ran:     _fixtures/data.csv                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/empty_objects.json                                                  (11 of 41)

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
  │ Spec Ran:     _fixtures/empty_objects.json                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/example.zip                                                         (12 of 41)

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
  │ Spec Ran:     _fixtures/example.zip                                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/foo.coffee                                                          (13 of 41)

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
  │ Spec Ran:     _fixtures/foo.coffee                                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/foo.exe                                                             (14 of 41)

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
  │ Spec Ran:     _fixtures/foo.exe                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/foo.js                                                              (15 of 41)

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
  │ Spec Ran:     _fixtures/foo.js                                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/foo.json                                                            (16 of 41)

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
  │ Spec Ran:     _fixtures/foo.json                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/index.html                                                          (17 of 41)

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
  │ Spec Ran:     _fixtures/index.html                                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/invalid.exe                                                         (18 of 41)

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
  │ Spec Ran:     _fixtures/invalid.exe                                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/message.txt                                                         (19 of 41)

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
  │ Spec Ran:     _fixtures/message.txt                                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/no_format.js                                                        (20 of 41)

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
  │ Spec Ran:     _fixtures/no_format.js                                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/no_format.json                                                      (21 of 41)

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
  │ Spec Ran:     _fixtures/no_format.json                                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/no_format_coffee.coffee                                             (22 of 41)

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
  │ Spec Ran:     _fixtures/no_format_coffee.coffee                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/trailing_new_line.html                                              (23 of 41)

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
  │ Spec Ran:     _fixtures/trailing_new_line.html                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/trailing_new_line.js                                                (24 of 41)

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
  │ Spec Ran:     _fixtures/trailing_new_line.js                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/trailing_new_line.json                                              (25 of 41)

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
  │ Spec Ran:     _fixtures/trailing_new_line.json                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/trailing_new_line.txt                                               (26 of 41)

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
  │ Spec Ran:     _fixtures/trailing_new_line.txt                                                  │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/trailing_new_line_coffee.coffee                                     (27 of 41)

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
  │ Spec Ran:     _fixtures/trailing_new_line_coffee.coffee                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/unicode_escape.json                                                 (28 of 41)

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
  │ Spec Ran:     _fixtures/unicode_escape.json                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/unknown_ext.yaml                                                    (29 of 41)

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
  │ Spec Ran:     _fixtures/unknown_ext.yaml                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/user.js                                                             (30 of 41)

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
  │ Spec Ran:     _fixtures/user.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/users.json                                                          (31 of 41)

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
  │ Spec Ran:     _fixtures/users.json                                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/valid_coffee_obj.coffee                                             (32 of 41)

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
  │ Spec Ran:     _fixtures/valid_coffee_obj.coffee                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/words.json                                                          (33 of 41)

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
  │ Spec Ran:     _fixtures/words.json                                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  etc/etc.js                                                                    (34 of 41)

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
  │ Spec Ran:     etc/etc.js                                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  sub/a&b%c.js                                                                  (35 of 41)

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
  │ Spec Ran:     sub/a&b%c.js                                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  sub/sub_test.coffee                                                           (36 of 41)

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
  │ Spec Ran:     sub/sub_test.coffee                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/images/flower.png                                                   (37 of 41)

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
  │ Spec Ran:     _fixtures/images/flower.png                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/images/sample.jpg                                                   (38 of 41)

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
  │ Spec Ran:     _fixtures/images/sample.jpg                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/images/sample.tif                                                   (39 of 41)

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
  │ Spec Ran:     _fixtures/images/sample.tif                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/images/word.gif                                                     (40 of 41)

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
  │ Spec Ran:     _fixtures/images/word.gif                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  _fixtures/nested/fixture.js                                                   (41 of 41)

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
  │ Spec Ran:     _fixtures/nested/fixture.js                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  _fixtures/nested/fixture.js              XX:XX        -        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  41 of 41 failed (100%)                   XX:XX        -        -       41        -        -  

----------------------------------------------------------------------------------------------------

  Having trouble debugging your CI failures?
  
  Record your runs to Cypress Cloud to watch video recordings for each test, 
  debug failing and flaky tests, and integrate with your favorite tools.

  >> https://on.cypress.io/cloud-get-started

----------------------------------------------------------------------------------------------------
`
