/**
 * Used in cy-in-cy tests in @packages/app.
 */
it('t1', () => {
  cy.session('spec_session', () => {})

  cy.session('global_session_1', () => {
    window.localStorage.foo = 'val'
  }, {
    cacheAcrossSpecs: true,
  })
})
