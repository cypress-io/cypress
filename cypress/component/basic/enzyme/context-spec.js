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
  })
})
