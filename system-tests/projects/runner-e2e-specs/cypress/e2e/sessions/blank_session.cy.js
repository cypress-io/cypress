describe('session', {
  experimentalSessionSupport: true,
}, () => {
  it('creates blank session', () => {
    cy.session('blank_session', () => {})
    assert(true)
  })
})
