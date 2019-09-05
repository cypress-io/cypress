describe('Warning Message', function () {
  beforeEach(function () {
    cy.fixture('specs').as('specs')
    this.warningObj = {
      type: 'NOT_GOOD_BUT_NOT_TOO_BAD',
      name: 'Fairly serious warning',
      message: 'Some warning\nmessage',
    }

    cy.visitIndex().then((win) => {
      ({ start: this.start, ipc: this.ipc } = win.App)

      cy.stub(this.ipc, 'getOptions').resolves({ projectRoot: '/foo/bar' })
      cy.stub(this.ipc, 'getCurrentUser').resolves(this.user)
      cy.stub(this.ipc, 'openProject').resolves(this.config)
      cy.stub(this.ipc, 'getSpecs').yields(null, this.specs)
      cy.stub(this.ipc, 'closeProject').resolves()
      cy.stub(this.ipc, 'onConfigChanged')
      cy.stub(this.ipc, 'onProjectWarning')
      cy.stub(this.ipc, 'externalOpen')

      this.start()
    })
  })

  it('shows warning', function () {
    cy.shouldBeOnProjectSpecs().then(() => {
      this.ipc.onProjectWarning.yield(null, this.warningObj)
    })

    cy.get('.alert-warning')
    .should('be.visible')
    .should('contain', 'Some warning')
  })

  it('can dismiss the warning', function () {
    cy.shouldBeOnProjectSpecs().then(() => {
      this.ipc.onProjectWarning.yield(null, this.warningObj)
    })

    cy.get('.alert-warning button').click()

    cy.get('.alert-warning').should('not.exist')
  })

  it('stays dismissed after receiving same warning again', function () {
    cy.shouldBeOnProjectSpecs().then(() => {
      this.ipc.onProjectWarning.yield(null, this.warningObj)
    })

    cy.get('.alert-warning button').click()
    cy.get('.alert-warning').should('not.exist').then(() => {
      this.ipc.onProjectWarning.yield(null, this.warningObj)
    })

    cy.get('.alert-warning').should('not.exist')
  })

  it('shows new, different warning after dismissing old warning', function () {
    cy.shouldBeOnProjectSpecs().then(() => {
      this.ipc.onProjectWarning.yield(null, this.warningObj)
    })

    cy.get('.alert-warning button').click()
    cy.get('.alert-warning').should('not.exist').then(() => {
      this.ipc.onProjectWarning.yield(null, {
        type: 'PRETTY_BAD_WARNING',
        name: 'Totally serious warning',
        message: 'Some warning\nmessage',
      })
    })

    cy.get('.alert-warning').should('be.visible')
  })

  it('renders markdown', function () {
    const markdownWarningObj = {
      type: 'NOT_GOOD_BUT_NOT_TOO_BAD',
      name: 'Fairly serious warning',
      message: 'Some warning\n**message**',
    }

    cy.shouldBeOnProjectSpecs().then(() => {
      this.ipc.onProjectWarning.yield(null, markdownWarningObj)
    })

    cy.get('.alert-warning')
    .should('not.contain', '**message**')
    .should('contain', 'message')
  })

  it('opens links outside of electron', function () {
    const linkWarningObj = {
      type: 'NOT_GOOD_BUT_NOT_TOO_BAD',
      name: 'Fairly serious warning',
      message: 'Some warning:\nhttp://example.com',
    }

    cy.shouldBeOnProjectSpecs().then(() => {
      this.ipc.onProjectWarning.yield(null, linkWarningObj)
    })

    cy.contains('.alert-warning a', 'http://example.com')
    .click()
    .then(function () {
      expect(this.ipc.externalOpen).to.be.calledWith('http://example.com/')
    })
  })

  it('does not try to open non-links', function () {
    const nonlinkWarningObj = {
      type: 'NOT_GOOD_BUT_NOT_TOO_BAD',
      name: 'Fairly serious warning',
      message: 'Some warning:\n<strong>not here</strong>',
    }

    cy.shouldBeOnProjectSpecs().then(() => {
      this.ipc.onProjectWarning.yield(null, nonlinkWarningObj)
    })

    cy.contains('.alert-warning strong', 'not here')
    .click().then(function () {
      expect(this.ipc.externalOpen).not.to.be.called
    })
  })

  it('displays warning above specs (issue #4912)', function () {
    cy.shouldBeOnProjectSpecs().then(() => {
      this.ipc.onProjectWarning.yield(null, this.warningObj)
    })

    cy.get('.specs').invoke('position').its('top').should('gt', 100)
  })

  context('with multiple warnings', function () {
    beforeEach(function () {
      this.warningObj2 = {
        type: 'GOOD_BUT_NOT_TOO_GOOD',
        name: 'Fairly good warning',
        message: 'Other message',
      }
    })

    it('shows multiple warnings', function () {
      cy.shouldBeOnProjectSpecs().then(function () {
        this.ipc.onProjectWarning['yield'](null, this.warningObj)
        this.ipc.onProjectWarning['yield'](null, this.warningObj2)
      })

      cy.get('.alert-warning')
      .should('have.length', 2)
      .should('be.visible')
      .first().should('contain', 'Some warning')

      cy.get('.alert-warning').its('1')
      .should('contain', 'Other message')
    })

    it('can dismiss the warnings', function () {
      cy.shouldBeOnProjectSpecs().then(function () {
        this.ipc.onProjectWarning['yield'](null, this.warningObj)
        this.ipc.onProjectWarning['yield'](null, this.warningObj2)
      })

      cy.get('.alert-warning')
      .should('contain', 'Some warning')
      .should('contain', 'Other message')

      cy.get('.alert-warning button').first().click()
      cy.get('.alert-warning')
      .should('not.contain', 'Some warning')
      .should('contain', 'Other message')

      cy.get('.alert-warning button').click()
      cy.get('.alert-warning')
      .should('not.contain', 'Some warning')
      .should('not.contain', 'Other message')
    })
  })
})
