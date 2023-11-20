import React from 'react'
import { mount } from 'cypress/react18'

export const App = () => {
  return (
    <div className='bg-red-100' id='hello'>
      Hello
    </div>
  )
}

it('works', () => {
  mount(<App />)
  cy.get('#hello').should('have.css', 'background-color', 'rgb(254, 226, 226)')
})
