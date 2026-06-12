import React from 'react'
import ComponentA from './component-a'

describe('<ComponentA />', () => {
  it('renders', () => {
    cy.mount(<ComponentA />)
    cy.get('h1').should('have.text', 'I am Component A')

    expect(Cypress.spec.relative.replace(/\\/g, '/')).to.eq('component/folder-b/folder-c/component-a.cy.tsx')
    expect(Cypress.spec.name).to.eq('component-a.cy.tsx')
  })
})
