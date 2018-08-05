exports['RECORD_PARAMS_WITHOUT_RECORDING-ciBuildId 1'] = `
You passed either the --ci-build-id, --group, or --parallel flag without also passing the --record flag.

The --ci-build-id flag you passed was: ciBuildId123

These flags can only be used when recording to the Cypress Dashboard service.

https://on.cypress.io/record-params-without-recording
`

exports['INCORRECT_CI_BUILD_ID_USAGE 1'] = `
You passed the --ci-build-id flag but did not provide either --group or --parallel.

The --ci-build-id you passed was: ciBuildId123

The --ci-build-id flag is used to either group or parallelize multiple runs together.

https://on.cypress.io/incorrect-ci-build-id-usage
`

exports['RECORD_PARAMS_WITHOUT_RECORDING-group 1'] = `
You passed either the --ci-build-id, --group, or --parallel flag without also passing the --record flag.

The --group flag you passed was: e2e-tests

These flags can only be used when recording to the Cypress Dashboard service.

https://on.cypress.io/record-params-without-recording
`

exports['RECORD_PARAMS_WITHOUT_RECORDING-parallel 1'] = `
You passed either the --ci-build-id, --group, or --parallel flag without also passing the --record flag.

The --parallel flag you passed was: true

These flags can only be used when recording to the Cypress Dashboard service.

https://on.cypress.io/record-params-without-recording
`

exports['RECORD_PARAMS_WITHOUT_RECORDING-group-parallel 1'] = `
You passed either the --ci-build-id, --group, or --parallel flag without also passing the --record flag.

The --group flag you passed was: electron-smoke-tests
The --parallel flag you passed was: true

These flags can only be used when recording to the Cypress Dashboard service.

https://on.cypress.io/record-params-without-recording
`
