exports['errors individual has the following errors 1'] = [
  "nonZeroExitCodeXvfb",
  "missingXvfb",
  "missingApp",
  "missingDependency",
  "versionMismatch",
  "unexpected",
  "failedDownload",
  "failedUnzip",
  "invalidCypressEnv"
]

exports['errors .errors.formErrorText returns fully formed text message 1'] = `
Your system is missing the dependency: XVFB

Install XVFB and run Cypress again.

Read our documentation on dependencies for more information:

https://on.cypress.io/required-dependencies

If you are using Docker, we provide containers with all required dependencies installed.
----------

Platform: test platform (test release)
Cypress Version: 1.2.3
`
