import React from 'react'
import Button from './pure-component'
import { mount } from '@cypress/react'

describe('Button pure component', function () {
  it('works', function () {
    mount(<Button>Hello</Button>)
    cy.contains('Hello')
  })
})
