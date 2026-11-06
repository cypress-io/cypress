describe('remote driver: spies, stubs, and clock in a cross-origin AUT', { experimentalRemoteDriver: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  it('spy()', () => {
    const foo = { bar () { } }

    cy.spy(foo, 'bar')
    foo.bar()
    expect(foo.bar).to.be.called
  })

  it('stub()', () => {
    const foo = { bar () { } }

    cy.stub(foo, 'bar')
    foo.bar()
    expect(foo.bar).to.be.called
  })

  it('stub() on the AUT window', () => {
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alert')
    })

    cy.get('[data-cy="alert"]').click()
    cy.get('@alert').should('have.been.calledOnceWith', 'the alert text')
  })

  context('resets stubs', () => {
    it('creates the stub', () => {
      const stubExpose = cy.stub(Cypress, 'expose').withArgs('foo').returns('bar')

      expect(Cypress.expose('foo')).to.equal('bar')
      expect(stubExpose).to.be.calledOnce
      // @ts-expect-error - isSinonProxy is set by sinon on the stubbed function, not part of its type
      expect(Cypress.expose.isSinonProxy).to.be.true
    })

    it('verifies the stub got restored', () => {
      expect(Cypress.expose('foo')).to.be.undefined
      // @ts-expect-error - isSinonProxy is set by sinon on the stubbed function, not part of its type
      expect(Cypress.expose.isSinonProxy).to.be.undefined
    })
  })

  context('resets spies', () => {
    it('creates the spy', () => {
      const spyExpose = cy.spy(Cypress, 'expose')

      Cypress.expose()
      expect(spyExpose).to.be.calledOnce
      // @ts-expect-error - isSinonProxy is set by sinon on the stubbed function, not part of its type
      expect(Cypress.expose.isSinonProxy).to.be.true
    })

    it('verifies the spy got restored', () => {
      // @ts-expect-error - isSinonProxy is set by sinon on the stubbed function, not part of its type
      expect(Cypress.expose.isSinonProxy).to.be.undefined
    })
  })

  it('clock() and tick()', () => {
    const now = Date.UTC(2022, 0, 12)

    cy.visit('http://www.foobar.com:3500/fixtures/remote-driver-isolation.html')
    cy.clock(now)
    cy.get('#show-time').click()
    cy.get('#timer-result').should('have.text', `now:${now}`)

    cy.tick(10000)
    cy.get('#show-time').click()
    cy.get('#timer-result').should('have.text', `now:${now + 10000}`)
  })
})
