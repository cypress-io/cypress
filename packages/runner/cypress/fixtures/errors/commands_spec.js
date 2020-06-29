import './setup'

describe('commands', { defaultCommandTimeout: 0 }, () => {
  it('failure', () => {
    cy.get('#does-not-exist')
  })

  it('chained failure', () => {
    cy.get('body').find('#does-not-exist')
  })
})
