/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import Post from './Post'
import * as calc from './calc'

// confirm the Post component that imports and calls the "getRandomNumber"
// renders the mock value because the test stubs it
describe('Mocking', () => {
  it('mocks import used by the Post', () => {
    cy.stub(calc, 'getRandomNumber')
      .as('lucky')
      .returns(777)
    mount(<Post title="post title" children="post text" />)
    cy.contains('.random', '777')
  })
})
