context('cy.origin local storage', () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  it('.clearLocalStorage()', () => {
    cy.origin('http://foobar.com:3500', () => {
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
