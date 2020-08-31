/// <reference types="cypress" />
/// <reference types="../../lib" />
import { HelloX } from './hello-x.jsx'
import React from 'react'
import { mount } from 'cypress-react-unit-test'

/* eslint-env mocha */
describe('HelloX component', () => {
  it('works', () => {
    mount(<HelloX name="SuperMan" />)
    cy.contains('Hello SuperMan!')
  })

  it('renders Unicode', () => {
    mount(<HelloX name="🌎" />)
    cy.contains('Hello 🌎!')
    // for now disabled Percy in support commands
    // to make the bundles smaller and faster
    // cy.percySnapshot('Hello globe')
    cy.wait(1000)
  })
})
