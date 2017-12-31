import { HelloWorld } from '../../src/hello-world.jsx'
import React from 'react'
import { mount } from '../../lib'

/* eslint-env mocha */
describe('HelloWorld component', () => {
  it('works', () => {
    mount(<HelloWorld />)
    cy.contains('Hello World!')
  })
})
