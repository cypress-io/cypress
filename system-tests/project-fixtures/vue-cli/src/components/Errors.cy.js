import Errors from './Errors.vue'
import { mount } from 'cypress/vue'

describe('Errors', () => {
  it('error on mount', () => {
    mount(Errors, {
      propsData: {
        throwError: true,
      },
    })
  })

  it('sync error', () => {
    mount(Errors)
    cy.get('#sync-error').click()
  })

  it('async error', () => {
    mount(Errors)
    cy.get('#async-error').click()
  })

  it('command failure', { defaultCommandTimeout: 50 }, () => {
    mount(Errors)
    cy.get('element-that-does-not-exist')
  })
})
