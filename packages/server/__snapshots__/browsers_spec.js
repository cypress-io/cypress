exports['lib/browsers/index .ensureAndGetByNameOrPath throws when no browser can be found 1'] = `
The specified browser was not found on your system or is not supported by Cypress: \`browserNotGonnaBeFound\`

Cypress supports the following browsers:
- chrome
- chromium
- edge
- electron
- firefox

You can also [use a custom browser](https://on.cypress.io/customize-browsers).

Available browsers found on your system are:
- chrome
- firefox
- electron

Read more about [how to troubleshoot launching browsers](https://on.cypress.io/troubleshooting-launching-browsers).
`

exports['lib/browsers/index .ensureAndGetByNameOrPath throws a special error when canary is passed 1'] = `
The specified browser was not found on your system or is not supported by Cypress: \`canary\`

Cypress supports the following browsers:
- chrome
- chromium
- edge
- electron
- firefox

You can also [use a custom browser](https://on.cypress.io/customize-browsers).

Available browsers found on your system are:
- chrome
- chrome:canary
- firefox

Read more about [how to troubleshoot launching browsers](https://on.cypress.io/troubleshooting-launching-browsers).

Note: In Cypress version 4.0.0, Canary must be launched as \`chrome:canary\`, not \`canary\`.

See https://on.cypress.io/migration-guide for more information on breaking changes in 4.0.0.
`
