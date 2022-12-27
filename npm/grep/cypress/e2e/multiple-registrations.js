/// <reference types="cypress" />

// register the plugin multiple times
// to simulate including from support and spec files
// https://github.com/cypress-io/cypress-grep/issues/59
require('../../src/support')()
require('../../src/support')()
require('../../src/support')()

it('hello world', () => {})
