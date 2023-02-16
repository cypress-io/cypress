import { ErrorsComponent } from './components/errors'

describe('Errors', () => {
  it('error on mount', () => {
    cy.mount(ErrorsComponent, { componentProperties: { throwError: true } })
  })

  it('sync error', () => {
    cy.mount(ErrorsComponent)
    cy.get('#sync-error').click()
  })

  it('async error', () => {
    cy.mount(ErrorsComponent)
    cy.get('#async-error').click()
  })

  it('command failure', { defaultCommandTimeout: 50 }, () => {
    cy.mount(ErrorsComponent)
    cy.get('element-that-does-not-exist')
  })
})
