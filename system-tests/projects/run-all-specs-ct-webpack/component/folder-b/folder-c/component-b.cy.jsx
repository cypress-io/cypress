import React from 'react'
import ComponentB from './component-b'

describe('<ComponentB />', () => {
  it('renders', () => {
    cy.mount(<ComponentB />)
    cy.get('h1').should('have.text', 'I am Component B')

    expect(Cypress.spec.relative.replace(/\\/g, '/')).to.eq('component/folder-b/folder-c/component-b.cy.jsx')
    expect(Cypress.spec.name).to.eq('component-b.cy.jsx')
  })
})
