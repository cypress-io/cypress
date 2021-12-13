import React from 'react'
import { mount } from '@cypress/react'

const Comp = () => {
  return React.createElement('div', {}, 'Hello world')
}

describe('React', () => {
  it('renders a react component', () => {
    mount(React.createElement(Comp))
    cy.get('div').contains('Hello world')
  })
})
