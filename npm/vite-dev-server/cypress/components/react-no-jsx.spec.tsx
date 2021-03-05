import React from 'react'
import { mount } from '@cypress/react'
import { Foo } from './Foo'

describe('React', () => {
  it('renders a react component', () => {
    mount(<Foo />)
    cy.get('div').contains('Hello world')
  })
})
