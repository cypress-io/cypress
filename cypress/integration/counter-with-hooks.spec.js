/// <reference types="cypress" />
/// <reference types="../../lib" />

import React from 'react'
import CounterWithHooks from '../../src/counter-with-hooks.jsx'

/* eslint-env mocha */
describe('CounterWithHooks component', function () {
  it.skip('works', function () {
    cy.mount(<CounterWithHooks initialCount={3} />)
    cy.contains('3')
  })
})
