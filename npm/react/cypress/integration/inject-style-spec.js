// <reference types="cypress" />
/// <reference types="../../lib" />
import React from 'react'

class Button extends React.Component {
  handleClick() {
    this.props.clickHandler(this.props.name)
  }

  render() {
    const className = [
      'component-button',
      this.props.orange ? 'orange' : '',
      this.props.wide ? 'wide' : '',
    ]

    return (
      <div className={className.join(' ').trim()}>
        <button onClick={this.handleClick.bind(this)}>{this.props.name}</button>
      </div>
    )
  }
}

describe.skip('Injecting style', () => {
  it('can be passed as an option', () => {
    const style = `
      .component-button {
        display: inline-flex;
        width: 25%;
        flex: 1 0 auto;
      }

      .component-button.orange button {
        background-color: #F5923E;
        color: white;
      }
    `
    cy.mount(<Button name="Orange" orange />, null, { style })
    cy.get('.orange button').should(
      'have.css',
      'background-color',
      'rgb(245, 146, 62)',
    )
  })

  it('read CSS file and pass as style', () => {
    cy.readFile('cypress/integration/Button.css').then(style => {
      cy.mount(<Button name="Orange" orange />, null, { style })
    })

    cy.get('.component-button')
      .should('have.class', 'orange')
      .find('button')
      .should('have.css', 'background-color', 'rgb(245, 146, 62)')
  })

  it('can be read automatically', () => {
    const cssFile = 'cypress/integration/Button.css'
    cy.mount(<Button name="Orange" orange />, null, { cssFile })
    cy.get('.orange button').should(
      'have.css',
      'background-color',
      'rgb(245, 146, 62)',
    )
  })

  context('read CSS file once', () => {
    before(() => {
      // .as('style') will save the loaded CSS text
      // in the text context property "style"
      cy.readFile('cypress/integration/Button.css').as('style')
    })

    it('is orange', function() {
      // notice we use "function () {}" callback
      // to get the test context "this" to be able to use "this.style"
      cy.mount(<Button name="Orange" orange />, null, { style: this.style })

      cy.get('.orange button').should(
        'have.css',
        'background-color',
        'rgb(245, 146, 62)',
      )
    })

    it('is orange again', function() {
      cy.mount(<Button name="Orange" orange />, null, { style: this.style })

      cy.get('.orange button').should(
        'have.css',
        'background-color',
        'rgb(245, 146, 62)',
      )
    })
  })
})
