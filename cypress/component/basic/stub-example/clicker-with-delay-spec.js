import React from 'react'
import { mount } from 'cypress-react-unit-test'

describe('Clicker with delay', () => {
  const Clicker = ({ click }) => (
    <div>
      <button onClick={() => setTimeout(click, 500)}>Click me</button>
    </div>
  )

  // Skipped because .then does not retry
  // and will fail as soon as "expect" throws an error
  it.skip('calls the click prop: then', () => {
    const onClick = cy.stub()
    mount(<Clicker click={onClick} />)
    cy.get('button')
      .click()
      .click()
      .then(() => {
        expect(onClick).to.be.calledTwice
      })
  })

  it('calls the click prop: should', () => {
    const onClick = cy.stub()
    mount(<Clicker click={onClick} />)
    cy.get('button')
      .click()
      .click()
      // test works because .should retries the assertion
      // and in this case it will not click multiple times
      // but just retry the assertion
      .should(() => {
        expect(onClick).to.be.calledTwice
      })
  })

  it('calls the click prop', () => {
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
