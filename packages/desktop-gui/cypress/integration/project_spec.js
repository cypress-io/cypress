describe('Project', function () {
  beforeEach(function () {
    cy.fixture('user').as('user')
    cy.fixture('config').as('config')
    cy.fixture('specs').as('specs')
    cy.fixture('projects_statuses').as('projectStatuses')

    cy.visitIndex().then((win) => {
      ({ start: this.start, ipc: this.ipc } = win.App)

      cy.stub(this.ipc, 'getOptions').resolves({ projectRoot: '/foo/bar' })
      cy.stub(this.ipc, 'getCurrentUser').resolves(this.user)
      cy.stub(this.ipc, 'openProject').resolves(this.config)
      cy.stub(this.ipc, 'getSpecs').yields(null, this.specs)
      cy.stub(this.ipc, 'closeProject').resolves()
      cy.stub(this.ipc, 'onConfigChanged')
      cy.stub(this.ipc, 'onProjectWarning')

      this.getProjectStatus = this.util.deferred()
      cy.stub(this.ipc, 'getProjectStatus').returns(this.getProjectStatus.promise)

      this.updaterCheck = this.util.deferred()
      cy.stub(this.ipc, 'updaterCheck').resolves(this.updaterCheck.promise)
    })
  })

  describe('general behavior', function () {
    beforeEach(function () {
      this.start()
    })

    it('shows project specs', () => {
      cy.shouldBeOnProjectSpecs()
    })

    it('opens project', function () {
      cy.shouldBeOnProjectSpecs().then(() => {
        expect(this.ipc.openProject).to.be.calledWith('/foo/bar')
      })
    })

    it('gets project status', function () {
      cy.shouldBeOnProjectSpecs().then(() => {
        expect(this.ipc.getProjectStatus).to.be.calledWith({ id: this.config.projectId, path: '/foo/bar' })
      })
    })

    it('logs out user when getting project status returns 401', function () {
      cy.shouldBeOnProjectSpecs().then(() => {
        this.getProjectStatus.reject({ name: '', message: '', statusCode: 401 })
      })

      cy.shouldBeLoggedOut()
    })

    it('re-opens project if config changes', function () {
      cy.shouldBeOnProjectSpecs().then(() => {
        this.ipc.onConfigChanged.yield()
        expect(this.ipc.closeProject).to.be.called
        expect(this.ipc.openProject).to.be.called

        cy.shouldBeOnProjectSpecs()
      })
    })
  })

  describe('polling', function () {
    beforeEach(function () {
      this.ipc.getProjectStatus.resolves(this.projectStatuses[0])

      cy.clock().then(() => {
        this.start()
      })
    })

    it('gets project status every 10 seconds', function () {
      cy.tick(10000).then(() => {
        expect(this.ipc.getProjectStatus).to.be.calledTwice
      })
    })
  })
})
