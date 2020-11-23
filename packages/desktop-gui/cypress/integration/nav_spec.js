describe('Navigation', function () {
  beforeEach(function () {
    cy.fixture('user').as('user')

    cy.visitIndex().then(function (win) {
      let start = win.App.start

      this.win = win
      this.ipc = win.App.ipc

      cy.stub(this.ipc, 'getOptions').resolves({})
      cy.stub(this.ipc, 'updaterCheck').resolves(false)
      cy.stub(this.ipc, 'getProjects').resolves([])
      cy.stub(this.ipc, 'getProjectStatuses').resolves([])
      cy.stub(this.ipc, 'logOut').resolves({})
      cy.stub(this.ipc, 'pingApiServer').resolves()
      cy.stub(this.ipc, 'externalOpen')

      this.getCurrentUser = this.util.deferred()
      cy.stub(this.ipc, 'getCurrentUser').returns(this.getCurrentUser.promise)

      start()
    })
  })

  it('displays and opens link to docs on click', () => {
    cy.get('nav').find('.fa-graduation-cap').click().then(function () {
      expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io')
    })
  })

  it('displays and opens link to support on click', () => {
    cy.get('nav').find('.fa-question-circle').click().then(function () {
      expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/support')
    })
  })

  it('shows loading spinner where user or \'Log in\' will be', () => {
    cy.get('.main-nav li:last .fa-spinner')
  })

  context('without a current user', function () {
    beforeEach(function () {
      this.getCurrentUser.resolve({})
    })

    it('displays login button', () => {
      cy.shouldBeLoggedOut()
    })

    it('displays login modal when clicking login button', function () {
      cy.contains('Log In').click()

      cy.contains('.btn', 'Log In to Dashboard')
    })
  })

  context('with a current user', function () {
    beforeEach(function () {
      this.getCurrentUser.resolve(this.user)
    })

    it('displays user name', () => {
      cy.get('.user-dropdown .dropdown-chosen').should(function ($a) {
        expect($a).to.contain(this.user.name)
      })
    })

    it('shows dropdown on click of user name', function () {
      cy.contains('Jane Lane').click()

      cy.contains('Log Out').should('be.visible')
      cy.percySnapshot()
    })

    describe('logging out', function () {
      beforeEach(() => {
        cy.logOut()
      })

      it('triggers logout on click of logout', function () {
        expect(this.ipc.logOut).to.be.called
      })

      it('displays login button', () => {
        cy.shouldBeLoggedOut()
      })
    })

    describe('when log out errors', function () {
      beforeEach(function () {
        this.ipc.logOut.rejects({ name: '', message: 'ECONNREFUSED\n0.0.0.0:1234' })

        cy.logOut()
      })

      it('shows global error', () => {
        cy.get('.global-error').should('be.visible')
        cy.percySnapshot()
      })

      it('displays error message', function () {
        cy.get('.global-error p').eq(0).invoke('text')
        .should('include', 'An unexpected error occurred while logging out')

        cy.get('.global-error p').eq(1).invoke('html')
        .should('include', 'ECONNREFUSED<br>0.0.0.0:1234')
      })

      it('dismisses warning after clicking X', function () {
        cy.get('.global-error .close').click()

        cy.get('.global-error').should('not.exist')
      })
    })
  })

  context('when current user has no name', function () {
    beforeEach(function () {
      this.user.name = null

      this.getCurrentUser.resolve(this.user)
    })

    it('displays email instead of name', () => {
      cy.get('.user-dropdown .dropdown-chosen').should(function ($a) {
        expect($a).to.contain(this.user.email)
      })
    })
  })
})
