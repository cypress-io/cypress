exports['lib/browsers/index .ensureAndGetByNameOrPath throws when no browser can be found 1'] = `
Browser: browserNotGonnaBeFound was not found on your system or is not supported by Cypress.

Cypress supports the following browsers:
 - chrome
 - chromium
 - chrome-for-testing
 - edge
 - firefox

You can also use a custom browser: https://on.cypress.io/customize-browsers

Available browsers found on your system are:
 - chrome
 - firefox
`

exports['lib/browsers/index .ensureAndGetByNameOrPath throws a special error when canary is passed 1'] = `
Browser: canary was not found on your system or is not supported by Cypress.

Cypress supports the following browsers:
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
`
