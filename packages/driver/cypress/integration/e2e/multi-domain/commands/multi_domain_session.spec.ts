// @ts-ignore / session support is needed for visiting about:blank between tests
// FIXME: CypressError: experimentalSessionSupport is not enabled.
// You must enable the experimentalSessionSupport flag in order to use Cypress session commands
// at throwIfNoSessionSupport(webpack:///../driver/src/cy/commands/sessions.ts?:287:76)
// at session(webpack:///../driver/src/cy/commands/sessions.ts?:516:7)
context.skip('multi-domain session', { experimentalSessionSupport: true }, () => {
  before(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  beforeEach(() => {
    cy.switchToDomain('foobar.com', () => {
      cy.session('multi-domain', () => {
        localStorage.setItem('foo', 'bar')
      })
    })

    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('verify new session', () => {
    cy.switchToDomain('foobar.com', () => {
      expect(localStorage.getItem('foo')).to.equal('bar')
    })
  })

  it('verify saved session', () => {
    cy.switchToDomain('foobar.com', () => {
      expect(localStorage.getItem('foo')).to.equal('bar')
    })
  })
})
