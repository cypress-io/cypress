describe('Runs List', function () {
  beforeEach(function () {
    cy.fixture('user').as('user')
    cy.fixture('config').as('config')
    cy.fixture('projects').as('projects')
    cy.fixture('specs').as('specs')
    cy.fixture('runs').as('runs')
    cy.fixture('organizations').as('orgs')

    this.goToRuns = () => {
      return cy.get('.navbar-default a')
      .contains('Runs').click()
    }

    this.validCiProject = {
      id: 'project-id-123',
      public: true,
      orgId: '000',
    }

    cy.visitIndex().then(function (win) {
      let start = win.App.start

      this.win = win
      this.ipc = win.App.ipc

      cy.stub(this.ipc, 'getOptions').resolves({ projectRoot: '/foo/bar' })
      cy.stub(this.ipc, 'updaterCheck').resolves(false)
      cy.stub(this.ipc, 'closeBrowser').resolves(null)
      cy.stub(this.ipc, 'getSpecs').yields(null, this.specs)
      cy.stub(this.ipc, 'getOrgs').resolves(this.orgs)
      cy.stub(this.ipc, 'requestAccess')
      cy.stub(this.ipc, 'setupDashboardProject')
      cy.stub(this.ipc, 'externalOpen')
      cy.stub(this.ipc, 'beginAuth').resolves()
      cy.stub(this.ipc, 'setClipboardText')

      this.openProject = this.util.deferred()
      cy.stub(this.ipc, 'openProject').returns(this.openProject.promise)

      this.getCurrentUser = this.util.deferred()
      cy.stub(this.ipc, 'getCurrentUser').returns(this.getCurrentUser.promise)

      this.pingApiServer = this.util.deferred()
      cy.stub(this.ipc, 'pingApiServer').returns(this.pingApiServer.promise)

      this.getProjectStatus = this.util.deferred()
      cy.stub(this.ipc, 'getProjectStatus').returns(this.getProjectStatus.promise)

      this.getRuns = this.util.deferred()
      cy.stub(this.ipc, 'getRuns').returns(this.getRuns.promise)

      start()
    })
  })

  context('page display', function () {
    beforeEach(function () {
      this.getCurrentUser.resolve(this.user)
      this.openProject.resolve(this.config)
      this.getRuns.resolve(this.runs)

      this.goToRuns()
    })

    it('highlights run nav', () => {
      cy.get('.navbar-default a')
      .contains('Runs').should('have.class', 'active')
    })
  })

  context('api server connection', function () {
    beforeEach(function () {
      const timestamp = new Date(2016, 11, 19, 10, 0, 0).valueOf()

      cy.clock(timestamp)
      this.getCurrentUser.resolve(this.user)
      this.openProject.resolve(this.config)
      this.getRuns.resolve(this.runs)

      this.goToRuns()
    })

    it('pings api server', function () {
      expect(this.ipc.pingApiServer).to.be.called

      cy.get('.loader')
    })

    describe('success', function () {
      beforeEach(function () {
        this.pingApiServer.resolve()
      })

      it('shows runs', () => {
        cy.contains('h5', 'Runs')
      })

      context('displays each run\'s data', function () {
        beforeEach(function () {
          cy.get('.runs-container li').first().as('firstRunRow')
          cy.get('.runs-container li').eq(1).as('secondRunRow')
          cy.get('.runs-container li').eq(3).as('fourthRunRow')
        })

        it('displays build num', function () {
          cy.get('@secondRunRow').contains(`#${this.runs[1].buildNumber}`)
          cy.percySnapshot()
        })

        it('displays commit info', function () {
          cy.get('@firstRunRow').contains(this.runs[0].commit.branch)
          cy.get('@firstRunRow').contains(this.runs[0].commit.message)
        })

        it('display no info msg & does not display avatar', () => {
          cy.get('@secondRunRow').within(function () {
            cy.get('.user-avatar').should('not.exist')
            cy.contains('No commit info found')
          })
        })

        it('displays platform info', () => {
          cy.get('@secondRunRow').within(function () {
            cy.contains(this.runs[1].instances[0].platform.osVersionFormatted)
            cy.contains(this.runs[1].instances[0].platform.browserName)
            cy.get('.fa-apple')
            cy.get('.browser-icon')
            .should('have.attr', 'src')
            .and('include', './img/chrome')
          })
        })

        it('does not display browser when null', () => {
          cy.get('@firstRunRow').within(function () {
            cy.contains(this.runs[0].instances[0].platform.osVersionFormatted)
            cy.get('.browser-icon').should('not.exist')
          })
        })

        it('displays totals', function () {
          cy.get('@secondRunRow').contains(this.runs[1].totalFailed)
          cy.get('@secondRunRow').contains(this.runs[1].totalPassed)
        })

        it('displays times', function () {
          cy.get('@secondRunRow').contains('a few secs ago')
          cy.get('@secondRunRow').contains('00:16')
        })

        it('displays separate timers for incomplete runs', function () {
          cy.get('@firstRunRow').contains('12:24:47')
          cy.get('@fourthRunRow').contains('12:45:47')
          .then(() => {
            cy.tick(1000)
          })

          cy.get('@firstRunRow').contains('12:24:48')
          cy.get('@fourthRunRow').contains('12:45:48')
        })

        context('spec display', function () {
          it('displays spec if defined when 1 instance', function () {
            cy.get('@firstRunRow').contains(this.runs[1].instances[0].spec)
          })

          it('does not display spec if null', () => {
            cy.get('.runs-container li').eq(2).contains('spec').should('not.exist')
          })

          it('does not display spec if multiple instances', () => {
            cy.get('.runs-container li').eq(2).contains('spec').should('not.exist')
          })
        })

        context('parallelization disabled', () => {
          it('adds a warning indicator to the run list item', function () {
            cy.get('.env-duration .fa-exclamation-triangle')
            .should('exist')
            .trigger('mouseover')

            cy.get('.cy-tooltip').contains('Parallelization was disabled for this run')
            cy.percySnapshot()
          })
        })
      })
    })

    describe('failure', function () {
      beforeEach(function () {
        this.pingApiServerAgain = this.util.deferred()
        this.ipc.pingApiServer.onCall(1).returns(this.pingApiServerAgain.promise)

        this.pingApiServer.reject({
          apiUrl: 'http://api.server',
          message: 'ECONNREFUSED',
        })
      })

      it('shows "cannot connect to api server" message', function () {
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

        it('shows runs', function () {
          this.pingApiServerAgain.resolve()

          cy.contains('h5', 'Runs')
        })
      })

      describe('api help link', () => {
        it('goes to external api help link', () => {
          cy.contains('Learn more').click().then(function () {
            expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/help-connect-to-api')
          })
        })
      })
    })
  })

  context('with a current user', function () {
    beforeEach(function () {
      this.getCurrentUser.resolve(this.user)
      this.config.projectId = this.projects[0].id
      this.openProject.resolve(this.config)
      this.pingApiServer.resolve()

      const timestamp = new Date(2016, 11, 19, 10, 0, 0).valueOf()

      cy.clock(timestamp)
      .then(() => {
        return this.goToRuns()
      }).then(() => {
        return this.getRuns.resolve(this.runs)
      })
    })

    it('fetches runs', function () {
      expect(this.ipc.getRuns).to.be.called
    })

    it('lists runs', function () {
      cy.get('.runs-container li')
      .should('have.length', this.runs.length)
    })

    it('displays link to dashboard that goes to admin project runs', () => {
      cy.contains('See all').click()
      .then(function () {
        expect(this.ipc.externalOpen).to.be.calledWith(`https://on.cypress.io/dashboard/projects/${this.projects[0].id}/runs`)
      })
    })

    it('displays run status icon', () => {
      cy.get('.runs-container li').first().find('> div')
      .should('have.class', 'running')
    })

    it('displays last updated', () => {
      cy.contains('Last updated: 10:00:00am')
    })

    it('clicking run opens admin', function () {
      cy.get('.runs-container li').first()
      .click()
      .then(() => {
        expect(this.ipc.externalOpen).to.be.calledWith(`https://on.cypress.io/dashboard/projects/${this.projects[0].id}/runs/${this.runs[0].buildNumber}`)
      })
    })
  })

  context('without a current user', function () {
    beforeEach(function () {
      this.getCurrentUser.resolve(null)
      this.openProject.resolve(this.config)
      this.pingApiServer.resolve()

      this.goToRuns()
    })

    it('does not fetch runs', function () {
      expect(this.ipc.getRuns).not.to.be.called
    })

    it('clicking Log In to Dashboard opens login', () => {
      cy.contains('button', 'Log In to Dashboard').click().then(function () {
        expect(this.ipc.beginAuth).to.be.calledOnce
      })

      cy.percySnapshot()
    })

    it('clicking Log In to Dashboard passes utm code', () => {
      cy.contains('button', 'Log In to Dashboard').click().then(function () {
        expect(this.ipc.beginAuth).to.be.calledWith('Runs Tab Login Button')
      })
    })
  })

  context('without a project id', function () {
    beforeEach(function () {
      this.getCurrentUser.resolve(this.user)
      this.config.projectId = undefined
      this.openProject.resolve(this.config)
      this.pingApiServer.resolve()

      this.goToRuns()
    })

    it('displays "need to set up" message', () => {
      cy.contains('You could see test recordings here')
    })
  })

  context('without a current user and without project id', function () {
    beforeEach(function () {
      this.getCurrentUser.resolve(null)
      this.config.projectId = undefined
      this.openProject.resolve(this.config)
      this.pingApiServer.resolve()

      this.goToRuns()
    })

    it('displays "need to set up" message', () => {
      cy.contains('You could see test recordings here')
    })

    describe('click setup project', function () {
      beforeEach(() => {
        cy.contains('Connect to Dashboard').click()
      })

      it('shows login message', () => {
        cy.get('.login h1').should('contain', 'Log In')
      })

      it('clicking Log In to Dashboard opens login', () => {
        cy.contains('button', 'Log In to Dashboard').click().then(function () {
          expect(this.ipc.beginAuth).to.be.calledOnce
        })
      })
    })
  })

  describe('polling runs', function () {
    beforeEach(function () {
      this.getCurrentUser.resolve(this.user)
      this.openProject.resolve(this.config)
      this.pingApiServer.resolve()
      this.getRunsAgain = this.util.deferred()
      this.ipc.getRuns.onCall(1).returns(this.getRunsAgain.promise)

      cy.clock()
      .then(() => {
        return this.goToRuns()
      }).then(() => {
        return this.getRuns.resolve(this.runs)
      })

      cy.get('.runs-container') //# wait for original runs to show
      cy.clock().then(() => {
        this.getRunsAgain = this.util.deferred()
        this.ipc.getRuns.onCall(1).returns(this.getRunsAgain.promise)
      })

      cy.tick(10000)
    })

    it('has original state of runs', () => {
      cy.get('.runs-container li').first().find('> div')
      .should('have.class', 'running')
    })

    it('sends get:runs ipc event', function () {
      expect(this.ipc.getRuns).to.be.calledTwice
    })

    it('disables refresh button', () => {
      cy.get('.runs header button').should('be.disabled')
    })

    it('spins the refresh button', () => {
      cy.get('.runs header button i').should('have.class', 'fa-spin')
    })

    context('success', function () {
      beforeEach(function () {
        this.runs[0].status = 'passed'
        this.getRunsAgain.resolve(this.runs)
      })

      it('updates the runs', () => {
        cy.get('.runs-container li').first().find('> div')
        .should('have.class', 'passed')
      })

      it('enables refresh button', () => {
        cy.get('.runs header button').should('not.be.disabled')
      })

      it('stops spinning the refresh button', () => {
        cy.get('.runs header button i').should('not.have.class', 'fa-spin')
      })
    })

    context('errors', function () {
      beforeEach(function () {
        this.ipcError = (details) => {
          const err = Object.assign(details, { name: 'foo', message: 'There\'s an error' })

          this.getRunsAgain.reject(err)
        }
      })

      it('displays permissions error', function () {
        this.ipcError({ statusCode: 403 })

        cy.contains('Request access')
        cy.percySnapshot()
      })

      it('displays "need to set up" message', function () {
        this.ipcError({ type: 'NO_PROJECT_ID' })

        cy.contains('You could see test recordings here')
      })

      it('displays old runs if another error', function () {
        this.ipcError({ type: 'TIMED_OUT' })

        cy.get('.runs-container li').should('have.length', this.runs.length)
      })
    })
  })

  describe('manually refreshing runs', function () {
    beforeEach(function () {
      this.getCurrentUser.resolve(this.user)
      this.openProject.resolve(this.config)
      this.pingApiServer.resolve()
      this.getRunsAgain = this.util.deferred()
      this.ipc.getRuns.onCall(1).returns(this.getRunsAgain.promise)

      this.getRuns.resolve(this.runs)

      this.goToRuns().then(() => {
        cy.get('.runs header button').click()
      })
    })

    it('sends get:runs ipc event', function () {
      expect(this.ipc.getRuns).to.be.calledTwice
    })

    it('still shows list of runs', function () {
      cy.get('.runs-container li').should('have.length', this.runs.length)
    })

    it('disables refresh button', () => {
      cy.get('.runs header button').should('be.disabled')
    })

    it('spins the refresh button', () => {
      cy.get('.runs header button i').should('have.class', 'fa-spin')
    })

    describe('when runs have loaded', function () {
      beforeEach(function () {
        this.getRunsAgain.resolve(this.runs)
      })

      it('enables refresh button', () => {
        cy.get('.runs header button').should('not.be.disabled')
      })

      it('stops spinning the refresh button', () => {
        cy.get('.runs header button i').should('not.have.class', 'fa-spin')
      })
    })
  })

  context('error states', function () {
    beforeEach(function () {
      this.getCurrentUser.resolve(this.user)
      this.pingApiServer.resolve()
    })

    describe('permissions error', function () {
      beforeEach(function () {
        this.openProject.resolve(this.config)
        this.goToRuns()
      })

      context('statusCode: 403', function () {
        beforeEach(function () {
          this.getRuns.reject({ name: 'foo', message: 'There\'s an error', statusCode: 403 })
        })

        it('displays permissions message', () => {
          cy.contains('Request access')
        })
      })

      context('any case', function () {
        beforeEach(function () {
          this.requestAccess = this.util.deferred()
          this.ipc.requestAccess.returns(this.requestAccess.promise)
          this.getRuns.reject({ name: 'foo', message: 'There\'s an error', statusCode: 403 })
        })

        context('request access', function () {
          beforeEach(() => {
            cy.contains('button', 'Request access').as('requestAccessBtn').click()
          })

          it('sends requests access with project id', function () {
            expect(this.ipc.requestAccess).to.be.calledWith(this.config.projectId)
          })

          it('disables button', () => {
            cy.get('@requestAccessBtn').should('be.disabled')
          })

          it('hides "Request access" text', () => {
            cy.get('@requestAccessBtn').find('span').should('not.be.visible')
          })

          it('shows spinner', () => {
            cy.get('@requestAccessBtn').find('> i').should('be.visible')
          })

          describe('when request succeeds', function () {
            beforeEach(function () {
              this.requestAccess.resolve()
            })

            it('shows success message', () => {
              cy.contains('Request sent')
              cy.percySnapshot()
            })

            it('persists request state (until app is reloaded at least)', function () {
              this.ipc.getRuns.onCall(1).rejects({ name: 'foo', message: 'There\'s an error', statusCode: 403 })

              cy.get('.navbar-default a').contains('Tests').click()
              cy.get('.navbar-default a').contains('Runs').click()

              cy.contains('Request sent')
            })
          })

          describe('when request succeeds and user is already a member', function () {
            beforeEach(function () {
              this.requestAccess.reject({ name: 'foo', message: 'There\'s an error', type: 'ALREADY_MEMBER' })
              this.getRuns = this.util.deferred()
              this.ipc.getRuns.onCall(1).returns(this.getRuns.promise)

              this.ipc.getRuns.onCall(2).returns(this.getRuns.promise)
            })

            it('retries getting runs', function () {
              cy.wrap(this.ipc.getRuns).its('callCount').should('be.above', 1)
            })

            it('shows loading spinner', () => {
              cy.get('.loader')
            })

            it('shows runs when getting runs succeeds', function () {
              this.getRuns.resolve(this.runs)

              cy.get('.runs-container li')
              .should('have.length', this.runs.length)
            })
          })

          describe('when request fails', function () {
            describe('for unknown reason', function () {
              beforeEach(function () {
                this.requestAccess.reject({ name: 'foo', message: `\
{
  "cheese": "off the cracker"
}\
` })

                //# block the subsequent tests until
                //# this is displayed in the DOM
                cy.contains('Request Failed')
                cy.contains('off the cracker')
                cy.contains('button', 'Request access').as('requestAccessBtn')
              })

              it('enables button', () => {
                cy.get('@requestAccessBtn').should('not.be.disabled')
                cy.percySnapshot()
              })

              it('shows "Request access" text', () => {
                cy.get('@requestAccessBtn').find('span').should('be.visible')
              })

              it('hides spinner', () => {
                cy.get('@requestAccessBtn').find('> i').should('not.be.visible')
              })
            })

            describe('because requested was denied', function () {
              beforeEach(function () {
                this.requestAccess.reject({ type: 'DENIED', name: 'foo', message: 'There\'s an error' })
              })

              it('shows "success" message', () => {
                cy.contains('Request sent')
              })
            })

            describe('because request was already sent', function () {
              beforeEach(function () {
                this.requestAccess.reject({ type: 'ALREADY_REQUESTED', name: 'foo', message: 'There\'s an error' })
              })

              it('shows "success" message', () => {
                cy.contains('Request sent')
              })
            })

            describe('because user became unauthenticated', function () {
              beforeEach(function () {
                this.requestAccess.reject({ name: '', message: '', statusCode: 401 })
              })

              it('logs user out', () => {
                cy.shouldBeLoggedOut()
              })

              it('shows login message', () => {
                cy.get('.empty h4').should('contain', 'Log in')
                cy.percySnapshot()
              })

              it('clicking Log In to Dashboard opens login', () => {
                cy.contains('button', 'Log In to Dashboard').click().then(function () {
                  expect(this.ipc.beginAuth).to.be.called
                })
              })
            })
          })
        })
      })
    })

    describe('timed out error', function () {
      beforeEach(function () {
        this.openProject.resolve(this.config)

        this.goToRuns().then(() => {
          this.getRuns.reject({ name: 'foo', message: 'There\'s an error', type: 'TIMED_OUT' })
        })
      })

      it('displays timed out message', () => {
        cy.contains('timed out')
        cy.percySnapshot()
      })
    })

    describe('not found error', function () {
      beforeEach(function () {
        this.openProject.resolve(this.config)

        this.goToRuns().then(() => {
          this.getRuns.reject({ name: 'foo', message: 'There\'s an error', type: 'NOT_FOUND' })
        })
      })

      it('displays empty message', () => {
        cy.contains('Runs cannot be displayed')
        cy.percySnapshot()
      })
    })

    describe('unauthenticated error', function () {
      beforeEach(function () {
        this.openProject.resolve(this.config)

        this.goToRuns().then(() => {
          this.getRuns.reject({ name: '', message: '', statusCode: 401 })
        })
      })

      it('logs user out', () => {
        cy.shouldBeLoggedOut()
      })

      it('shows login message', () => {
        cy.get('.empty h4').should('contain', 'Log in')
      })
    })

    describe('no project id error', function () {
      beforeEach(function () {
        this.openProject.resolve(this.config)
        this.ipc.setupDashboardProject.resolves(this.validCiProject)
        this.ipc.getRuns.onCall(1).resolves([])

        this.goToRuns().then(() => {
          this.getRuns.reject({ name: 'foo', message: 'There\'s an error', type: 'NO_PROJECT_ID' })
        })
      })

      it('displays "need to set up" message', () => {
        cy.contains('You could see test recordings here')
        cy.percySnapshot()
      })

      it('clears message after setting up to record', () => {
        cy.contains('.btn', 'Connect to Dashboard').click()
        cy.get('.organizations-select__dropdown-indicator').click()
        cy.get('.organizations-select__menu').should('be.visible')
        cy.get('.organizations-select__option')
        .contains('Your personal organization').click()

        cy.get('.privacy-radio').find('input').last().check()
        cy.get('.modal-body')
        .contains('.btn', 'Set up project').click()

        cy.contains('To record your first')
        cy.percySnapshot()
      })
    })

    describe('unexpected error', function () {
      beforeEach(function () {
        this.openProject.resolve(this.config)

        this.goToRuns().then(() => {
          this.getRuns.reject({ name: 'foo', message: `{"no runs": "for you"}`, type: 'UNKNOWN' })
        })
      })

      it('displays unexpected error message', function () {
        cy.contains('unexpected error')
        cy.contains('"no runs": "for you"')
        cy.percySnapshot()
      })
    })

    describe('unauthorized project', function () {
      beforeEach(function () {
        this.openProject.resolve(this.config)
        this.getProjectStatus.resolve({
          state: 'UNAUTHORIZED',
        })

        this.goToRuns()
      })

      it('displays permissions message', () => {
        cy.contains('Request access')
      })
    })

    describe('invalid project', function () {
      beforeEach(function () {
        this.openProject.resolve(this.config)
        this.ipc.setupDashboardProject.resolves(this.validCiProject)

        this.getProjectStatus.resolve({
          state: 'INVALID',
        })

        this.goToRuns()
      })

      it('displays empty message', () => {
        cy.contains('Runs cannot be displayed')
      })

      it('clicking link opens setup project window', function () {
        cy.contains('.btn', 'Set up a new project').click()
        cy.get('.modal').should('be.visible')
      })

      it('clears message after setting up CI', function () {
        cy.contains('.btn', 'Set up a new project').click()
        cy.get('.organizations-select__dropdown-indicator').click()
        cy.get('.organizations-select__menu').should('be.visible')
        cy.get('.organizations-select__option')
        .contains('Your personal organization').click()

        cy.get('.privacy-radio').find('input').last().check()
        cy.get('.modal-body')
        .contains('.btn', 'Set up project').click()

        cy.contains('To record your first')
      })
    })

    describe('no runs', () => {
      context('having never setup CI', function () {
        beforeEach(function () {
          this.config.projectId = null
          this.openProject.resolve(this.config)

          this.goToRuns().then(() => {
            this.getRuns.resolve([])
          })
        })

        it('displays "need to set up" message', () => {
          cy.contains('You could see test recordings here')
        })

        it('banner does not cover browser dropdown', () => {
          // The browser dropdown would sometimes display behind the runs banner
          cy.contains('.dropdown-chosen', 'Chrome').click()
          cy.get('.browsers-list')
          .find('.dropdown-menu li').first().should('be.visible')

          cy.percySnapshot()
        })
      })
    })

    context('having previously set up CI', function () {
      beforeEach(function () {
        this.openProject.resolve(this.config)

        this.goToRuns().then(() => {
          this.getRuns.resolve([])
        })
      })

      it('displays empty message', () => {
        cy.contains('To record your first')
      })

      it('opens project id guide on clicking "Why?"', () => {
        cy.contains('Why?').click()
        .then(function () {
          expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/what-is-a-project-id')
        })
      })

      it('opens dashboard on clicking "Cypress Dashboard"', () => {
        cy.contains('Cypress Dashboard').click()
        .then(function () {
          expect(this.ipc.externalOpen).to.be.calledWith(`https://on.cypress.io/dashboard/projects/${this.config.projectId}/runs`)
        })
      })

      it('shows tooltip on hover of copy to clipboard', () => {
        cy.get('#code-record-command').find('.action-copy').trigger('mouseover')
        cy.get('.cy-tooltip').should('contain', 'Copy to clipboard')
        cy.get('#code-record-command').find('.action-copy').trigger('mouseout')

        cy.get('#code-project-id-config').find('.action-copy').trigger('mouseover')
        cy.get('.cy-tooltip').should('contain', 'Copy to clipboard')
        cy.get('#code-project-id-config').find('.action-copy').trigger('mouseout')
      })

      it('copies record key command to clipboard', () => {
        cy.get('#code-record-command').find('.action-copy').click()
        .then(function () {
          expect(this.ipc.setClipboardText).to.be.calledWith(`cypress run --record --key <record-key>`)
        })
      })

      it('copies project id config to clipboard', () => {
        cy.get('#code-project-id-config').find('.action-copy').click()
        .then(function () {
          const expectedJsonConfig = {
            projectId: this.config.projectId,
          }
          const expectedCopyCommand = JSON.stringify(expectedJsonConfig, null, 2)

          expect(this.ipc.setClipboardText).to.be.calledWith(expectedCopyCommand)
        })
      })
    })
  })
})
