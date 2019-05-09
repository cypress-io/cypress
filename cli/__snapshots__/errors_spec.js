exports['errors .errors.formErrorText returns fully formed text message 1'] = `
Your system is missing the dependency: XVFB

Install XVFB and run Cypress again.

Read our documentation on dependencies for more information:

[34mhttps://on.cypress.io/required-dependencies[39m

If you are using Docker, we provide containers with all required dependencies installed.

----------

Platform: test platform (Foo-OsVersion)
Cypress Version: 1.2.3
`

exports['errors individual has the following errors 1'] = [
  "nonZeroExitCodeXvfb",
  "missingXvfb",
  "missingApp",
  "notInstalledCI",
  "missingDependency",
  "versionMismatch",
  "binaryNotExecutable",
  "unexpected",
  "failedDownload",
  "failedUnzip",
  "invalidCacheDirectory",
  "removed",
  "CYPRESS_RUN_BINARY",
  "smokeTestFailure"
]

exports['errors .errors.formErrorText calls solution if a function 1'] = `
description

a solution

----------

Platform: test platform (Foo-OsVersion)
Cypress Version: 1.2.3
`

exports['errors .errors.formErrorText custom solution returns specific solution if on Linux DISPLAY env is set 1'] = `
Cypress failed to start.

This is usually caused by a missing library or dependency.

The error below should indicate which dependency is missing.

[34mhttps://on.cypress.io/required-dependencies[39m

If you are using Docker, we provide containers with all required dependencies installed.

We have noticed that DISPLAY variable is set to "wrong-display-address"
This might be a problem if X11 server is not responding.

[34mhttps://github.com/cypress-io/cypress/issues/4034[39m

Try deleting the DISPLAY variable and running the command again.

----------

Platform: linux (Foo-OsVersion)
Cypress Version: 1.2.3
`
