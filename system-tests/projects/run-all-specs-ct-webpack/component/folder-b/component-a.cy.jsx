import React from 'react'
import ComponentA from './component-a'

describe('<ComponentA />', () => {
  it('renders', () => {
    cy.mount(<ComponentA />)
    cy.get('h1').should('have.text', 'I am Component A')

    // Cypress.spec must identify this file even when running via "Run All Specs" (#3090)
    expect(Cypress.spec.relative.replace(/\\/g, '/')).to.eq('component/folder-b/component-a.cy.jsx')
    expect(Cypress.spec.name).to.eq('component-a.cy.jsx')
  })
})
