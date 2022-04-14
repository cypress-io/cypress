import React from 'react'
import { mount } from '@cypress/react'

const Comp = () => {
  return <div>Hello world!</div>
}

describe('React', () => {
  it('renders a react component', () => {
    mount(<Comp />)
    cy.get('div').contains('Hello world')
  })
})
