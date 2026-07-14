import { mount } from 'cypress/react'
import App from './App'

it('mounts a React component compiled under typescript@7', () => {
  mount(<App name="Vite" />)
  cy.contains('h1', 'Hello Vite from TypeScript 7')
})
