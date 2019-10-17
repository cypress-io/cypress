exports['errors .errors.formErrorText calls solution if a function 1'] = `
description

a solution

----------

Platform: test platform (Foo-OsVersion)
Cypress Version: 1.2.3
`

exports['errors .errors.formErrorText returns fully formed text message 1'] = `
Your system is missing the dependency: Xvfb

Install Xvfb and run Cypress again.

Read our documentation on dependencies for more information:

[34mhttps://on.cypress.io/required-dependencies[39m

If you are using Docker, we provide containers with all required dependencies installed.

----------

Platform: test platform (Foo-OsVersion)
Cypress Version: 1.2.3
`

exports['errors individual has the following errors 1'] = [
  "CYPRESS_RUN_BINARY",
  "binaryNotExecutable",
  "failedDownload",
  "failedUnzip",
  "invalidCacheDirectory",
  "invalidCypressEnv",
  "invalidSmokeTestDisplayError",
  "missingApp",
  "missingDependency",
  "missingXvfb",
  "nonZeroExitCodeXvfb",
  "notInstalledCI",
  "removed",
  "smokeTestFailure",
  "unexpected",
  "versionMismatch"
]

exports['invalid display error'] = `
Cypress verification failed.

Cypress failed to start after spawning a new Xvfb server.

The error logs we received were:

----------

current message

----------

This is usually caused by a missing library or dependency.

The error above should indicate which dependency is missing.

[34mhttps://on.cypress.io/required-dependencies[39m

If you are using Docker, we provide containers with all required dependencies installed.

----------

Platform: test platform (Foo-OsVersion)
Cypress Version: 1.2.3
`
