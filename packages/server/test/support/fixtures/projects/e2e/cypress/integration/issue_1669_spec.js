describe('issue-1669 undefined err.stack in beforeEach hook', () => {

  beforeEach(() => {
    cy.setCookie('foo', '   bar')
  })

  it('cy.setCookie should fail with correct error', () => {
    expect(true).ok
  })
})
