describe('Navigation', function () {
  beforeEach(function () {
    cy.fixture('user').as('user')
    cy.fixture('config').as('config')

    cy.visitIndex().then(function (win) {
      let start = win.App.start

      this.win = win
      this.ipc = win.App.ipc

      cy.stub(this.ipc, 'updaterCheck').resolves(false)
      cy.stub(this.ipc, 'getProjects').resolves([])
      cy.stub(this.ipc, 'getProjectStatuses').resolves([])
      cy.stub(this.ipc, 'logOut').resolves({})
      cy.stub(this.ipc, 'pingApiServer').resolves()
      cy.stub(this.ipc, 'externalOpen')

      this.getOptions = this.util.deferred()
      cy.stub(this.ipc, 'getOptions').returns(this.getOptions.promise)

      this.getCurrentUser = this.util.deferred()
      cy.stub(this.ipc, 'getCurrentUser').returns(this.getCurrentUser.promise)

      start()
    })
  })

  describe('navbar options', function () {
    beforeEach(function () {
      this.getOptions.resolve({})
    })

    it('displays and opens link to docs on click', () => {
      cy.get('nav').find('.fa-graduation-cap').click().then(function () {
        expect(this.ipc.externalOpen).to.be.calledWithMatch({ url: 'https://on.cypress.io/docs' })
      })
    })

    it('displays and opens link to support on click', () => {
      cy.get('nav').find('.fa-question-circle').click().then(function () {
        expect(this.ipc.externalOpen).to.be.calledWithMatch({ url: 'https://on.cypress.io/support' })
      })
    })

    it('shows loading spinner where user or \'Log in\' will be', () => {
      cy.get('.main-nav li:last .fa-spinner')
    })
  })

  describe('docs menu', function () {
    context('without a project', function () {
      beforeEach(function () {
        this.getOptions.resolve({})
      })

      beforeEach(function () {
        cy.get('.docs-menu').trigger('mouseover')
        cy.get('.docs-dropdown').should('be.visible')
      })

      it('displays on hover and closes off hover', function () {
        // hover is done in beforeEach
        cy.percySnapshot()

        cy.get('.docs-menu').trigger('mouseout')
        cy.get('.docs-dropdown').should('not.exist')
      })

      it('items link to docs', function () {
        cy.contains('Write your first test').click().then(() => {
          expect(this.ipc.externalOpen).to.be.calledWithMatch({ url: 'https://on.cypress.io/writing-first-test' })
        })
      })

      it('prompt links fall back to dashboard links', function () {
        cy.contains('Setting up CI').click().then(() => {
          expect(this.ipc.externalOpen).to.be.calledWithMatch({ url: 'https://on.cypress.io/ci' })
        })
      })
    })

    context('with a project', function () {
      beforeEach(function () {
        this.getOptions.resolve({ projectRoot: '/foo/bar' })

        cy.stub(this.ipc, 'openProject').resolves(this.config)
        cy.stub(this.ipc, 'getSpecs').yields(null, [])

        cy.get('.docs-menu').trigger('mouseover')
        cy.get('.docs-dropdown').should('be.visible')
      })

      it('closes off hover', function () {
        cy.get('.docs-menu').trigger('mouseout')
        cy.get('.docs-dropdown').should('not.exist')
      })

      it('opens dismissible ci1 prompt', function () {
        cy.contains('Setting up CI').click()
        cy.get('.docs-dropdown').should('not.exist')
        cy.contains('Optimize Cypress in CI').should('be.visible')
        cy.get('.close').click()
        cy.get('.prompt-body').should('not.exist')
      })

      it('opens dismissible dashboard1 prompt', function () {
        cy.contains('Debugging failed tests').click()
        cy.get('.docs-dropdown').should('not.exist')
        cy.contains('Debug Tests in CI Faster').should('be.visible')
        cy.get('.close').click()
        cy.get('.prompt-body').should('not.exist')
      })

      it('opens dismissible dashboard2 prompt', function () {
        cy.contains('Running tests faster').click()
        cy.get('.docs-dropdown').should('not.exist')
        cy.contains('Speed up test runs in CI').should('be.visible')
        cy.get('.close').click()
        cy.get('.prompt-body').should('not.exist')
      })
    })
  })

  describe('user menu', function () {
    beforeEach(function () {
      this.getOptions.resolve({})
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
})
