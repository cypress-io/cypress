describe('Login', function () {
  beforeEach(function () {
    cy.fixture('user').as('user')

    return cy.visitIndex().then(function (win) {
      let start

      ;({ start, ipc: this.ipc } = win.App) // don't remove this semicolon 😅

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
      cy.stub(this.ipc, 'clearGithubCookies')
      cy.stub(this.ipc, 'logOut').resolves()

      this.pingApiServer = this.util.deferred()
      cy.stub(this.ipc, 'pingApiServer').returns(this.pingApiServer.promise)

      this.openWindow = this.util.deferred()
      cy.stub(this.ipc, 'windowOpen').returns(this.openWindow.promise)

      this.login = this.util.deferred()
      cy.stub(this.ipc, 'logIn').returns(this.login.promise)

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

    it('has Github Login button', () => {
      cy.get('.login').contains('button', 'Log In with GitHub')
    })

    it('opens dashboard on clicking \'Cypress Dashboard\'', () => {
      cy.contains('Cypress Dashboard').click().then(function () {
        expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/dashboard')
      })
    })

    describe('click \'Log In with GitHub\'', function () {
      beforeEach(() => {
        cy.get('.login')
        .contains('button', 'Log In with GitHub').as('loginBtn')
        .click()
      })

      it('triggers ipc \'window:open\' on click', () => {
        cy.then(function () {
          expect(this.ipc.windowOpen).to.be.calledWithExactly({
            position: 'center',
            focus: true,
            width: 1000,
            height: 635,
            preload: false,
            title: 'Login',
            type: 'GITHUB_LOGIN',
          })
        })
      })

      it('disables login button', () => {
        cy.get('@loginBtn').should('be.disabled')
      })

      it('shows spinner with \'Logging In\'', () => {
        cy.get('@loginBtn').invoke('text').should('contain', 'Logging in...')
      })

      context('on \'window:open\' ipc response', function () {
        beforeEach(() => {
          cy.get('@loginBtn').then(function () {
            this.openWindow.resolve('code-123')
          })
        })

        it('triggers ipc \'log:in\'', function () {
          cy.wrap(this.ipc.logIn).should('be.calledWith', 'code-123')
        })

        it('displays spinner with \'Logging in...\' and disables button', () => {
          cy.contains('Logging in...').should('be.disabled')
        })

        describe('on ipc log:in success', function () {
          beforeEach(function () {
            this.login.resolve(this.user)
          })

          it('goes to previous view', () => {
            cy.shouldBeOnIntro()
          })

          it('displays username in UI', () => {
            cy.get('nav a').should(function ($a) {
              expect($a).to.contain(this.user.name)
            })
          })

          it('closes modal', () => {
            cy.get('.modal').should('not.be.visible')
          })

          context('log out', function () {
            it('displays login button on logout', function () {
              cy.get('nav a').contains('Jane').click()

              cy.contains('Log Out').click()
              cy.get('.nav').contains('Log In')
            })

            it('calls clear:github:cookies', function () {
              cy.get('nav a').contains('Jane').click()

              cy.contains('Log Out').click().then(function () {
                expect(this.ipc.clearGithubCookies).to.be.called
              })
            })

            it('calls log:out', function () {
              cy.get('nav a').contains('Jane').click()

              cy.contains('Log Out').click().then(function () {
                expect(this.ipc.logOut).to.be.called
              })
            })

            it('has login button enabled when returning to login after logout', function () {
              cy.get('nav a').contains('Jane').click()
              cy.contains('Log Out').click()
              cy.contains('Log In').click()

              cy.get('.login button').eq(1)
              .should('not.be.disabled')
              .invoke('text')
              .should('include', 'Log In with GitHub')
            })
          })
        })

        describe('on ipc \'log:in\' error', function () {
          beforeEach(function () {
            this.login.reject({ name: 'foo', message: 'There\'s an error' })
          })

          it('displays error in ui', () => {
            cy.get('.alert-danger')
            .should('be.visible')
            .contains('There\'s an error')
          })

          it('login button should be enabled', () => {
            cy.get('@loginBtn').should('not.be.disabled')
          }
          )
        })
      })

      describe('when user closes window before logging in', function () {
        beforeEach(function () {
          this.openWindow.reject({ windowClosed: true, name: 'foo', message: 'There\'s an error' })
        })

        it('no longer shows logging in spinner', function () {
          cy.get('.login-content .alert').should('not.exist')

          cy.contains('button', 'Log In with GitHub').should('not.be.disabled')
        })
      })
    })

    describe('Dashboard link in message', () => {
      it('opens link to Dashboard Service on click', () => {
        cy.contains('a', 'Cypress Dashboard Service').click().then(function () {
          expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/dashboard')
        })
      }
      )
    }
    )

    describe('terms and privacy message', () => {
      it('opens links to terms and privacy on click', function () {
        cy.contains('a', 'Terms of Use').click().then(function () {
          expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/terms-of-use')
        })

        cy.contains('a', 'Privacy Policy').click().then(function () {
          expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/privacy-policy')
        })
      })
    }
    )
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

    it('shows \'cannot connect to api server\' message', function () {
      cy.contains('Cannot connect to API server')
      cy.contains('http://api.server')

      cy.contains('ECONNREFUSED')
    })

    describe('trying again', function () {
      beforeEach(() => {
        cy.contains('Try again').click()
      })

      it('pings again', () => {
        cy.get('.loader').then(function () {
          expect(this.ipc.pingApiServer).to.be.calledTwice
        })
      }
      )

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

        cy.get('.login').contains('button', 'Log In with GitHub')
      })
    })

    describe('api help link', () => {
      it('goes to external api help link', () => {
        cy.contains('Learn more').click().then(function () {
          expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/help-connect-to-api')
        })
      }
      )
    }
    )

    describe('closing login', function () {
      beforeEach(() => {
        cy.get('.login .close').click()
      })

      it('shows log in if connected and opened again', function () {
        this.pingApiServerAgain.resolve()
        cy.contains('Log In').click()

        cy.get('.login').contains('button', 'Log In with GitHub')
      })
    })
  })
})
