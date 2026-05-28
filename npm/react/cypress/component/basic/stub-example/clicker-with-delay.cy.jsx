import React from 'react'
import { mount } from '@cypress/react'

describe('Clicker with delay', () => {
  const Clicker = ({ click }) => {
    return (
      <div>
        <button onClick={() => setTimeout(click, 500)}>Click me</button>
      </div>
    )
  }

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
