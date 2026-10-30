describe('async hook failure attribution', () => {
  beforeEach(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20))
    cy.wrap(1).should((value) => {
      expect(value, 'ASYNC_HOOK_ASSERTION').to.equal(2)
    })
  })

  it('does not enter the body after a failing async hook', () => {
    throw new Error('ASYNC_HOOK_BODY_MUST_NOT_RUN')
  })
})
