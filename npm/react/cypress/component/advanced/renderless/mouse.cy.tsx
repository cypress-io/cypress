import React from 'react'
import { mount } from '@cypress/react'
import MouseMovement from './mouse-movement'

describe('Renderless component', () => {
  it('works', () => {
    const onMoved = cy.stub()

    cy.document().then((doc) => cy.spy(doc, 'addEventListener').as('addEventListener'))

    mount(<MouseMovement onMoved={onMoved} />)
    cy.get('[data-cy-root]').should('be.empty')
    // the listener is added in an effect after render, so a mousemove fired
    // before then would be missed
    cy.get('@addEventListener').should('have.been.calledWith', 'mousemove')
    cy.document()
    .trigger('mousemove')
    .then(() => {
      expect(onMoved).to.have.been.calledWith(true)
    })

    // mount something else to trigger unmount and stop log flow
    mount(<div>Test Component</div>)
  })
})
