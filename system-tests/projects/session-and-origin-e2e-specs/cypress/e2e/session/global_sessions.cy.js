/**
 * Used in cy-in-cy tests in @packages/app.
 */
it('creates global session', () => {
  cy.session('global_session_1', () => {
    window.localStorage.foo = 'val'
  }, {
    cacheAcrossSpecs: true,
  })
})

it('restores global session', () => {
  cy.session('global_session_1', () => {
    window.localStorage.foo = 'val'
  }, {
    cacheAcrossSpecs: true,
  })
})
