// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain local storage', { experimentalSessionSupport: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  it('.clearLocalStorage()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('foo', 'bar')
        expect(win.localStorage.getItem('foo')).to.equal('bar')
      })

      cy.clearLocalStorage().should((localStorage) => {
        expect(localStorage.length).to.equal(0)
        expect(localStorage.getItem('foo')).to.be.null
      })
    })
  })
})
