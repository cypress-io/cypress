import React from 'react'
import { mount } from 'cypress-react-unit-test'

describe('Clicker', () => {
  const Clicker = ({ click }) => (
    <div>
      <button onClick={click}>Click me</button>
    </div>
  )

  it('calls the click prop twice', () => {
    const onClick = cy.stub()
    mount(<Clicker click={onClick} />)
    cy.get('button')
      .click()
      .click()
      .then(() => {
        // works in this case, but not recommended
        // because https://on.cypress.io/then does not retry
        expect(onClick).to.be.calledTwice
      })
  })

  it('calls the click prop: best practice', () => {
    const onClick = cy.stub().as('clicker')
    mount(<Clicker click={onClick} />)
    cy.get('button')
      .click()
      .click()

    // good practice 💡
    // auto-retry the stub until it was called twice
    cy.get('@clicker').should('have.been.calledTwice')
  })
})
