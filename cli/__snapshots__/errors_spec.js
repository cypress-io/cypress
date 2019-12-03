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
  "childProcessKilled",
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

exports['child kill error object'] = {
  "description": "The Test Runner unexpectedly exited via a [36mexit[39m event with signal [36mSIGKILL[39m",
  "solution": "Please search Cypress documentation for possible solutions:\n\n  [34mhttps://on.cypress.io[39m\n\nCheck if there is a GitHub issue describing this crash:\n\n  [34mhttps://github.com/cypress-io/cypress/issues[39m\n\nConsider opening a new issue."
}

exports['Error message'] = `
The Test Runner unexpectedly exited via a [36mexit[39m event with signal [36mSIGKILL[39m

Please search Cypress documentation for possible solutions:

[34mhttps://on.cypress.io[39m

Check if there is a GitHub issue describing this crash:

[34mhttps://github.com/cypress-io/cypress/issues[39m

Consider opening a new issue.

----------

Platform: test platform (Foo-OsVersion)
Cypress Version: 1.2.3
`
