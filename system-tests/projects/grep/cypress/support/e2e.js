/// <reference types="cypress" />

require('./commands')

import cypressGrep from '@cypress/grep/src/support'

// register the grep feature
// https://github.com/cypress-io/cypress-grep
cypressGrep()
