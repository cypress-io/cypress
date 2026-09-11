import React from 'react'
import { mount } from 'cypress/react'

const App = () => {
  return (
    <div className='bg-red-100' id='hello'>
      Hello
    </div>
  )
}

it('works', () => {
  mount(<App />)

  cy.get('#hello').should('have.css', 'background-color', 'oklch(0.936 0.032 17.717)')
})
