import React, { Component } from 'react'

class Comp extends Component {
  componentWillUnmount () {
    // simply calls the prop
    this.props.onUnmount()
  }

  render () {
    return <div>My component</div>
  }
}

describe('Comp with componentWillUnmount', () => {
  it('calls the prop', () => {
    cy.mount(<Comp onUnmount={cy.stub().as('onUnmount')} />)
    cy.contains('My component')

    // after we have confirmed the component exists let's remove it
    // mount something else so that unmount is called
    cy.mount(<div>Test Component</div>)

    // the previous component is gone from the DOM
    cy.contains('My component').should('not.exist')
    // the component has called the prop on unmount
    cy.get('@onUnmount').should('have.been.calledOnce')
  })
})

describe('mount cleanup', () => {
  beforeEach(() => {
    cy.contains('My Component').should('not.exist')
  })

  for (const num of [1, 2]) {
    it(`mount ${num}`, () => {
      cy.mount(<Comp onUnmount={() => {}} />)
      cy.contains('My component')
    })
  }
})
