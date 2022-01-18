// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain spies, stubs, and clock', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
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

  // FIXME: TypeError: Cannot set properties of undefined (setting 'clock')
  // at Object.clock (webpack:///../driver/src/cy/commands/clock.ts?:170:17)
  it.skip('clock() and tick()', () => {
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
