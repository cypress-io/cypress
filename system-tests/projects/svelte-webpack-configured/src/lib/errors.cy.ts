import Errors from './Errors.svelte'

describe('Errors', () => {
  it('error on mount', () => {
    cy.mount(Errors, { props: { throwError: true } })
  })

  it('sync error', () => {
    cy.mount(Errors)
    cy.get('#sync-error').click()
  })

  it('async error', () => {
    cy.mount(Errors)
    cy.get('#async-error').click()
  })

  it('command failure', { defaultCommandTimeout: 50 }, () => {
    cy.mount(Errors)
    cy.get('element-that-does-not-exist')
  })
})
