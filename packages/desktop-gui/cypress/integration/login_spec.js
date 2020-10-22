describe('Login', function () {
  beforeEach(function () {
    cy.fixture('user').as('user')

    cy.visitIndex().then(function (win) {
      let start = win.App.start

      this.win = win
      this.ipc = win.App.ipc

      cy.stub(this.ipc, 'onMenuClicked')
      cy.stub(this.ipc, 'onFocusTests')
      cy.stub(this.ipc, 'getOptions').resolves({})
      cy.stub(this.ipc, 'getCurrentUser').resolves(null)
      cy.stub(this.ipc, 'updaterCheck').resolves(false)
      cy.stub(this.ipc, 'getProjects').resolves([])
      cy.stub(this.ipc, 'getProjectStatuses').resolves([])
      cy.stub(this.ipc, 'openProject').resolves(this.config)
      cy.stub(this.ipc, 'getSpecs').yields(null, this.specs)
      cy.stub(this.ipc, 'externalOpen')
      cy.stub(this.ipc, 'logOut').resolves()

      cy.stub(this.ipc, 'onAuthMessage').callsFake((function (_this) {
        return function (cb) {
          return _this.onAuthMessageCb = cb
        }
      })(this))

      this.pingApiServer = this.util.deferred()
      cy.stub(this.ipc, 'pingApiServer').returns(this.pingApiServer.promise)

      this.beginAuth = this.util.deferred()

      cy.stub(this.ipc, 'beginAuth').returns(this.beginAuth.promise)
      start()
      cy.contains('Log In').click()
    })
  })

  it('pings api server', function () {
    expect(this.ipc.pingApiServer).to.be.called

    cy.get('.loader')
  })

  describe('when connected to api server', function () {
    beforeEach(function () {
      this.pingApiServer.resolve()
    })

    it('has dashboard login button', function () {
      cy.get('.login').contains('button', 'Log In to Dashboard')

      cy.percySnapshot()
    })

    it('opens dashboard on clicking \'Cypress Dashboard\'', () => {
      cy.contains('Cypress Dashboard').click().then(function () {
        expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/dashboard')
      })
    })

    describe('click Log In to Dashboard', function () {
      beforeEach(function () {
        cy.get('.login').contains('button', 'Log In to Dashboard').as('loginBtn').click()
      })

      it('triggers ipc \'begin:auth\' on click', function () {
        cy.then(function () {
          expect(this.ipc.beginAuth).to.be.calledOnce
        })
      })

      it('passes utm code when it triggers ipc \'begin:auth\'', function () {
        cy.then(function () {
          expect(this.ipc.beginAuth).to.be.calledWith('Nav Login Button')
        })
      })

      it('shows spinner with Opening browser and disables button', () => {
        cy.get('@loginBtn').should('be.disabled')
        .invoke('text').should('contain', 'Opening browser...')

        cy.percySnapshot()
      })

      context('on begin:auth', function () {
        it('when browser opened, shows spinner with Waiting...', function () {
          this.onAuthMessageCb(null, {
            name: '',
            message: '',
            stack: '',
            browserOpened: true,
          })

          cy.get('@loginBtn').should('be.disabled')
          .invoke('text').should('contain', 'Waiting for browser login...')

          cy.percySnapshot()
        })

        describe('on ipc begin:auth success', function () {
          beforeEach(function () {
            this.beginAuth.resolve(this.user)
          })

          it('goes to previous view', () => {
            cy.shouldBeOnIntro()
          })

          it('displays username in UI', function () {
            cy.get('.user-dropdown .dropdown-chosen').should('contain', this.user.name)
          })

          it('displays username in success dialog', () => {
            cy.get('.modal').contains('Jane Lane')

            cy.percySnapshot()
          })

          it('can close modal by clicking Continue', () => {
            cy.get('.modal .btn:contains(Continue)').click()
            cy.get('.modal').should('not.be.visible')
          })

          context('after clicking Continue', function () {
            beforeEach(function () {
              cy.get('.modal .btn:contains(Continue)').click()
            })

            context('log out', function () {
              it('displays login button on logout', () => {
                cy.get('.user-dropdown .dropdown-chosen').contains('Jane').click()

                cy.contains('Log Out').click()
                cy.get('.nav').contains('Log In')
              })

              it('calls log:out', function () {
                cy.get('.user-dropdown .dropdown-chosen').contains('Jane').click()

                cy.contains('Log Out').click().then(function () {
                  expect(this.ipc.logOut).to.be.called
                })
              })

              it('has login button enabled when returning to login after logout', function () {
                cy.get('.user-dropdown .dropdown-chosen').contains('Jane').click()
                cy.contains('Log Out').click()
                cy.contains('Log In').click()

                cy.get('.login button').eq(1)
                .should('not.be.disabled').invoke('text')
                .should('include', 'Log In to Dashboard')
              })
            })
          })
        })

        describe('on ipc begin:auth error', function () {
          beforeEach(function () {
            this.beginAuth.reject({
              name: 'foo',
              message: 'There\'s an error',
            })
          })

          it('displays error in ui', () => {
            cy.get('.alert-danger').should('be.visible')
            .contains('There\'s an error')

            cy.percySnapshot()
          })

          it('login button should be enabled', () => {
            cy.get('@loginBtn').should('not.be.disabled')
          })
        })

        describe('on ipc on:auth:message', function () {
          beforeEach(function () {
            this.onAuthMessageCb(null, {
              message: 'some warning here',
              type: 'warning',
            })
          })

          it('displays warning in ui', () => {
            cy.get('.warning').should('be.visible')
            .contains('some warning here')

            cy.percySnapshot()
          })

          it('login button should be disabled', () => {
            cy.get('@loginBtn').should('be.disabled')
          })

          it('on AUTH_COULD_NOT_LAUNCH_BROWSER login button changes', function () {
            this.onAuthMessageCb(null, {
              name: 'AUTH_COULD_NOT_LAUNCH_BROWSER',
              type: 'warning',
              message: 'foo',
            })

            cy.get('.login-content .btn-login')
            .should('be.disabled')
            .should('have.text', ' Could not open browser.')

            cy.percySnapshot()
          })

          it('<pre> can be click-selected', function () {
            this.onAuthMessageCb(null, {
              message: 'foo\n```\nbar\n```',
              type: 'warning',
            })

            cy.get('.login-content .message pre').click()
            cy.document().then(function ($doc) {
              const selection = $doc.getSelection().toString()

              expect(selection).to.eq('bar')
            })
          })
        })
      })
    })

    describe('Dashboard link in message', function () {
      it('opens link to Dashboard Service on click', function () {
        cy.contains('a', 'Cypress Dashboard Service')
        .click().then(function () {
          expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/dashboard')
        })
      })
    })

    describe('terms and privacy message', () => {
      it('opens links to terms and privacy on click', function () {
        cy.contains('a', 'Terms of Use')
        .click().then(function () {
          expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/terms-of-use')
        })

        cy.contains('a', 'Privacy Policy')
        .click().then(function () {
          expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/privacy-policy')
        })
      })
    })
  })

  describe('when not connected to api server', function () {
    beforeEach(function () {
      this.pingApiServerAgain = this.util.deferred()
      this.ipc.pingApiServer.onCall(1).returns(this.pingApiServerAgain.promise)

      this.pingApiServer.reject({
        apiUrl: 'http://api.server',
        message: 'ECONNREFUSED',
      })
    })

    it('shows cannot connect to api server message', function () {
      cy.contains('Cannot connect to API server')
      cy.contains('http://api.server')

      cy.contains('ECONNREFUSED')

      cy.percySnapshot()
    })

    describe('trying again', function () {
      beforeEach(() => {
        cy.contains('Try again').click()
      })

      it('pings again', () => {
        cy.get('.loader').then(function () {
          expect(this.ipc.pingApiServer).to.be.calledTwice
        })
      })

      it('shows new error on failure', function () {
        this.pingApiServerAgain.reject({
          apiUrl: 'http://api.server',
          message: 'WHADJAEXPECT',
        })

        cy.contains('Cannot connect to API server')
        cy.contains('http://api.server')

        cy.contains('WHADJAEXPECT')
      })

      it('shows login on success', function () {
        this.pingApiServerAgain.resolve()

        cy.get('.login').contains('button', 'Log In to Dashboard')
      })
    })

    describe('api help link', () => {
      it('goes to external api help link', () => {
        cy.get('.login').contains('Learn more').click().then(function () {
          expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/help-connect-to-api')
        })
      })
    })

    describe('closing login', function () {
      beforeEach(() => {
        cy.get('.login .close').click()
      })

      it('shows log in if connected and opened again', function () {
        this.pingApiServerAgain.resolve()
        cy.contains('Log In').click()

        cy.get('.login').contains('button', 'Log In to Dashboard')
      })
    })
  })
})
