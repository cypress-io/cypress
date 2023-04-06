/// <reference types="cypress" />
import React from 'react'
import { mount } from '@cypress/react'
import MouseMovement from './mouse-movement'

describe('Renderless component', () => {
  it('works', () => {
    // let's also spy on "console.log" calls
    // to make sure the entire sequence of calls happens
    cy.window()
    .its('console')
    .then((console) => {
      cy.spy(console, 'log').as('log')
    })

    const onMoved = cy.stub()

    mount(<MouseMovement onMoved={onMoved} />)
    cy.get('[data-cy-root]').should('be.empty')
    cy.document()
    .trigger('mousemove')
    .then(() => {
      expect(onMoved).to.have.been.calledWith(true)
    })

    // mount something else to trigger unmount
    mount(<div>Test Component</div>)

    cy.get('@log')
    .its('callCount')
    .should('equal', 4)

    cy.get('@log')
    .invoke('getCalls')
    .then((calls) => {
      return calls.map((call) => {
        console.log('one', call.args[0])

        return call.args[0]
      })
    })
    .should('deep.equal', [
      'MouseMovement constructor',
      'MouseMovement componentWillMount',
      'MouseMovement onMouseMove',
      'MouseMovement componentWillUnmount',
    ])
  })
})
