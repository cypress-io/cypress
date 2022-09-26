import Bluebird from 'bluebird'

describe('uncaught errors', { defaultCommandTimeout: 0 }, () => {
  it('sync app visit exception', () => {
    cy.visit('cypress/fixtures/errors.html?error-on-visit')
    cy.get('.trigger-sync-error').click()
  })

  it('sync app navigates to visit exception', () => {
    cy.visit('cypress/fixtures/errors.html')
    cy.get('.go-to-visit-error').click()
  })

  it('sync app exception', () => {
    cy.visit('cypress/fixtures/errors.html')
    cy.get('.trigger-sync-error').click()
  })

  it('async app exception', () => {
    cy.visit('cypress/fixtures/errors.html')
    cy.get('.trigger-async-error').click()
    cy.wait(10000)
  })

  it('app unhandled rejection', () => {
    cy.visit('cypress/fixtures/errors.html')
    cy.get('.trigger-unhandled-rejection').click()
    cy.wait(10000)
  })

  // TODO: Cypress.Promise.reject() gets caught by AUT. Can/should
  // we handle that somehow?

  it('exception inside uncaught:exception', () => {
    cy.on('uncaught:exception', () => {
      ({}).bar()
    })

    cy.visit('cypress/fixtures/errors.html')
    cy.get('.trigger-sync-error').click()
  })

  it('async spec exception', () => {
    setTimeout(() => {
      ({}).bar()
    })

    cy.wait(10000)
  })

  // eslint-disable-next-line mocha/handle-done-callback
  it('async spec exception with done', (done) => {
    setTimeout(() => {
      ({}).bar()
    })
  })

  it('spec unhandled rejection', () => {
    Promise.reject(new Error('Unhandled promise rejection from the spec'))

    cy.wait(10000)
  })

  // eslint-disable-next-line mocha/handle-done-callback
  it('spec unhandled rejection with done', (done) => {
    Promise.reject(new Error('Unhandled promise rejection from the spec'))
  })

  it('spec Bluebird unhandled rejection', () => {
    Bluebird.reject(new Error('Unhandled promise rejection from the spec'))

    cy.wait(10000)
  })

  // eslint-disable-next-line mocha/handle-done-callback
  it('spec Bluebird unhandled rejection with done', (done) => {
    Bluebird.reject(new Error('Unhandled promise rejection from the spec'))
  })
})
