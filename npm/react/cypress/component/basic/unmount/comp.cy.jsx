/// <reference types="cypress" />
import Comp from './comp.jsx'
import React from 'react'
import { mount, unmount } from '@cypress/react'

it('calls callbacks on mount and unmount', () => {
  const onMount = cy.stub()
  const onUnmount = cy.stub()

  // mount is an async call
  mount(<Comp onMount={onMount} onUnmount={onUnmount} />)
  cy.then(() => {
    expect(onMount).to.have.been.calledOnce
    expect(onUnmount).to.have.not.been.called
  })

  cy.contains('Component with').should('be.visible')

  let stub = cy.stub()

  try {
    unmount()
  } catch (e) {
    expect(e.message).to.eq('`unmount` is no longer supported.')
    stub()
  }

  expect(stub).to.have.been.calledOnce
})
