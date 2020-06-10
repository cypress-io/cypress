/// <reference types="cypress" />
const React = require('react')
const { mount } = require('cypress-react-unit-test')
const Component = require('./ComponentReq.jsx').default
const calc = require('./calc')

describe('Component', () => {
  it('mocks call from the component', () => {
    cy.stub(calc, 'getRandomNumber')
      .as('lucky')
      .returns(777)
    mount(<Component />)
  })
})
