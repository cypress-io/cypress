/// <reference types="cypress" />
// compare to App.test.js
import React from 'react'
import App from './App'
import { mount } from 'cypress-react-unit-test'
import * as calc from './calc'
import * as Child from './Child'

describe('App', () => {
  it('renders learn react link', () => {
    mount(<App />, { strict: true })
    cy.contains(/Learn React/)
  })

  it('controls the random number by stubbing named import', () => {
    // we are stubbing "getRandomNumber" exported by "calc.js"
    // and imported into "App.js" and called.
    cy.stub(calc, 'getRandomNumber').returns(777)
    mount(<App />)
    cy.contains('.random', '777')

    // getRandomNumber was also used by the Child component
    // let's check that it was mocked too
    cy.contains('.child', 'Real child component, random 777')
  })

  it('can mock the child component', () => {
    // Child component we want to stub is the default export
    cy.stub(Child, 'default')
      .as('child')
      .returns(<div className="mock-child">Mock Child component</div>)
    mount(<App />)
    cy.contains('.mock-child', 'Mock Child')
  })

  describe('loading .env variables', () => {
    it('loads the REACT_APP_ variables from .env file', () => {
      mount(<App />)
      cy.contains('#env-var', 'Hello Component Tests!')
    })

    it('has NODE_ENV set to test', () => {
      cy.wrap(process.env).should('have.property', 'NODE_ENV', 'test')
    })

    it('merges env variables from .env files', () => {
      // test .env files take precedence over other files
      // https://create-react-app.dev/docs/adding-custom-environment-variables/
      cy.wrap(process.env).should('deep.include', {
        NODE_ENV: 'test',
        // from .env
        REACT_APP_NOT_SECRET_CODE: 'Hello Component Tests!',
        // from .env.test.local
        REACT_APP_VAR: '.env.test.local',
        // from .env.test file
        // note that variables are NOT cast to numbers
        REACT_APP_TEST_VAR: '42',
      })
    })
  })
})
