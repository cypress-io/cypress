describe('Set Up Project', function () {
  beforeEach(function () {
    cy.fixture('user').as('user')
    cy.fixture('projects').as('projects')
    cy.fixture('projects_statuses').as('projectStatuses')
    cy.fixture('config').as('config')
    cy.fixture('specs').as('specs')
    cy.fixture('organizations').as('orgs')
    cy.fixture('keys').as('keys')

    cy.visitIndex().then(function (win) {
      let start

      ;({ start, ipc: this.ipc } = win.App) // don't remove this semicolon 😅

      this.config.projectName = 'my-kitchen-sink'

      cy.stub(this.ipc, 'getOptions').resolves({ projectRoot: '/foo/bar' })
      cy.stub(this.ipc, 'updaterCheck').resolves(false)
      cy.stub(this.ipc, 'closeBrowser').resolves(null)
      this.config.projectId = null
      cy.stub(this.ipc, 'openProject').resolves(this.config)
      cy.stub(this.ipc, 'getSpecs').yields(null, this.specs)
      cy.stub(this.ipc, 'getRuns').resolves([])
      cy.stub(this.ipc, 'getRecordKeys').resolves(this.keys)
      cy.stub(this.ipc, 'pingApiServer').resolves()
      cy.stub(this.ipc, 'externalOpen')

      this.getCurrentUser = this.util.deferred()
      cy.stub(this.ipc, 'getCurrentUser').resolves(this.getCurrentUser.promise)

      this.getOrgs = this.util.deferred()
      cy.stub(this.ipc, 'getOrgs').returns(this.getOrgs.promise)

      this.getProjectStatus = this.util.deferred()
      cy.stub(this.ipc, 'getProjectStatus').returns(this.getProjectStatus.promise)

      this.setupDashboardProject = this.util.deferred()
      cy.stub(this.ipc, 'setupDashboardProject').returns(this.setupDashboardProject.promise)

      start()

      cy.get('.navbar-default a')
      .contains('Runs').click()
    })
  })

  it('displays \'need to set up\' message', () => {
    cy.contains('You have no recorded runs')
  })

  describe('when there is a current user', function () {
    beforeEach(function () {
      this.getCurrentUser.resolve(this.user)
    })

    describe('general behavior', function () {
      beforeEach(function () {
        this.getOrgs.resolve(this.orgs)

        cy.get('.btn').contains('Set up project').click()
      })

      it('clicking link opens setup project window', () => {
        cy.get('.modal').should('be.visible')
      })

      it('submit button is disabled', () => {
        cy.get('.modal').contains('.btn', 'Set up project')
        .should('be.disabled')
      })

      it('prefills Project Name', function () {
        cy.get('#projectName').should('have.value', this.config.projectName)
      })

      it('allows me to change Project Name value', () => {
        cy.get('#projectName').clear().type('New Project Here')
        .should('have.value', 'New Project Here')
      })

      describe('default owner', function () {
        it('has no owner selected by default', function () {
          cy.get('#me').should('not.be.selected')

          cy.get('#org').should('not.be.selected')
        })

        it('org docs are linked', () => {
          cy.contains('label', 'Who should own this')
          .find('a').click().then(function () {
            expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/what-are-organizations')
          })
        }
        )
      })

      describe('selecting me as owner', function () {
        beforeEach(function () {
          cy.get('.privacy-radio').should('not.be.visible')

          cy.get('.modal-content')
          .contains('.btn', 'Me').click()
        })

        it('access docs are linked', () => {
          cy.contains('label', 'Who should see the runs')
          .find('a').click().then(function () {
            expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/what-is-project-access')
          })
        }
        )

        it('displays public & private radios with no preselects', () => {
          cy.get('.privacy-radio').should('be.visible')
          .find('input').should('not.be.checked')
        })
      })
    })

    describe('selecting an org', function () {
      context('with orgs', function () {
        beforeEach(function () {
          this.getOrgs.resolve(this.orgs)
          cy.get('.btn').contains('Set up project').click()

          cy.get('.modal-content')
          .contains('.btn', 'An Organization').click()
        })

        it('lists organizations to assign to project', function () {
          cy.get('#organizations-select').find('option')
          .should('have.length', this.orgs.length)
        })

        it('selects none by default', () => {
          cy.get('#organizations-select').should('have.value', '')
        })

        it('opens external link on click of manage', () => {
          cy.get('.manage-orgs-btn').click().then(function () {
            expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/dashboard/organizations')
          })
        })

        it('displays public & private radios on select', function () {
          cy.get('.privacy-radio').should('not.be.visible')
          cy.get('select').select('Acme Developers')

          cy.get('.privacy-radio').should('be.visible')
          .find('input').should('not.be.checked')
        })

        it('clears selections when switching back to Me', function () {
          cy.get('select').select('Acme Developers')
          cy.get('.privacy-radio')
          .find('input').first().check()
          cy.get('.btn').contains('Me').click()
          cy.get('.privacy-radio').find('input').should('not.be.checked')
          cy.get('.btn').contains('An Organization').click()

          cy.get('#organizations-select').should('have.value', '')
        })
      })

      context('without orgs', function () {
        beforeEach(function () {
          this.getOrgs.resolve([])
          cy.get('.btn').contains('Set up project').click()

          cy.get('.modal-content')
          .contains('.btn', 'An Organization').click()
        })

        it('displays empty message', () => {
          cy.get('.empty-select-orgs').should('be.visible')
        })

        it('opens dashboard organizations when \'create org\' is clicked', () => {
          cy.contains('Create organization').click().then(function () {
            expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/dashboard/organizations')
          })
        }
        )
      })

      context('without only default org', function () {
        beforeEach(function () {
          this.getOrgs.resolve([{
            'id': '000',
            'name': 'Jane Lane',
            'default': true,
          }])
          cy.get('.btn').contains('Set up project').click()

          cy.get('.modal-content')
          .contains('.btn', 'An Organization').click()
        })

        it('displays empty message', () => {
          cy.get('.empty-select-orgs').should('be.visible')
        })

        it('opens dashboard organizations when \'create org\' is clicked', () => {
          cy.contains('Create organization').click().then(function () {
            expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/dashboard/organizations')
          })
        })
      })

      context('polls for updates to organizations', function () {
        beforeEach(function () {
          cy.clock()
          this.getOrgs.resolve(this.orgs)
          cy.get('.btn').contains('Set up project').click()

          cy.get('.modal-content')
          .contains('.btn', 'An Organization').click()
        })

        it('polls for orgs twice in 10+sec on click of org', function () {
          cy.tick(11000).then(() => {
            expect(this.ipc.getOrgs).to.be.calledTwice
          })
        })

        it('updates org name on list on successful poll', function () {
          this.name = 'Foo Bar Devs'
          this.orgs[0].name = this.name
          this.getOrgsAgain = this.ipc.getOrgs.onCall(2).resolves(this.orgs)

          cy.tick(11000)

          cy.get('#organizations-select').find('option')
          .contains(this.name)
        })

        it('adds new org to list on successful poll', function () {
          this.orgs.push({
            'id': '333',
            'name': 'Ivory Developers',
            'default': false,
          })
          this.getOrgsAgain = this.ipc.getOrgs.onCall(2).resolves(this.orgs)

          cy.tick(11000)

          cy.get('#organizations-select').find('option')
          .should('have.length', this.orgs.length)
        })
      })
    })

    describe('on submit', function () {
      beforeEach(function () {
        this.getOrgs.resolve(this.orgs)
        cy.contains('.btn', 'Set up project').click()
        cy.get('.modal-body')
        .contains('.btn', 'Me').click()
        cy.get('.privacy-radio').find('input').last().check()

        cy.get('.modal-body')
        .contains('.btn', 'Set up project').click()
      })

      it('disables button', () => {
        cy.get('.modal-body')
        .contains('.btn', 'Set up project')
        .should('be.disabled')
      })

      it('shows spinner', () => {
        cy.get('.modal-body')
        .contains('.btn', 'Set up project')
        .find('i')
        .should('be.visible')
      })
    })

    describe('successfully submit form', function () {
      beforeEach(function () {
        this.getOrgs.resolve(this.orgs)
        this.setupDashboardProject.resolve({
          id: 'project-id-123',
          public: true,
          orgId: '000',
        })

        cy.contains('.btn', 'Set up project').click()
      })

      it('sends project name, org id, and public flag to ipc event', function () {
        cy.get('.modal-body')
        .contains('.btn', 'An Organization').click()
        cy.get('#projectName').clear().type('New Project')
        cy.get('select').select('Acme Developers')
        cy.get('.privacy-radio').find('input').first().check()

        cy.get('.modal-body')
        .contains('.btn', 'Set up project').click()
        .then(() => {
          expect(this.ipc.setupDashboardProject).to.be.calledWith({
            projectName: 'New Project',
            orgId: '777',
            public: true,
          })
        })
      })

      context('org/public', function () {
        beforeEach(function () {
          cy.get('.modal-body')
          .contains('.btn', 'An Organization').click()
          cy.get('select').select('Acme Developers')
          cy.get('.privacy-radio').find('input').first().check()

          cy.get('.modal-body')
          .contains('.btn', 'Set up project').click()
        })

        it('sends data from form to ipc event', function () {
          expect(this.ipc.setupDashboardProject).to.be.calledWith({
            projectName: this.config.projectName,
            orgId: '777',
            public: true,
          })
        })
      })

      context('me/private', function () {
        beforeEach(function () {
          cy.get('.modal-body')
          .contains('.btn', 'Me').click()
          cy.get('.privacy-radio').find('input').last().check()

          cy.get('.modal-body')
          .contains('.btn', 'Set up project').click()
        })

        it('sends data from form to ipc event', function () {
          expect(this.ipc.setupDashboardProject).to.be.calledWith({
            projectName: this.config.projectName,
            orgId: '000',
            public: false,
          })
        })
      })

      context('me/public', function () {
        beforeEach(function () {
          cy.get('.modal-body')
          .contains('.btn', 'Me').click()
          cy.get('.privacy-radio').find('input').first().check()

          cy.get('.modal-body')
          .contains('.btn', 'Set up project').click()
        })

        it('sends data from form to ipc event', function () {
          expect(this.ipc.setupDashboardProject).to.be.calledWith({
            projectName: this.config.projectName,
            orgId: '000',
            public: true,
          })
        })

        it('closes modal', () => {
          cy.get('.modal').should('not.be.visible')
        })

        it('updates localStorage projects cache', () => {
          expect(JSON.parse(localStorage.projects || '[]')[0].orgName).to.equal('Jane Lane')
        })

        it('displays empty runs page', () => {
          cy.contains('To record your first')
        })

        it('displays command to run with the record key', () => {
          cy.contains('cypress run --record --key record-key-123')
        })
      })
    })

    describe('errors', function () {
      beforeEach(function () {
        this.getOrgs.resolve(this.orgs)
        cy.contains('.btn', 'Set up project').click()
        cy.get('.modal-body')
        .contains('.btn', 'Me').click()
        cy.get('.privacy-radio').find('input').last().check()

        cy.get('.modal-body')
        .contains('.btn', 'Set up project').click()
      })

      it('logs user out when 401', function () {
        this.setupDashboardProject.reject({ name: '', message: '', statusCode: 401 })

        cy.shouldBeLoggedOut()
      })

      it('displays error name and message when unexpected', function () {
        this.setupDashboardProject.reject({
          name: 'Fatal Error!',
          message: `\
{
  "system": "down",
  "toxicity": "of the city"
}\
`,
        })

        cy.contains('"system": "down"')
      })
    })

    describe('when get orgs 401s', function () {
      beforeEach(function () {
        cy.contains('.btn', 'Set up project').click()
        .then(() => {
          this.getOrgs.reject({ name: '', message: '', statusCode: 401 })
        })
      })

      it('logs user out', () => {
        cy.shouldBeLoggedOut()
      })
    })
  })

  describe('when there is no current user', function () {
    beforeEach(function () {
      this.getCurrentUser.resolve(null)

      cy.get('.btn').contains('Set up project').click()
    })

    it('shows login', () => {
      cy.get('.modal').contains('Log In with GitHub')
    })

    describe('when login succeeds', function () {
      beforeEach(function () {
        cy.stub(this.ipc, 'windowOpen').resolves()
        cy.stub(this.ipc, 'logIn').resolves(this.user)

        cy.contains('button', 'Log In with GitHub').click()
      })

      it('shows setup', () => {
        cy.contains('h4', 'Set up project')
      })
    })
  })
})
