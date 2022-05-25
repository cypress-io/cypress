import { mount } from 'cypress/react'
import App from './App'

it('renders App', () => {
  mount(<App />)
  cy.get('a').contains('Learn React')
})
