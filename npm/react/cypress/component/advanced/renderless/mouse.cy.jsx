/// <reference types="cypress" />
import React from 'react'
import { mount } from '@cypress/react'
import MouseMovement from './mouse-movement'

describe('Renderless component', () => {
  it('works', () => {
    const onMoved = cy.stub()

    mount(<MouseMovement onMoved={onMoved} />)
    cy.get('[data-cy-root]').should('be.empty')
    cy.document()
    .trigger('mousemove')
    .then(() => {
      expect(onMoved).to.have.been.calledWith(true)
    })

    // mount something else to trigger unmount and stop log flow
    mount(<div>Test Component</div>)
  })
})
