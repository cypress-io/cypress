import './setup'

describe('cy.should', { defaultCommandTimeout: 0 }, () => {
  it('callback assertion failure', () => {
    cy.wrap({}).should(() => {
      expect('actual').to.equal('expected')
    })
  })

  it('callback exception', () => {
    cy.wrap({}).should(() => {
      ({}).bar()
    })
  })

  it('standard assertion failure', () => {
    cy.wrap({})
    .should('have.property', 'foo')
  })

  it('after multiple', () => {
    cy.wrap({ foo: 'foo' }).should('have.property', 'foo')
    .should('equal', 'bar')
  })

  it('after multiple callbacks exception', () => {
    cy.wrap({ foo: 'foo' })
    .should(() => {
      expect(true).to.be.true
    })
    .should(() => {
      ({}).bar()
    })
  })

  it('after multiple callbacks assertion failure', () => {
    cy.wrap({ foo: 'foo' })
    .should(() => {
      expect(true).to.be.true
    })
    .should(() => {
      expect('actual').to.equal('expected')
    })
  })

  it('after callback success assertion failure', () => {
    cy.wrap({})
    .should(() => {
      expect(true).to.be.true
    })
    .should('have.property', 'foo')
  })

  it('command failure after success', () => {
    cy.wrap({ foo: 'foo' }).should('have.property', 'foo')
    cy.get('#does-not-exist')
  })
})
