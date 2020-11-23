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
    "cypress/integration/app_spec.js"
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
Cypress encountered an error while parsing the argument config

You passed: xyz

The error was: Cannot read property 'split' of undefined
`

exports['could not parse env error'] = `
Cypress encountered an error while parsing the argument env

You passed: a123

The error was: Cannot read property 'split' of undefined
`

exports['could not parse reporter options error'] = `
Cypress encountered an error while parsing the argument reporterOptions

You passed: nonono

The error was: Cannot read property 'split' of undefined
`

exports['INVALID_CONFIG_OPTION'] = `
\`test\` is not a valid configuration option,\`foo\` is not a valid configuration option

https://on.cypress.io/configuration

`
