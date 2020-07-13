/// <reference types="cypress" />
import { mount } from 'cypress-vue-unit-test'
import Users from './Users.vue'
import * as AxiosApi from './AxiosApi'

describe('Mocking imports from Axios Wrapper', () => {
  it('renders mocked data', () => {
    // stub export "get" that Users.vue imports and uses
    cy.stub(AxiosApi, 'get')
      .resolves({
        data: [
          {
            id: 101,
            name: 'Test User',
          },
        ],
      })
      .as('get')

    mount(Users)
    // the mock response is used 😀
    cy.get('li').should('have.length', 1)
    cy.get('@get').should('have.been.calledOnce')
  })
})
