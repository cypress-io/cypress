// you can import CSS directly to experiment with component styles
import './styles/main.generated.css'
import React from 'react'
import { mount } from '@cypress/react'

describe('Different styles', () => {
  it('shows button styles', () => {
    mount(
      <div className="h-full bg-green-300 m-4 p-4">
        <h2 className="text-green-900">We got buttons</h2>
        <button className="rounded font-bold bg-blue-500 m-2 text-white py-2 px-4 hover:bg-blue-700">
          Big blue bold button
        </button>

        <button className="rounded font-bold bg-blue-500 m-2 py-2 px-4 text-red-700 hover:bg-blue-700">
          Big blue bold button with red text
        </button>

        <button className="rounded bg-yellow-500 m-2 text-black py-0 px-0">
          Small yellow button
        </button>
      </div>,
    )

    cy.get('button').should('have.length', 3)
  })
})
