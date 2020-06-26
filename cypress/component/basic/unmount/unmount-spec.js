/// <reference types="cypress" />
import React, { Component } from 'react'
import { mount, unmount } from 'cypress-react-unit-test'

class Comp extends Component {
  componentWillUnmount() {
    // simply calls the prop
    this.props.onUnmount()
  }

  render() {
    return <div>My component</div>
  }
}

describe('Comp with componentWillUnmount', () => {
  it('calls the prop', () => {
    mount(<Comp onUnmount={cy.stub().as('onUnmount')} />)
    cy.contains('My component')

    // after we have confirmed the component exists let's remove it
    // unmount() command is automatically enqueued
    unmount()

    // the component is gone from the DOM
    cy.contains('My component').should('not.exist')
    // the component has called the prop on unmount
    cy.get('@onUnmount').should('have.been.calledOnce')
  })

  it('can be called using then', () => {
    mount(<Comp onUnmount={cy.stub().as('onUnmount')} />)
    cy.contains('My component')

    // still works, should probably be removed in v5
    cy.then(unmount)

    // the component is gone from the DOM
    cy.contains('My component').should('not.exist')
    // the component has called the prop on unmount
    cy.get('@onUnmount').should('have.been.calledOnce')
  })
})
