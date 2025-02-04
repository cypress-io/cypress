exports['lib/browsers/index .ensureAndGetByNameOrPath throws when no browser can be found 1'] = `
Can't run because you've entered an invalid browser name.

Browser: browserNotGonnaBeFound was not found on your system or is not supported by Cypress.

Cypress supports the following browsers:
 - electron
 - chrome
 - chromium
 - chrome-for-testing
 - edge
 - firefox

You can also use a custom browser: https://on.cypress.io/customize-browsers

Available browsers found on your system are:
 - chrome
 - firefox
 - electron
`

exports['lib/browsers/index .ensureAndGetByNameOrPath throws a special error when canary is passed 1'] = `
Can't run because you've entered an invalid browser name.

Browser: canary was not found on your system or is not supported by Cypress.

Cypress supports the following browsers:
 - electron
 - chrome
 - chromium
 - chrome-for-testing
 - edge
 - firefox

You can also use a custom browser: https://on.cypress.io/customize-browsers

Available browsers found on your system are:
 - chrome
 - chrome:canary
 - firefox

Note: In Cypress version 4.0.0, Canary must be launched as chrome:canary, not canary.

See https://on.cypress.io/migration-guide for more information on breaking changes in 4.0.0.
`
