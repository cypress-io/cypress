const log = () => {
  const r = cy.state('runnable')

  assert(true, `${r.type} - ${r.parent.title || 'root'}`)
}

describe('nested_hooks', () => {
  describe('nested beforeEach', () => {
    before(() => {
      log()
      // eslint-disable-next-line mocha/no-nested-tests -- registering a hook while a test runs is the error this fixture exercises
      beforeEach(() => {
        log()
      })
    })

    it('test', log)
  })
})
