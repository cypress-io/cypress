context('a', function () {
  beforeEach(() => {
    doSomething()

    settings.write('something');
  })

  afterEach(() => {
    settings.reset();
  })

  it('test 1', function () {
    cy.visit('hi/world')

    cy.click('abc');
  })

  it('test 2', () => {
    this.project.saveState()
    .then((state) => {
      expect(state).to.deep.eq({})
    });
  })
})
