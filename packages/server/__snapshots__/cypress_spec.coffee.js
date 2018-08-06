exports['RECORD_PARAMS_WITHOUT_RECORDING-ciBuildId 1'] = `
You passed the --ci-build-id, --group, or --parallel flag without also passing the --record flag.

The --ci-build-id flag you passed was: ciBuildId123

These flags can only be used when recording to the Cypress Dashboard service.

https://on.cypress.io/record-params-without-recording
`

exports['INCORRECT_CI_BUILD_ID_USAGE 1'] = `
You passed the --ci-build-id flag but did not provide either --group or --parallel.

The --ci-build-id flag you passed was: ciBuildId123

The --ci-build-id flag is used to either group or parallelize multiple runs together.

https://on.cypress.io/incorrect-ci-build-id-usage
`

exports['RECORD_PARAMS_WITHOUT_RECORDING-group 1'] = `
You passed the --ci-build-id, --group, or --parallel flag without also passing the --record flag.

The --group flag you passed was: e2e-tests

These flags can only be used when recording to the Cypress Dashboard service.

https://on.cypress.io/record-params-without-recording
`

exports['RECORD_PARAMS_WITHOUT_RECORDING-parallel 1'] = `
You passed the --ci-build-id, --group, or --parallel flag without also passing the --record flag.

The --parallel flag you passed was: true

These flags can only be used when recording to the Cypress Dashboard service.

https://on.cypress.io/record-params-without-recording
`

exports['RECORD_PARAMS_WITHOUT_RECORDING-group-parallel 1'] = `
You passed the --ci-build-id, --group, or --parallel flag without also passing the --record flag.

The --group flag you passed was: electron-smoke-tests
The --parallel flag you passed was: true

These flags can only be used when recording to the Cypress Dashboard service.

https://on.cypress.io/record-params-without-recording
`

exports['INDETERMINATE_CI_BUILD_ID-group 1'] = `
You passed the --group or --parallel flag but we could not automatically determine or generate a ciBuildId.

The --group flag you passed was: e2e-tests

In order to use either of these parameters a ciBuildId must be determined.

The ciBuildId is automatically detected if you are running Cypress in any of of the these CI providers:

- appveyor
- bamboo
- buildkite
- circle
- codeship
- drone
- gitlab
- jenkins
- semaphore
- shippable
- snap
- teamcity
- teamfoundation
- travis
- wercker

Because we could not automatically generate this ciBuildId, the  --ci-build-id flag must be passed in manually.

https://on.cypress.io/indeterminate-ci-build-id
`

exports['INDETERMINATE_CI_BUILD_ID-parallel 1'] = `
You passed the --group or --parallel flag but we could not automatically determine or generate a ciBuildId.

The --parallel flag you passed was: true

In order to use either of these parameters a ciBuildId must be determined.

The ciBuildId is automatically detected if you are running Cypress in any of of the these CI providers:

- appveyor
- bamboo
- buildkite
- circle
- codeship
- drone
- gitlab
- jenkins
- semaphore
- shippable
- snap
- teamcity
- teamfoundation
- travis
- wercker

Because we could not automatically generate this ciBuildId, the  --ci-build-id flag must be passed in manually.

https://on.cypress.io/indeterminate-ci-build-id
`

exports['INDETERMINATE_CI_BUILD_ID-parallel-group 1'] = `
You passed the --group or --parallel flag but we could not automatically determine or generate a ciBuildId.

The --group flag you passed was: e2e-tests-chrome
The --parallel flag you passed was: true

In order to use either of these parameters a ciBuildId must be determined.

The ciBuildId is automatically detected if you are running Cypress in any of of the these CI providers:

- appveyor
- bamboo
- buildkite
- circle
- codeship
- drone
- gitlab
- jenkins
- semaphore
- shippable
- snap
- teamcity
- teamfoundation
- travis
- wercker

Because we could not automatically generate this ciBuildId, the  --ci-build-id flag must be passed in manually.

https://on.cypress.io/indeterminate-ci-build-id
`

exports['DASHBOARD_RUN_GROUP_NAME_NOT_UNIQUE 1'] = `
You passed the --group flag, but this group name has already been used for this run.

The --group flag you passed was: electron-smoke-tests

If you are trying to parallelize this run, then also pass the --parallel flag, else pass a different group name.

It also looks like you also passed in an explicit --ci-build-id flag.

This is only necessary if you are NOT running in one of our supported CI providers.

This flag must be unique for each new run, but must also be identical for each machine you are trying to --group or run in --parallel.

https://on.cypress.io/run-group-name-not-unique
`
