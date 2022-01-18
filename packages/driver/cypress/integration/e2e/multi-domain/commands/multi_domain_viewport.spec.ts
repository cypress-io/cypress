// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain viewport', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  // FIXME: hangs on viewport with nothing in the console
  it.skip('.viewport()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.window().then((win) => {
        expect(win.innerHeight).not.to.equal(480)
        expect(win.innerWidth).not.to.equal(320)
      })

      cy.viewport(320, 480)

      cy.window().then((win) => {
        expect(win.innerHeight).to.equal(480)
        expect(win.innerWidth).to.equal(320)
      })
    })
  })
})
