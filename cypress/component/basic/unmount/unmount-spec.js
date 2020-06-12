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

    // after we have confirmed the component exists
    // we can remove it asynchronously
    cy.then(() => {
      // now unmount the mounted component
      unmount()
    })

    // the component is gone from the DOM
    cy.contains('My component').should('not.exist')
    // the component has called the prop on unmount
    cy.get('@onUnmount').should('have.been.calledOnce')
  })
})
