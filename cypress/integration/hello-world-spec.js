import { HelloWorld } from '../../src/hello-world.jsx'
import React from 'react'

/* eslint-env mocha */
describe('HelloWorld component', () => {
  it('works', () => {
    cy.mount(<HelloWorld />)
    cy.contains('Hello World!')
  })
})
