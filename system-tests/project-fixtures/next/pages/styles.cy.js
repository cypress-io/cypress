import { mount } from 'cypress/react'
import Index from './index.js'

describe('<Index />', () => {
  it('renders', () => {
    mount(<Index />)
    cy.contains('h1', 'Welcome to Next.js!')
    // Verifying that global styles can be imported into support file:
    // Relevant file: system-tests/project-fixtures/next/styles/globals.css
    cy.get('body').should('have.css', 'background-color', 'rgb(204, 255, 255)')
  })
})
