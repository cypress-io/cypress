import React from 'react'
import { mount } from 'cypress/react'

class Hello extends React.Component {
  render () {
    return React.createElement('div', { className: 'my-class-name' }, `Hello ${this.props.toWhat}`)
  }
}

it('works', () => {
  const HelloWorldComponent = React.createElement(Hello, { toWhat: 'World' }, null)

  mount(HelloWorldComponent)
  cy.get('.my-class-name').should('exist')
})
