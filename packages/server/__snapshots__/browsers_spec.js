exports['lib/browsers/index .ensureAndGetByNameOrPath throws a special error when canary is passed 1'] = `
Can't run because you've entered a browser that is not supported by Cypress.

Browser: canary is not supported by Cypress.

Cypress supports the following browsers:
 - electron
 - chrome
 - chromium
 - chrome:canary
 - edge
 - firefox
 - webkit

Available browsers found on your system are:
 - chrome
 - chrome:canary
 - firefox

Note: Since Cypress version 4.0.0, Canary must be launched as chrome:canary, not canary.

See https://on.cypress.io/migration-guide for more information on breaking changes in 4.0.0.
`

exports['lib/browsers/index .ensureAndGetByNameOrPath throws when no browser not found by name 1'] = `
Browser: webkit was not found on your system.

Cypress supports the following browsers:
 - electron
 - chrome
 - chromium
 - chrome:canary
 - edge
 - firefox
 - webkit

You can also use a custom browser: https://on.cypress.io/customize-browsers

Available browsers found on your system are:
 - chrome
 - firefox
 - electron
`

exports['lib/browsers/index .ensureAndGetByNameOrPath throws when no browser not found by path 1'] = `
We could not identify a known browser at the path you provided: /path/to/browser/edge

Read more about how to troubleshoot launching browsers: https://on.cypress.io/troubleshooting-launching-browsers

The output from the command we ran was:

Unable to find browser with path /path/to/browser/edge
`

exports['lib/browsers/index .ensureAndGetByNameOrPath throws when browser not supported 1'] = `
Can't run because you've entered a browser that is not supported by Cypress.

Browser: browserNotGonnaBeFound is not supported by Cypress.

Cypress supports the following browsers:
 - electron
 - chrome
 - chromium
 - chrome:canary
 - edge
 - firefox
 - webkit

Available browsers found on your system are:
 - chrome
 - firefox
 - electron
`
