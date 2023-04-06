/**
 * Used in cy-in-cy tests in @packages/app.
 */
it('t1', () => {
  cy.session('spec_session_1', () => {
    window.localStorage.foo = 'val'
  })

  cy.session('spec_session_2', () => {
    window.localStorage.foo = 'val'
    window.localStorage.bar = 'val'
  })

  cy.session('global_session_1', () => {
    window.localStorage.foo = 'val'
  }, {
    cacheAcrossSpecs: true,
  })
})
