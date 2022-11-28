describe('issue-1669 undefined err.stack in beforeEach hook', () => {
  beforeEach(() => {
    const errorWithoutStack = new Error('some error, without stack')

    delete errorWithoutStack.stack
    throw errorWithoutStack
  })

  it('cy.setCookie should fail with correct error', () => {
    expect(true).ok
  })
})
