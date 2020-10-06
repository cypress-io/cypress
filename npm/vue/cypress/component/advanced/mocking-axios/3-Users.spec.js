/// <reference types="cypress" />
import { mount } from '@cypress/vue'
import Users from './3-Users.vue'
// test file can import the entire AxiosApi module
import * as AxiosApi from './AxiosApi'

describe('Mocking imports from Axios Wrapper', () => {
  it('renders mocked data', () => {
    // stub export "get" that Users component imports and uses
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
