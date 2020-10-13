/// <reference types="cypress" />
/// <reference types="../../lib" />
import React from 'react'

/* eslint-env mocha */
describe.skip('Empty div jsx', () => {
  it('works with El', () => {
    const El = () => <div>foo</div>
    cy.mount(<El></El>)
  })

  it('works with div', () => {
    cy.mount(<div>I am a div</div>)
    cy.contains('I am a div').should('be.visible')
  })
})
