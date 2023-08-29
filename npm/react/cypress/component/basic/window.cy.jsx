/// <reference types="cypress" />
import React from 'react'
import { mount } from '@cypress/react'

export class Component extends React.Component {
  constructor (props) {
    super(props)
    console.log(
      'set window.counter to this component in window',
      window.location.pathname,
    )

    window.component = this
  }

  render () {
    return <p>component</p>
  }
}

it('has the same window from the component as from test', () => {
  cy.window()
  .its('location')
  .should('have.property', 'pathname')
  .and('not.equal', 'blank')

  mount(<Component />)
  cy.contains('component')
  cy.window()
  .its('location.search')
  // this filename
  .should('match', /window.cy.jsx$/)

  // the window should have property set by the component
  cy.window().should('have.property', 'component')
})
