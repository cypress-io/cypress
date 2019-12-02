context('a', function () {
  beforeEach(() => {
    doSomething()

    return settings.write('something')
  })

  afterEach(() => {
    return settings.reset()
  })

  it('test 1', function () {
    cy.visit('hi/world')

    return cy.click('abc')
  })

  it('test 2', () => {
    return this.project.saveState()
    .then((state) => {
      expect(state).to.deep.eq({})
    })
  })
})
