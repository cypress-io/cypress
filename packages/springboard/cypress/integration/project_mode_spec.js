describe('Project Mode', function () {
  beforeEach(function () {
    cy.fixture('user').as('user')
    cy.fixture('config').as('config')
    cy.fixture('specs').as('specs')

    cy.visitIndex().then((win) => {
      this.start = win.App.start
      this.ipc = win.App.ipc

      this.config.projectName = 'my-kitchen-sink'

      cy.stub(this.ipc, 'onMenuClicked')
      cy.stub(this.ipc, 'onFocusTests')
      cy.stub(this.ipc, 'getOptions').resolves({ projectRoot: '/foo/bar' })
      cy.stub(this.ipc, 'updaterCheck').resolves(false)
      cy.stub(this.ipc, 'openProject').resolves(this.config)
      cy.stub(this.ipc, 'getSpecs')

      this.getCurrentUser = this.util.deferred()
    })
  })

  it('displays footer on bottom when loading (issue #4888)', function () {
    const openProject = this.util.deferred()

    this.ipc.openProject.resolves(openProject.promise)
    this.start()

    cy.get('footer').invoke('position').then(({ top }) => {
      cy.get('footer').invoke('outerHeight').then((height) => {
        expect(top).to.equal(Cypress.config('viewportHeight') - height)
      })
    })
  })

  describe('when specs load', function () {
    beforeEach(function () {
      this.ipc.getSpecs.yields(null, this.specs)
    })

    it('goes straight to project specs list', function () {
      this.start()
      cy.shouldBeOnProjectSpecs()
    })

    it('sets title as project path on Mac/Linux', function () {
      this.start()
      cy.title().should('eq', '/foo/bar')
    })

    it('sets title as project path on Windows', function () {
      this.ipc.getOptions.resolves({ projectRoot: 'C:\\foo\\bar' })
      this.start()
      cy.title().should('eq', 'C:\\foo\\bar')
    })

    it('shows project name in nav', function () {
      this.start()
      cy.get('.main-nav .nav:first-child div')
      .should('contain', this.config.projectName)
      .and('not.contain', 'foo')
    })
  })
})
