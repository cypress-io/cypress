/// <reference types="cypress" />

// register the plugin multiple times
// to simulate including from support and spec files
// https://github.com/cypress-io/cypress-grep/issues/59
require('@cypress/grep/src/support')()
require('@cypress/grep/src/support')()
require('@cypress/grep/src/support')()

it('hello world', () => {})
