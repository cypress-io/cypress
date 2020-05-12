/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'

// let's put React component right in the spec file
class Square extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      value: null,
    }
  }

  render() {
    return (
      <button className="square" onClick={() => this.setState({ value: 'X' })}>
        {this.state.value}
      </button>
    )
  }
}

describe('Square', () => {
  it('changes value on click', () => {
    const selector = 'button.square'
    mount(<Square />)
    // initially button is blank
    cy.get(selector).should('have.text', '')
    // but it changes text on click
    cy.get(selector)
      .click()
      .should('have.text', 'X')
  })

  it('looks good', () => {
    mount(<Square />, {
      cssFile: 'cypress/component/advanced/tutorial/tic-tac-toe.css',
    })
    // pause to show it
    cy.wait(1000)
    cy.get('.square').click()
    cy.wait(1000)

    // check if style was applied
    cy.get('.square')
      .should('have.css', 'background-color', 'rgb(255, 255, 255)')
      .and('have.css', 'border', '1px solid rgb(153, 153, 153)')
  })
})
