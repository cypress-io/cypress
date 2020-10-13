/// <reference types="cypress" />
import { mount } from 'cypress-react-unit-test'
import HelloWorld from '../../components/HelloWorld.mdx'

describe('MDX component', () => {
  it('Renders using  custom next.config.js', () => {
    mount(<HelloWorld />)

    cy.contains('Hello').should('have.css', 'fontWeight', '700')
    cy.contains('This is JSX')
      .parent()
      .should('have.css', 'background-color', 'rgb(255, 99, 71)')
  })
})
