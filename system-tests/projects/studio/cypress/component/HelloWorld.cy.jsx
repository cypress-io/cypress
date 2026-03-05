import React from 'react'
import HelloWorld from './HelloWorld.jsx'

describe('HelloWorld', () => {
  it('renders', () => {
    cy.mount(<HelloWorld name="World" />)
    cy.get('div').should('contain.text', 'Hello World')
  })
})
