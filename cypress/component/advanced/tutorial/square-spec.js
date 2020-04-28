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
})
