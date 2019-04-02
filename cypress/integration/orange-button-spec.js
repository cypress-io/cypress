/// <reference types="cypress" />
import React from 'react'
import './Button.css'

class Button extends React.Component {
  handleClick () {
    this.props.clickHandler(this.props.name)
  }

  render () {
    const className = [
      'component-button',
      this.props.orange ? 'orange' : '',
      this.props.wide ? 'wide' : ''
    ]

    return (
      <div className={className.join(' ').trim()}>
        <button onClick={this.handleClick.bind(this)}>{this.props.name}</button>
      </div>
    )
  }
}

describe('Button', () => {
  it('can be orange', () => {
    cy.mount(<Button name='Orange' orange />)
    cy.get('.component-button')
      .should('have.class', 'orange')
      .find('button')
      .should('have.css', 'background-color', 'rgb(245, 146, 62)')
    cy.percySnapshot()
  })
})
