/// <reference types="cypress" />
import { Comp } from './comp.jsx'
import React from 'react'
import { mount } from '@cypress/react'

it('calls callbacks on mount and unmount', () => {
  const onMount = cy.stub()
  const onUnmount = cy.stub()

  // mount is an async call
  mount(<Comp onMount={onMount} onUnmount={onUnmount} />)
  cy.then(() => {
    expect(onMount).to.have.been.calledOnce
  })

  cy.contains('Component with').should('be.visible')

  // mount something else to trigger unmount
  mount(<div/>)

  cy.then(() => {
    expect(onUnmount).to.have.been.calledOnce
  })
})
