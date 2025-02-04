/// <reference types="cypress" />
import React, { useState } from 'react'
import { mount } from '@cypress/react'
import './tic-tac-toe.css'

// let's put React component right in the spec file
export default function Square ({ value: valueAsProp }) {
  const [valueAsState, setValueAsState] = useState(null)

  return (
    <button className="square" onClick={() => setValueAsState(valueAsProp)}>
      {valueAsState}
    </button>
  )
}

describe('Square', () => {
  it('changes value on click', () => {
    const selector = 'button.square'

    mount(<Square value="X" />)
    // initially button is blank
    cy.get(selector).should('have.text', '')
    // but it changes text on click
    cy.get(selector)
    .click()
    .should('have.text', 'X')
  })

  it('looks good', () => {
    mount(<Square />)

    // pause to show it
    cy.wait(1000)
    cy.get('.square').click()
    cy.wait(1000)

    cy.get('.square')
    .should('have.css', 'background-color', 'rgb(255, 255, 255)')
    .and('have.css', 'border', '1px solid rgb(153, 153, 153)')
  })
})
