/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'

describe('Alias', () => {
  it('returns component by its name', () => {
    const Greeting = () => <div>Hello!</div>
    mount(<Greeting />)
    // get the component instance by name "Greeting"
    cy.get('@Greeting')
      .its('props')
      .should('be.empty')
    // the component was constructed from the function Greeting
    cy.get('@Greeting')
      .its('type')
      .should('equal', Greeting)
  })

  it('returns component by given display name', () => {
    const GreetingCard = props => <div>Hello {props.name}!</div>
    mount(<GreetingCard name="World" />, { alias: 'Hello' })
    cy.get('@Hello')
      .its('props')
      .should('deep.equal', {
        name: 'World',
      })
  })
})
