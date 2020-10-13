/// <reference types="cypress" />
/// <reference types="../../lib" />

import React from 'react'
import Button from './pure-component.jsx'
import { mount } from 'cypress-react-unit-test'

/* eslint-env mocha */
describe('Button pure component', function() {
  it('works', function() {
    mount(<Button>Hello</Button>)
    cy.contains('Hello')
  })
})
