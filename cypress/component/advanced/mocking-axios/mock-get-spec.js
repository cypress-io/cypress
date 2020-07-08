/// <reference types="cypress" />
import { mount } from 'cypress-vue-unit-test'
import AxiosGet from './AxiosGet.vue'

// import everything from "axios" module
// so we can mock its methods from the test
import * as Axios from 'axios'

describe('Mocking get import from Axios', () => {
  // https://github.com/bahmutov/cypress-vue-unit-test/issues/346
  it.skip('renders mocked data', () => {
    cy.stub(Axios, 'get')
      .resolves({
        data: [
          {
            id: 101,
            name: 'Test User',
          },
        ],
      })
      .as('get')

    console.log('Axios is', Axios)
    console.log('window.AxiosLib is', window.AxiosLib)
    console.log('window.AxiosLib === Axios?', window.AxiosLib === Axios)
    mount(AxiosGet)
    // mock response is used
    cy.get('li').should('have.length', 1)
    cy.get('@get').should('have.been.calledOnce')
  })
})
