exports['INCORRECT_CI_BUILD_ID_USAGE 1'] = `
You passed the --ci-build-id flag but did not provide either --group or --parallel.

The --ci-build-id you passed was: ciBuildId123

The --ci-build-id flag is used to either group or parallelize multiple runs together.

https://on.cypress.io/incorrect-ci-build-id-usage
`
