describe('Project Mode', function () {
  beforeEach(function () {
    cy.fixture('user').as('user')
    cy.fixture('config').as('config')

    cy.fixture('specs').as('specs')
  })

  context('Mac', function () {
    beforeEach(function () {
      cy.visitIndex().then((win) => {
        let start = win.App.start

        this.win = win
        this.ipc = win.App.ipc

        this.config.projectName = 'my-kitchen-sink'

        cy.stub(this.ipc, 'onMenuClicked')
        cy.stub(this.ipc, 'onFocusTests')
        cy.stub(this.ipc, 'getOptions').resolves({ projectRoot: '/foo/bar' })
        cy.stub(this.ipc, 'updaterCheck').resolves(false)
        cy.stub(this.ipc, 'openProject').resolves(this.config)
        cy.stub(this.ipc, 'getSpecs').yields(null, this.specs)

        this.getCurrentUser = this.util.deferred()

        start()
      })
    })

    it('goes straight to project specs list', () => {
      cy.shouldBeOnProjectSpecs()
    })

    it('sets title as project path', () => {
      cy.title().should('eq', '/foo/bar')
    })

    it('shows project name in nav', function () {
      cy.get('.main-nav .nav:first-child div')
      .should('contain', this.config.projectName)
      .and('not.contain', 'foo')
    })
  })

  context('Windows', function () {
    beforeEach(function () {
      cy.visitIndex().then((win) => {
        let start;

        ({ start, ipc: this.ipc } = win.App)

        cy.stub(this.ipc, 'onMenuClicked')
        cy.stub(this.ipc, 'onFocusTests')
        cy.stub(this.ipc, 'getOptions').resolves({ projectRoot: 'C:\\foo\\bar' })
        cy.stub(this.ipc, 'updaterCheck').resolves(false)
        cy.stub(this.ipc, 'openProject').resolves(this.config)
        cy.stub(this.ipc, 'getSpecs').yields(null, this.specs)

        this.getCurrentUser = this.util.deferred()

        start()
      })
    })

    it('goes straight to project specs list', () => {
      cy.shouldBeOnProjectSpecs()
    })

    it('sets title as project path', () => {
      cy.title().should('eq', 'C:\\foo\\bar')
    })

    it('shows project name in nav', function () {
      cy.get('.main-nav .nav:first-child div')
      .should('contain', this.config.projectName)
      .and('not.contain', 'foo')
    })
  })
})
