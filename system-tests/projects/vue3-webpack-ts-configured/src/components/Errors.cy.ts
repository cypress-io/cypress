import Errors from './Errors.vue'
import { mount } from 'cypress/vue'

describe('Errors', () => {
  it('error on mount', () => {
    // TODO: fix typings issue with mount. @see https://github.com/cypress-io/cypress/issues/29799
    // @ts-expect-error
    mount(Errors, {
      propsData: {
        throwError: true,
      },
    })
  })

  it('sync error', () => {
    // TODO: fix typings issue with mount. @see https://github.com/cypress-io/cypress/issues/29799
    // @ts-expect-error
    mount(Errors)
    cy.get('#sync-error').click()
  })

  it('async error', () => {
    // TODO: fix typings issue with mount. @see https://github.com/cypress-io/cypress/issues/29799
    // @ts-expect-error
    mount(Errors)
    cy.get('#async-error').click()
  })

  // TODO: fix typings issue with mount. @see https://github.com/cypress-io/cypress/issues/29799
  it('command failure', { defaultCommandTimeout: 50 }, () => {
    mount(Errors)
    cy.get('element-that-does-not-exist')
  })
})
