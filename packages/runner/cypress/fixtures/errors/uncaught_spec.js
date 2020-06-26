import './setup'

describe('uncaught errors', { defaultCommandTimeout: 0 }, () => {
  it('sync app exception', () => {
    cy.visit('/index.html')
    cy.get('.sync-error').click()
  })

  it('async app exception', () => {
    cy.visit('/index.html')
    cy.get('.async-error').click()
    cy.wait(10000)
  })

  it('async exception', () => {
    setTimeout(() => {
      ({}).bar()
    })

    cy.wait(10000)
  })

  it('async exception with done', (done) => {
    setTimeout(() => {
      ({}).bar()
    })
  })
})
