import React from 'react'
import { mount } from '@cypress/react'
import { Foo } from './Foo'

describe('React', () => {
  it('renders a react component #1', () => {
    mount(<Foo />)
    cy.get('div').contains('Hello world')
  })

  it('renders a react component #2', () => {
    mount(<Foo />)
    cy.get('div').contains('Hello world')
  })

  it('renders a react component #3', () => {
    mount(<Foo />)
    cy.get('div').contains('Hello world')
  })

  it('renders a react component #4', () => {
    mount(<Foo />)
    cy.get('div').contains('Hello world')
  })
})
