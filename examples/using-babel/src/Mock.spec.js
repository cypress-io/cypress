/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import Post from './Post'
import * as calc from './calc'

describe('Mocking', () => {
  // https://github.com/bahmutov/cypress-react-unit-test/issues/266
  it.skip('mocks import used by the Post', () => {
    cy.stub(calc, 'getRandomNumber')
      .as('lucky')
      .returns(777)
    mount(<Post title="post title" children="post text" />)
    cy.contains('.random', '777')
  })
})
