describe('event handlers', { defaultCommandTimeout: 0 }, () => {
  it('event assertion failure', () => {
    cy.on('command:end', () => {
      expect('actual').to.equal('expected')
    })

    cy.wrap({})
  })

  it('event exception', () => {
    cy.on('command:end', () => {
      ({}).bar()
    })

    cy.wrap({})
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
