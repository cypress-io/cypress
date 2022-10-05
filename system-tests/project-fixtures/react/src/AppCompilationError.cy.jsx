import React from 'react'
import { App } from './App'

it('renders hello world', () => {
  cy.mount(<App />)
  cy.get('h1').contains('Hello World')
}
})
