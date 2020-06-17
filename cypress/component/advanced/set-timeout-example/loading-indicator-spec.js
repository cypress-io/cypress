import React from 'react'
import { unmountComponentAtNode } from 'react-dom'
import { mount } from 'cypress-react-unit-test'
import LoadingIndicator from './LoadingIndicator'

// compare these tests to Jest + Enzyme tests in
// https://github.com/bruceharris/react-unit-testing-example/blob/main/src/components/LoadingIndicator.test.js

describe('LoadingIndicator', () => {
  describe('when isLoading is false', () => {
    it('should render children', () => {
      mount(
        <LoadingIndicator isLoading={false}>
          <div>ahoy!</div>
        </LoadingIndicator>,
      )
      cy.contains('div', 'ahoy!')
    })
  })

  describe('when isLoading is true', () => {
    describe('given 200ms have not yet elapsed', () => {
      it('should render nothing', () => {
        mount(
          <LoadingIndicator isLoading={true}>
            <div>ahoy!</div>
          </LoadingIndicator>,
        )
        cy.contains('loading...').should('be.visible')
        cy.contains('ahoy!').should('not.exist')
      })
    })

    describe('given 2000ms have elapsed', () => {
      it('should render loading indicator (waits 2 seconds)', () => {
        mount(
          <LoadingIndicator isLoading={true}>
            <div>ahoy!</div>
          </LoadingIndicator>,
        )
        // this test runs for 2 seconds, since it just waits for the
        // loading indicator to show up after "setTimeout"
        cy.contains('loading...', { timeout: 2100 }).should('be.visible')
      })

      it('should render loading indicator (mocks clock)', () => {
        cy.clock()
        mount(
          <LoadingIndicator isLoading={true}>
            <div>ahoy!</div>
          </LoadingIndicator>,
        )
        // force 2 seconds to pass instantly
        // and component's setTimeout to fire
        cy.tick(2010)
        cy.contains('loading...', { timeout: 100 }).should('be.visible')
      })
    })
  })

  describe('on unmount', () => {
    it('should clear timeout', () => {
      cy.clock()
      cy.window().then(win => cy.spy(win, 'clearTimeout').as('clearTimeout'))

      mount(
        <LoadingIndicator isLoading={true}>
          <div>ahoy!</div>
        </LoadingIndicator>,
      )
      cy.tick(2010)
      cy.get('#cypress-root').then($el => {
        unmountComponentAtNode($el[0])
      })
      cy.get('@clearTimeout').should('have.been.calledOnce')
    })
  })

  afterEach(() => {
    cy.get('#cypress-root').then($el => {
      unmountComponentAtNode($el[0])
    })
  })
})
