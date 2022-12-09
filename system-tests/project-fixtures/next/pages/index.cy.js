import { mount } from 'cypress/react'
import Index from './index.js'

describe('<Index />', () => {
  it('renders', () => {
    mount(<Index />)
    cy.contains('h1', 'Welcome to Next.js!')
  })
})
