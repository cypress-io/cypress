import { Counter } from '../../src/counter.jsx'
import React from 'react'
import { mount } from '../../lib'

/* eslint-env mocha */
describe('Counter', () => {
  it('counts clicks', () => {
    mount(<Counter />)
    cy.contains('count: 0')
      .click()
      .contains('count: 1')
      .click()
      .contains('count: 2')
  })
})
