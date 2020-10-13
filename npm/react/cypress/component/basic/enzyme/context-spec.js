/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import { SimpleContext } from './simple-context'
import { SimpleComponent } from './simple-component.jsx'

// testing components that use Context React API
// https://reactjs.org/docs/context.html
describe('Enzyme', () => {
  context('setContext', () => {
    it('does not provide the context', () => {
      mount(<SimpleComponent />)
      cy.contains('context not set').should('be.visible')
    })

    it('provides the context', () => {
      // surround the component with the real provider but
      // set the value prop to whatever the test requires
      mount(
        <SimpleContext.Provider value={{ name: 'test context' }}>
          <SimpleComponent />
        </SimpleContext.Provider>,
      )
      cy.contains('test context').should('be.visible')
    })

    it('mounts new context', () => {
      // instead of setting the context from the test
      // just mount the component again with a different provider around it
      const cmp = <SimpleComponent id="0x123" />

      mount(
        <SimpleContext.Provider value={{ name: 'first context' }}>
          {cmp}
        </SimpleContext.Provider>,
      )
      cy.contains('first context').should('be.visible')
      cy.contains('.id', '0x123').should('be.visible')

      // same component, different provider
      mount(
        <SimpleContext.Provider value={{ name: 'second context' }}>
          {cmp}
        </SimpleContext.Provider>,
      )
      cy.contains('second context').should('be.visible')
      cy.contains('.id', '0x123').should('be.visible')
    })
  })
})
