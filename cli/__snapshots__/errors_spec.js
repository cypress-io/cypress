exports['errors individual has the following errors 1'] = [
  'missingXvfb',
  'missingApp',
  'missingDependency',
  'versionMismatch',
  'unexpected',
  'failedDownload',
  'failedToUnzip',
]

exports['errors individual #missingXvfb is an error information object 1'] = {
  'description': 'Looks like your system is missing a must have dependency: XVFB',
  'solution': 'Install XVFB and run Cypress again.\nOur CI documentation provides more information how to configure dependencies\n\n  https://on.cypress.io/required-dependencies',
}

exports['errors #formError adds platform info to error 1'] = {
  'description': 'Looks like your system is missing a must have dependency: XVFB',
  'solution': 'Install XVFB and run Cypress again.\nOur CI documentation provides more information how to configure dependencies\n\n  https://on.cypress.io/required-dependencies',
  'platform': 'Platform: test platform\nVersion: test release',
}

exports['errors #formErrorText returns fully formed text message 1'] = `----------
Looks like your system is missing a must have dependency: XVFB
Install XVFB and run Cypress again.
Our CI documentation provides more information how to configure dependencies

https://on.cypress.io/required-dependencies
----------

test error

----------
Platform: test platform
Version: test release`

