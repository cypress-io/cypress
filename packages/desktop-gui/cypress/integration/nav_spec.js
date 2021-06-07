describe('Navigation', function () {
  beforeEach(function () {
    cy.fixture('user').as('user')
    cy.fixture('config').as('config')
    cy.fixture('specs').as('specs')

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
      cy.stub(this.ipc, 'getSpecs').yields(null, this.specs)

      this.getOptions = this.util.deferred()
      cy.stub(this.ipc, 'getOptions').returns(this.getOptions.promise)

      this.getCurrentUser = this.util.deferred()
      cy.stub(this.ipc, 'getCurrentUser').returns(this.getCurrentUser.promise)

      this.openProject = this.util.deferred()
      cy.stub(this.ipc, 'openProject').resolves(this.openProject.promise)

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
        cy.contains('Set up CI').click().then(() => {
          expect(this.ipc.externalOpen).to.be.calledWithMatch({ url: 'https://on.cypress.io/ci' })
        })
      })
    })

    context('with a project', function () {
      beforeEach(function () {
        this.getOptions.resolve({ projectRoot: '/foo/bar' })
      })

      it('closes off hover', function () {
        this.openProject.resolve(this.config)

        cy.get('.docs-menu').trigger('mouseover')
        cy.get('.docs-dropdown').should('be.visible')

        cy.get('.docs-menu').trigger('mouseout')
        cy.get('.docs-dropdown').should('not.exist')
      })

      describe('prompts', function () {
        describe('ci1', function () {
          context('opens on click', function () {
            beforeEach(function () {
              this.openProject.resolve(this.config)

              cy.get('.docs-menu').trigger('mouseover')
              cy.get('.docs-dropdown').should('be.visible')
              cy.contains('Set up CI').click()
            })

            it('opens on menu item click', function () {
              // should open in beforeEach
              cy.get('.prompt-ci1').should('be.visible')
              cy.get('.docs-dropdown').should('not.exist')

              cy.percySnapshot()
            })

            it('is dismissible from X icon', function () {
              cy.get('.close').click()
              cy.get('.prompt-ci1').should('not.exist')
            })

            it('is dismissible from close button', function () {
              cy.get('.prompt-ci1').contains('Close').click()
              cy.get('.prompt-ci1').should('not.exist')
            })

            it('links to various ci providers', function () {
              cy.get('.ci-provider-button').click({ multiple: true })
              cy.wrap(this.ipc.externalOpen).should('have.callCount', 5)
            })

            it('links to more information with correct utm_content', function () {
              cy.get('.see-other-guides').click()
              cy.wrap(this.ipc.externalOpen).should('have.been.calledWithMatch', {
                url: 'https://on.cypress.io/setup-ci',
                params: {
                  utm_content: 'Manual',
                },
              })

              cy.get('.prompt-ci1').contains('Learn More').click()
              cy.wrap(this.ipc.externalOpen).should('have.been.calledWithMatch', {
                url: 'https://on.cypress.io/ci',
                params: {
                  utm_content: 'Manual',
                },
              })
            })
          })

          context('opens automatically', function () {
            beforeEach(function () {
              // 5 days from firstOpened in fixture
              cy.clock(1609891200000)
            })

            it('opens when after 4 days from first open, no projectId, and not already shown', function () {
              this.openProject.resolve({
                ...this.config,
                projectId: null,
                state: {
                  ...this.config.state,
                  promptsShown: {},
                },
              })

              cy.get('.prompt-ci1').should('be.visible')
            })

            it('sends correct utm_content when opened', function () {
              this.openProject.resolve({
                ...this.config,
                projectId: null,
                state: {
                  ...this.config.state,
                  promptsShown: {},
                },
              })

              cy.get('.see-other-guides').click()
              cy.wrap(this.ipc.externalOpen).should('have.been.calledWithMatch', {
                url: 'https://on.cypress.io/setup-ci',
                params: {
                  utm_content: 'Automatic',
                },
              })

              cy.get('.prompt-ci1').contains('Learn More').click()
              cy.wrap(this.ipc.externalOpen).should('have.been.calledWithMatch', {
                url: 'https://on.cypress.io/ci',
                params: {
                  utm_content: 'Automatic',
                },
              })
            })

            it('does not open when previously shown', function () {
              // fixture marks prompt as shown
              this.openProject.resolve(this.config)

              cy.get('.prompt-ci1').should('not.exist')
            })

            it('does not open when projectId exists', function () {
              // projectId exists in fixture
              this.openProject.resolve(this.config)

              cy.get('.prompt-ci1').should('not.exist')
            })

            it('does not open when another prompt has been shown recently', function () {
              this.openProject.resolve({
                ...this.config,
                projectId: null,
                state: {
                  ...this.config.state,
                  promptsShown: {
                    // within 24 hours before the stubbed current time
                    dashboard1: 1609891100000,
                  },
                },
              })

              cy.get('.prompt-ci1').should('not.exist')
            })
          })
        })

        describe('orchestration1', function () {
          it('is not open by default', function () {
            cy.get('.prompt-orchestration1').should('not.exist')
          })

          context('opens on click', function () {
            beforeEach(function () {
              this.openProject.resolve(this.config)

              cy.get('.docs-menu').trigger('mouseover')
              cy.get('.docs-dropdown').should('be.visible')
              cy.contains('Run tests faster').click()
            })

            it('opens on menu item click', function () {
              // should open in beforeEach
              cy.get('.prompt-orchestration1').should('be.visible')
              cy.get('.docs-dropdown').should('not.exist')

              cy.percySnapshot()
            })

            it('is dismissible from X icon', function () {
              cy.get('.close').click()
              cy.get('.prompt-orchestration1').should('not.exist')
            })

            it('is dismissible from close button', function () {
              cy.get('.prompt-orchestration1').contains('Close').click()
              cy.get('.prompt-orchestration1').should('not.exist')
            })

            it('links to more information', function () {
              cy.get('.prompt-orchestration1').contains('Learn More').click()
              cy.wrap(this.ipc.externalOpen).should('have.been.calledWithMatch', { url: 'https://on.cypress.io/smart-orchestration' })
            })
          })
        })
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
