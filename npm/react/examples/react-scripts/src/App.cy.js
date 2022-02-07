/// <reference types="cypress" />
// compare to App.test.js
import React from 'react'
import App from './App'
import { mount } from '@cypress/react'

describe('App', () => {
  it('renders learn react link', () => {
    mount(<App />, { strict: true })
    cy.contains(/Learn React/)
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
