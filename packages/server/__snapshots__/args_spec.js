exports['invalid env error'] = `
Cypress encountered an error while parsing the argument env

You passed: nonono

The error was: Cannot parse as valid JSON
`

exports['invalid reporter options error'] = `
Cypress encountered an error while parsing the argument reporterOptions

You passed: abc

The error was: Cannot parse as valid JSON
`

exports['invalid config error'] = `
Cypress encountered an error while parsing the argument config

You passed: xyz

The error was: Cannot parse as valid JSON
`

exports['invalid spec error'] = `
Cypress encountered an error while parsing the argument spec

You passed: [object Object]

The error was: spec must be a string or comma-separated list
`
