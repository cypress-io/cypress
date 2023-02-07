exports['invalid env error'] = `
Cypress encountered an error while parsing the argument: --env

You passed: nonono

The error was: Cannot parse as valid JSON
`

exports['invalid reporter options error'] = `
Cypress encountered an error while parsing the argument: --reporterOptions

You passed: abc

The error was: Cannot parse as valid JSON
`

exports['invalid config error'] = `
Cypress encountered an error while parsing the argument: --config

You passed: xyz

The error was: Cannot parse as valid JSON
`

exports['invalid spec error'] = `
Cypress encountered an error while parsing the argument: --spec

You passed: {}

The error was: spec must be a string or comma-separated list
`

exports['invalid --auto-cancel-after-failures error'] = `
Cypress encountered an error while parsing the argument: --auto-cancel-after-failures

You passed: foo

The error was: auto-cancel-after-failures must be an integer or false
`

exports['invalid --auto-cancel-after-failures (true) error'] = `
Cypress encountered an error while parsing the argument: --auto-cancel-after-failures

You passed: true

The error was: auto-cancel-after-failures must be an integer or false
`

exports['invalid --auto-cancel-after-failures (negative value) error'] = `
Cypress encountered an error while parsing the argument: --auto-cancel-after-failures

You passed: true

The error was: auto-cancel-after-failures must be an integer or false
`

exports['invalid --auto-cancel-after-failures (decimal value) error'] = `
Cypress encountered an error while parsing the argument: --auto-cancel-after-failures

You passed: 1.5

The error was: auto-cancel-after-failures must be an integer or false
`
