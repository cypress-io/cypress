// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain spies, stubs, and clock', { experimentalSessionSupport: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  it('spy()', () => {
    cy.switchToDomain('foobar.com', () => {
      const foo = { bar () { } }

      cy.spy(foo, 'bar')
      foo.bar()
      expect(foo.bar).to.be.called
    })
  })

  it('stub()', () => {
    cy.switchToDomain('foobar.com', () => {
      const foo = { bar () { } }

      cy.stub(foo, 'bar')
      foo.bar()
      expect(foo.bar).to.be.called
    })
  })

  context('resets stubs', () => {
    it('creates the stub', () => {
      cy.switchToDomain('foobar.com', () => {
        const stubEnv = cy.stub(Cypress, 'env').withArgs('foo').returns('bar')

        expect(Cypress.env('foo')).to.equal('bar')
        expect(stubEnv).to.be.calledOnce
        // @ts-ignore
        expect(Cypress.env.isSinonProxy).to.be.true
      })
    })

    it('verifies the stub got restored', () => {
      cy.switchToDomain('foobar.com', () => {
        expect(Cypress.env('foo')).to.be.undefined
        // @ts-ignore
        expect(Cypress.env.isSinonProxy).to.be.undefined
      })
    })
  })

  context('resets spies', () => {
    it('creates the spy', () => {
      cy.switchToDomain('foobar.com', () => {
        const stubEnv = cy.spy(Cypress, 'env')

        Cypress.env()
        expect(stubEnv).to.be.calledOnce
        // @ts-ignore
        expect(Cypress.env.isSinonProxy).to.be.true
      })
    })

    it('verifies the spy got restored', () => {
      cy.switchToDomain('foobar.com', () => {
        // @ts-ignore
        expect(Cypress.env.isSinonProxy).to.be.undefined
      })
    })
  })

  it('clock() and tick()', () => {
    cy.switchToDomain('foobar.com', () => {
      const now = Date.UTC(2022, 0, 12)

      cy.clock(now)
      cy.window().then((win) => {
        expect(win.Date.now()).to.equal(now)
      })

      cy.tick(10000) // 10 seconds passed
      cy.window().then((win) => {
        expect(win.Date.now()).to.equal(now + 10000)
      })
    })
  })
})
