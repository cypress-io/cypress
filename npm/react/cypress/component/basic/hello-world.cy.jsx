import React from 'react'
import { mount } from '@cypress/react'
import { HelloWorld } from './hello-world.jsx'

describe('HelloWorld component', () => {
  it('works', () => {
    mount(<HelloWorld />)
    cy.contains('Hello World!')
  })
})
