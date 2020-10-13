import React from 'react'
import { mount } from 'cypress-react-unit-test'

const Button = ({ children, ...rest }) => {
  return <button {...rest}>{children}</button>
}

describe('Component spec in typescript', () => {
  it('works', () => {
    mount(<Button>Button Label</Button>)
    cy.contains('button', 'Button Label').should('be.visible')
  })
})
