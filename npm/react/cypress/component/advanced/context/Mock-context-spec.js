import React from 'react'
import { mount } from 'cypress-react-unit-test'
import { ThemeContext } from './context'
import { Toolbar } from './Toolbar.jsx'

describe('Mocking context', () => {
  it('passes given value', () => {
    mount(
      <ThemeContext.Provider value="mocked">
        <Toolbar />
      </ThemeContext.Provider>,
    )
    // the label "mocked" was passed through React context
    cy.contains('button', 'mocked').should('be.visible')
  })
})
