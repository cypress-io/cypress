import './setup'

describe('event handlers', { defaultCommandTimeout: 0 }, () => {
  it('event assertion failure', () => {
    cy.on('window:load', () => {
      expect('actual').to.equal('expected')
    })

    cy.visit('http://localhost:1919')
  })

  it('event exception', () => {
    cy.on('window:load', () => {
      ({}).bar()
    })

    cy.visit('http://localhost:1919')
  })

  it('fail handler assertion failure', () => {
    cy.on('fail', () => {
      expect('actual').to.equal('expected')
    })

    cy.get('#does-not-exist')
  })

  it('fail handler exception', () => {
    cy.on('fail', () => {
      ({}).bar()
    })

    cy.get('#does-not-exist')
  })
})
