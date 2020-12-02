describe('Connect to Dashboard', function () {
  beforeEach(function () {
    cy.fixture('user').as('user')
    cy.fixture('projects').as('projects')
    cy.fixture('projects_statuses').as('projectStatuses')
    cy.fixture('config').as('config')
    cy.fixture('specs').as('specs')
    cy.fixture('organizations').as('orgs')
    cy.fixture('keys').as('keys')

    cy.visitIndex().then(function (win) {
      let start = win.App.start

      this.win = win
      this.ipc = win.App.ipc

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

  it('displays "need to set up" message', () => {
    cy.contains('You could see test recordings here')
  })

  describe('when there is a current user', function () {
    beforeEach(function () {
      this.getCurrentUser.resolve(this.user)
    })

    describe('general behavior', function () {
      beforeEach(function () {
        this.getOrgs.resolve(this.orgs)

        cy.get('.btn').contains('Connect to Dashboard').click()
      })

      it('clicking link opens setup project window', () => {
        cy.get('.modal').should('be.visible')
        cy.percySnapshot()
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

      it('org docs are linked', () => {
        cy.contains('label', 'Who should own this')
        .find('a').click().then(function () {
          expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/what-are-organizations')
        })
      })
    })

    describe('loading behavior', function () {
      beforeEach(function () {
        cy.get('.btn').contains('Connect to Dashboard').click()
      })

      it('calls getOrgs', function () {
        expect(this.ipc.getOrgs).to.be.calledOnce
      })

      it('displays loading view before orgs load', function () {
        cy.get('.loader').then(function () {
          this.getOrgs.resolve(this.orgs)
        })

        cy.get('.loader').should('not.exist')
      })
    })

    describe('selecting an org', function () {
      describe('selecting Personal org', function () {
        beforeEach(function () {
          this.getOrgs.resolve(this.orgs)

          cy.get('.btn').contains('Connect to Dashboard').click()
          cy.get('.modal-content')
          cy.get('.organizations-select__dropdown-indicator').click()
          cy.get('.organizations-select__menu').should('be.visible')
          cy.get('.organizations-select__option')
          .contains('Your personal organization').click()
        })

        it('access docs are linked', () => {
          cy.contains('label', 'Who should see the runs')
          .find('a').click().then(function () {
            expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/what-is-project-access')
          })
        })

        it('displays public & private radios with no preselects', () => {
          cy.get('.privacy-radio').should('be.visible')
          .find('input').should('not.be.checked')
        })
      })

      context('with orgs', function () {
        beforeEach(function () {
          this.getOrgs.resolve(this.orgs)
          cy.get('.btn').contains('Connect to Dashboard').click()

          cy.get('.modal-content')
        })

        it('lists organizations to assign to project', function () {
          cy.get('.empty-select-orgs').should('not.exist')
          cy.get('.organizations-select__dropdown-indicator').click()
          cy.get('.organizations-select__menu').should('be.visible')
          cy.get('.organizations-select__option')
          .should('have.length', this.orgs.length)

          cy.percySnapshot()
        })

        it('selects personal org by default', function () {
          cy.get('.organizations-select').contains(
            'Your personal organization',
          )

          cy.get('.privacy-radio').should('be.visible')
        })

        it('opens external link on click of manage', () => {
          cy.get('.manage-orgs-btn').click().then(function () {
            expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/dashboard/organizations')
          })
        })

        it('displays public & private radios on select', function () {
          cy.get('.organizations-select__dropdown-indicator').click()
          cy.get('.organizations-select__menu').should('be.visible')
          cy.get('.organizations-select__option')
          .contains('Acme Developers').click()

          cy.get('.privacy-radio').should('be.visible')
          .find('input').should('not.be.checked')

          cy.percySnapshot()
        })
      })

      context('orgs with no default org', function () {
        beforeEach(function () {
          this.getOrgs.resolve(Cypress._.filter(this.orgs, { 'default': false }))
          cy.get('.btn').contains('Connect to Dashboard').click()
        })

        it('lists organizations to assign to project', function () {
          cy.get('.empty-select-orgs').should('not.exist')
          cy.get('.organizations-select__dropdown-indicator').click()
          cy.get('.organizations-select__menu').should('be.visible')
          cy.get('.organizations-select__option')
          // do not count the default org we removed
          .should('have.length', this.orgs.length - 1)
        })

        it('selects first org by default', function () {
          cy.get('.organizations-select').contains(this.orgs[1].name)
        })

        it('opens external link on click of manage', () => {
          cy.get('.manage-orgs-btn').click().then(function () {
            expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/dashboard/organizations')
          })
        })

        it('displays public & private radios on select', function () {
          cy.get('.organizations-select__dropdown-indicator').click()
          cy.get('.organizations-select__menu').should('be.visible')
          cy.get('.organizations-select__option')
          .contains('Acme Developers').click()

          cy.get('.privacy-radio').should('be.visible')
          .find('input').should('not.be.checked')
        })
      })

      context('without orgs', function () {
        beforeEach(function () {
          this.getOrgs.resolve([])
          cy.get('.btn').contains('Connect to Dashboard').click()
        })

        it('displays empty message', () => {
          cy.get('.empty-select-orgs').should('be.visible')
          cy.get('.organizations-select').should('not.exist')
          cy.get('.privacy-radio').should('not.be.visible')
          cy.percySnapshot()
        })

        it('opens dashboard organizations when \'create org\' is clicked', () => {
          cy.contains('Create organization').click().then(function () {
            expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/dashboard/organizations')
          })
        })
      })

      context('with only default org', function () {
        beforeEach(function () {
          this.getOrgs.resolve([{
            'id': '000',
            'name': 'Jane Lane',
            'default': true,
          }])

          cy.get('.btn').contains('Connect to Dashboard').click()
          cy.get('.modal-content')
        })

        it('displays in dropdown', () => {
          cy.get('.organizations-select__dropdown-indicator').click()
          cy.get('.organizations-select__menu').should('be.visible')
          cy.get('.organizations-select__option').should('have.length', 1)
        })

        it('sends values during submit', function () {
          cy.get('.privacy-radio').find('input').first().check()
          cy.get('.modal-body')
          .contains('.btn', 'Set up project').click()
          .then(() => {
            expect(this.ipc.setupDashboardProject).to.be.calledWith({
              projectName: 'my-kitchen-sink',
              orgId: '000',
              public: true,
            })
          })
        })
      })

      context('polls for updates to organizations', function () {
        beforeEach(function () {
          cy.clock()
          this.getOrgs.resolve(this.orgs)
          cy.get('.btn').contains('Connect to Dashboard').click()
        })

        it('polls for orgs twice in 10+sec on click of org', function () {
          cy.tick(11000).then(() => {
            expect(this.ipc.getOrgs).to.be.calledTwice
          })
        })

        it('updates org name on list on successful poll', function () {
          this.name = 'Foo Bar Devs'
          this.orgs[1].name = this.name
          this.getOrgsAgain = this.ipc.getOrgs.onCall(2).resolves(this.orgs)

          cy.tick(11000)

          cy.get('.organizations-select__dropdown-indicator').click()
          cy.get('.organizations-select__menu').should('be.visible')
          cy.get('.organizations-select__option')
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

          cy.get('.organizations-select__dropdown-indicator').click()
          cy.get('.organizations-select__menu').should('be.visible')
          cy.get('.organizations-select__option')
          .should('have.length', this.orgs.length)
        })
      })
    })

    describe('on submit', function () {
      beforeEach(function () {
        this.getOrgs.resolve(this.orgs)
        cy.contains('.btn', 'Connect to Dashboard').click()
        cy.get('.organizations-select__dropdown-indicator').click()
        cy.get('.organizations-select__menu').should('be.visible')
        cy.get('.organizations-select__option')
        .contains('Your personal organization').click()

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

        cy.contains('.btn', 'Connect to Dashboard').click()
      })

      it('sends project name, org id, and public flag to ipc event', function () {
        cy.get('#projectName').clear().type('New Project')
        cy.get('.organizations-select__dropdown-indicator').click()
        cy.get('.organizations-select__menu').should('be.visible')
        cy.get('.organizations-select__option')
        .contains('Acme Developers').click()

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
          cy.get('.organizations-select__dropdown-indicator').click()
          cy.get('.organizations-select__menu').should('be.visible')
          cy.get('.organizations-select__option')
          .contains('Acme Developers').click()

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
          cy.get('.organizations-select__dropdown-indicator').click()
          cy.get('.organizations-select__menu').should('be.visible')
          cy.get('.organizations-select__option')
          .contains('Your personal organization').click()

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
          cy.get('.organizations-select__dropdown-indicator').click()
          cy.get('.organizations-select__menu').should('be.visible')
          cy.get('.organizations-select__option')
          .contains('Your personal organization').click()

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
          cy.get('.modal').should('not.exist')
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
        cy.contains('.btn', 'Connect to Dashboard').click()
        cy.get('.organizations-select__dropdown-indicator').click()
        cy.get('.organizations-select__menu').should('be.visible')
        cy.get('.organizations-select__option')
        .contains('Your personal organization').click()

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
          message: `{ "system": "down", "toxicity": "of the city" }`,
        })

        cy.contains('"system": "down"')
        cy.percySnapshot()
      })
    })

    describe('when get orgs 401s', function () {
      beforeEach(function () {
        cy.contains('.btn', 'Connect to Dashboard').click()
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

      cy.get('.btn').contains('Connect to Dashboard').click()
    })

    it('shows login', () => {
      cy.get('.modal').contains('Log In to Dashboard')
    })

    it('closes login modal', () => {
      cy.get('.modal').contains('Log In to Dashboard')
      cy.get('.close').click()
      cy.get('.btn').contains('Connect to Dashboard').click()
    })

    describe('when login succeeds', function () {
      beforeEach(function () {
        cy.stub(this.ipc, 'beginAuth').resolves(this.user)
        cy.contains('button', 'Log In to Dashboard').click()
      })

      it('shows setup', () => {
        cy.get('.login-content > .btn').click()
        cy.contains('h4', 'Set up project')
      })
    })
  })
})
