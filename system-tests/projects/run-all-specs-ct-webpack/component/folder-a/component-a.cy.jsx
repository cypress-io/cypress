import React from 'react'
import ComponentA from './component-a'

describe('<ComponentA />', () => {
  it('renders', () => {
    cy.mount(<ComponentA />)
    cy.get('h1').should('have.text', 'I am Component A')

    expect(Cypress.spec.relative.replace(/\\/g, '/')).to.eq('component/folder-a/component-a.cy.jsx')
    expect(Cypress.spec.name).to.eq('component-a.cy.jsx')
  })
})
