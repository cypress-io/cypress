// you can import CSS directly to experiment with component styles
import './styles/main.generated.css'
import React from 'react'
import { mount } from 'cypress-react-unit-test'

describe('Different styles', () => {
  it('shows button styles', () => {
    mount(
      <div className="p-4 m-4 bg-green-300 h-full">
        <h2 className="text-green-900">We got buttons</h2>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 m-2 px-4 rounded">
          Big blue bold button
        </button>

        <button className="bg-blue-500 hover:bg-blue-700 text-red-700 font-bold py-2 m-2 px-4 rounded">
          Big blue bold button with red text
        </button>

        <button className="bg-yellow-500 text-black py-0 m-2 px-0 rounded">
          Small yellow button
        </button>
      </div>,
    )

    cy.get('button').should('have.length', 3)
    cy.screenshot()
  })
})
