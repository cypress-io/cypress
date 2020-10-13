/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'

const Hello = ({ children }) => {
  return (
    <>
      <div className="hello">Hello there!</div>
      {children}
    </>
  )
}

describe('mount in before hook', () => {
  // let's mount the component once
  // and then run multiple tests against it
  before(() => {
    mount(
      <Hello>
        <div className="inside">Inner div</div>
      </Hello>,
    )
  })

  it('shows Hello component', () => {
    cy.get('.hello').should('be.visible')
  })

  it('has the child component', () => {
    cy.get('.inside').should('be.visible')
  })
})
