const onSubmitNewProject = function (orgId) {
  it('sends existing project name, org id, and visibility: private to ipc event by default', function () {
    cy.get('.setup-project')
    .contains('.btn', 'Set up project').click()
    .then(() => {
      expect(this.ipc.setupDashboardProject).to.be.calledWith({
        projectName: this.config.projectName,
        orgId,
        public: false,
      })
    })
  })

  it('sends modified project name, org id, and public flag to ipc event', function () {
    cy.get('#projectName').clear().type('New Project')

    cy.get('.privacy-selector').find('a').click()

    cy.get('.setup-project')
    .contains('.btn', 'Set up project').click()
    .then(() => {
      expect(this.ipc.setupDashboardProject).to.be.calledWith({
        projectName: 'New Project',
        orgId,
        public: true,
      })
    })
  })

  it('disables button and shows spinner', function () {
    cy.get('.setup-project')
    .contains('.btn', 'Set up project')
    .click()
    .should('be.disabled')
    .find('i')
    .should('be.visible')
  })

  context('errors', function () {
    beforeEach(function () {
      cy.get('.setup-project')
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

  context('after submit', function () {
    beforeEach(function () {
      this.setupDashboardProject.resolve({
        id: 'project-id-123',
        public: true,
        orgId,
      })

      cy.get('.setup-project')
      .contains('.btn', 'Set up project').click()
    })

    it('displays empty runs page', function () {
      cy.get('.setup-project').should('not.exist')
      cy.contains('To record your first')
      cy.contains('cypress run --record --key record-key-123')
    })

    it('updates localStorage projects cache', function () {
      const org = Cypress._.find(this.orgs, { id: orgId })

      expect(JSON.parse(localStorage.projects || '[]')[0].orgName).to.equal(org.name)
    })
  })
}

describe('Connect to Dashboard', function () {
  beforeEach(function () {
    cy.fixture('user').as('user')
    cy.fixture('projects').as('projects')
    cy.fixture('projects_statuses').as('projectStatuses')
    cy.fixture('config').as('config')
    cy.fixture('specs').as('specs')
    cy.fixture('organizations').as('orgs')
    cy.fixture('keys').as('keys')
    cy.fixture('dashboard_projects').as('dashboardProjects')

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
      cy.stub(this.ipc, 'setProjectId').resolvesArg(0)

      this.getCurrentUser = this.util.deferred()
      cy.stub(this.ipc, 'getCurrentUser').resolves(this.getCurrentUser.promise)

      this.getOrgs = this.util.deferred()
      cy.stub(this.ipc, 'getOrgs').returns(this.getOrgs.promise)

      this.getProjectStatus = this.util.deferred()
      cy.stub(this.ipc, 'getProjectStatus').returns(this.getProjectStatus.promise)

      this.getDashboardProjects = this.util.deferred()
      cy.stub(this.ipc, 'getDashboardProjects').returns(this.getDashboardProjects.promise)

      this.setupDashboardProject = this.util.deferred()
      cy.stub(this.ipc, 'setupDashboardProject').returns(this.setupDashboardProject.promise)

      start()

      cy.get('.navbar-default a')
      .contains('Runs').click()
    })
  })

  it('displays "need to set up" message', function () {
    cy.contains('Connect to the Dashboard to see your recorded test runs here')
  })

  describe('when there is a current user', function () {
    beforeEach(function () {
      this.getCurrentUser.resolve(this.user)
    })

    describe('general behavior', function () {
      beforeEach(function () {
        this.getOrgs.resolve(this.orgs)
        this.getDashboardProjects.resolve(this.dashboardProjects)

        cy.get('.btn').contains('Connect to Dashboard').click()
      })

      it('clicking link opens setup project window', function () {
        cy.get('.setup-project').should('be.visible')
        cy.percySnapshot()
      })

      it('closes when X is clicked', function () {
        cy.get('.close').click()
        cy.contains('Connect to the Dashboard to see your recorded test runs here')
      })

      it('org docs are linked', function () {
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

      it('calls getDashboardProjects', function () {
        expect(this.ipc.getDashboardProjects).to.be.calledOnce
      })

      it('displays loading view before both orgs and dashboard projects load', function () {
        cy.get('.loader').should('exist').then(function () {
          cy.percySnapshot()

          this.getOrgs.resolve(this.orgs)

          cy.get('.loader').should('exist').then(function () {
            this.getDashboardProjects.resolve(this.dashboardProjects)
          })
        })

        cy.get('.loader').should('not.exist')
      })

      it('logs user out when getOrgs 401s', function () {
        this.getOrgs.reject({ name: '', message: '', statusCode: 401 })

        cy.shouldBeLoggedOut()
      })

      it('logs user out when getDashboardProjects 401s', function () {
        this.getDashboardProjects.reject({ name: '', message: '', statusCode: 401 })

        cy.shouldBeLoggedOut()
      })

      it('displays "set up" message in background on log out', function () {
        this.getDashboardProjects.reject({ name: '', message: '', statusCode: 401 })

        cy.shouldBeLoggedOut()

        cy.contains('Connect to the Dashboard to see your recorded test runs here')
      })
    })

    describe('selecting an org', function () {
      context('with orgs', function () {
        beforeEach(function () {
          this.getOrgs.resolve(this.orgs)
          this.getDashboardProjects.resolve(this.dashboardProjects)
          cy.get('.btn').contains('Connect to Dashboard').click()

          cy.get('.setup-project')
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
        })

        it('opens external link on click of manage', () => {
          cy.get('.manage-orgs-btn').click().then(function () {
            expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/dashboard/organizations')
          })
        })
      })

      context('orgs with no default org', function () {
        beforeEach(function () {
          this.getOrgs.resolve(Cypress._.filter(this.orgs, { 'default': false }))
          this.getDashboardProjects.resolve(Cypress._.filter(this.dashboardProjects, { 'orgDefault': false }))
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
      })

      context('without orgs', function () {
        beforeEach(function () {
          this.getOrgs.resolve([])
          this.getDashboardProjects.resolve([])
          cy.get('.btn').contains('Connect to Dashboard').click()
        })

        it('displays empty message', () => {
          cy.get('.empty-select-orgs').should('be.visible')
          cy.get('.organizations-select').should('not.exist')
          cy.get('.project-select').should('not.exist')
          cy.get('#projectName').should('not.exist')
          cy.get('.privacy-selector').should('not.exist')
          cy.contains('.btn', 'Set up project').should('be.disabled')

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

          this.getDashboardProjects.resolve(Cypress._.filter(this.dashboardProjects, { 'orgDefault': true }))

          cy.get('.btn').contains('Connect to Dashboard').click()
          cy.get('.setup-project')
        })

        it('displays in dropdown', () => {
          cy.get('.organizations-select__dropdown-indicator').click()
          cy.get('.organizations-select__menu').should('be.visible')
          cy.get('.organizations-select__option').should('have.length', 1)
        })
      })

      context('polls for updates to organizations', function () {
        beforeEach(function () {
          cy.clock()
          this.getOrgs.resolve(this.orgs)
          this.getDashboardProjects.resolve(this.dashboardProjects)
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

    describe('selecting or creating a project', function () {
      beforeEach(function () {
        this.getDashboardProjects.resolve(this.dashboardProjects)

        cy.get('.btn').contains('Connect to Dashboard').click()
        cy.get('.setup-project')
      })

      context('default behavior', function () {
        it('displays new project when preselected org has no projects', function () {
          this.getOrgs.resolve(Cypress._.filter(this.orgs, { id: '999' }))

          cy.get('#projectName').should('exist')
          cy.get('.privacy-selector').should('exist')
          cy.get('.project-select').should('not.exist')
        })

        it('displays project select when preselected org has existing projects', function () {
          this.getOrgs.resolve(Cypress._.filter(this.orgs, { id: '777' }))

          cy.get('.project-select').should('exist')
          cy.get('#projectName').should('not.exist')
          cy.get('.privacy-selector').should('not.exist')
        })
      })

      context('with org with existing projects', function () {
        beforeEach(function () {
          this.getOrgs.resolve(this.orgs)

          cy.get('.organizations-select__dropdown-indicator').click()
          cy.get('.organizations-select__menu').should('be.visible')
          cy.get('.organizations-select__option')
          .contains('Acme Developers').click()
        })

        it('displays dropdown of existing projects with id for that org only', function () {
          const orgProjects = Cypress._.filter(this.dashboardProjects, { 'orgName': 'Acme Developers' })
          const otherProjects = Cypress._.reject(this.dashboardProjects, { 'orgName': 'Acme Developers' })

          cy.contains('Select a project')

          cy.percySnapshot()

          cy.get('.project-select__dropdown-indicator').click()
          cy.get('.project-select__menu').should('be.visible')

          cy.wrap(orgProjects).each(function (project) {
            cy.get('.project-select__option').contains(`${project.name} (${project.id})`)
          })

          cy.wrap(otherProjects).each(function (project) {
            cy.get('.project-select__option').contains(project.name).should('not.exist')
          })
        })

        it('sorts existing projects, displaying those without existing runs first', function () {
          cy.get('.project-select__dropdown-indicator').click()
          cy.get('.project-select__menu').should('be.visible')
          cy.get('.project-select__option').eq(0).contains(this.dashboardProjects[1].name)
          cy.get('.project-select__option').eq(1).contains(this.dashboardProjects[3].name)
          cy.get('.project-select__option').eq(2).contains(this.dashboardProjects[2].name)

          cy.percySnapshot()
        })

        it('does not display name input or visibility selector', function () {
          cy.get('#projectName').should('not.exist')
          cy.get('.privacy-selector').should('not.exist')
        })

        it('disables submit button until project is selected', function () {
          cy.get('.setup-project')
          .contains('.btn', 'Set up project')
          .should('be.disabled')

          cy.get('.project-select__dropdown-indicator').click()
          cy.get('.project-select__menu').should('be.visible')
          cy.get('.project-select__option')
          .contains(this.dashboardProjects[1].name).click()

          cy.get('.setup-project')
          .contains('.btn', 'Set up project')
          .should('not.be.disabled')
        })

        it('switches to new project when org is changed to one without existing projects', function () {
          cy.get('.organizations-select__dropdown-indicator').click()
          cy.get('.organizations-select__menu').should('be.visible')
          cy.get('.organizations-select__option')
          .contains('Osato Devs').click()

          cy.get('#projectName').should('exist')
          cy.get('.privacy-selector').should('exist')
          cy.get('.project-select').should('not.exist')
        })

        context('on submit', function () {
          beforeEach(function () {
            cy.get('.project-select__dropdown-indicator').click()
            cy.get('.project-select__menu').should('be.visible')
            cy.get('.project-select__option').contains(this.dashboardProjects[1].name).click()
          })

          it('calls ipc setProjectId event with selected id', function () {
            cy.get('.setup-project')
            .contains('.btn', 'Set up project').click()
            .then(() => {
              expect(this.ipc.setProjectId).to.be.calledWith(this.dashboardProjects[1].id)
            })
          })

          it('does not call ipc setupDashboardProject event', function () {
            cy.get('.setup-project')
            .contains('.btn', 'Set up project').click()
            .then(() => {
              expect(this.ipc.setupDashboardProject).not.to.be.called
            })
          })

          it('updates localStorage projects cache', function () {
            cy.get('.setup-project')
            .contains('.btn', 'Set up project').click()
            .then(() => {
              const localProjects = JSON.parse(localStorage.projects || '[]')

              expect(localProjects[0].id).to.equal(this.dashboardProjects[1].id)
              expect(localProjects[0].name).to.equal(this.dashboardProjects[1].name)
            })
          })
        })

        context('creating a new project', function () {
          beforeEach(function () {
            cy.contains('Acme Developers')
            cy.get('.setup-project').contains('Create new project').click()
          })

          it('displays name input and visibility selector with updated title', function () {
            cy.contains('What\'s the name of the project?')

            cy.get('#projectName').should('exist')
            cy.get('.privacy-selector').should('exist')

            cy.percySnapshot()
          })

          it('does not display existing project selector', function () {
            cy.contains('Select a project').should('not.exist')
            cy.get('.project-select').should('not.exist')
          })

          it('allows user to go back to existing projects', function () {
            cy.get('.setup-project').contains('Choose an existing project').click()

            cy.contains('Select a project')
            cy.get('.project-select__dropdown-indicator').should('exist')
          })

          context('on submit', function () {
            onSubmitNewProject('777')
          })
        })
      })

      context('with org without existing projects', function () {
        beforeEach(function () {
          this.getOrgs.resolve(this.orgs)

          cy.get('.organizations-select__dropdown-indicator').click()
          cy.get('.organizations-select__menu').should('be.visible')
          cy.get('.organizations-select__option')
          .contains('Osato Devs').click()
        })

        it('prefills Project Name', function () {
          cy.get('#projectName').should('have.value', this.config.projectName)

          cy.percySnapshot()
        })

        it('allows me to change Project Name value', function () {
          cy.get('#projectName').clear().type('New Project Here')
          .should('have.value', 'New Project Here')
        })

        it('submit button is enabled by default', function () {
          cy.get('.setup-project').contains('.btn', 'Set up project')
          .should('not.be.disabled')
        })

        it('submit button is disabled when input is empty', function () {
          cy.get('#projectName').clear()

          cy.get('.setup-project').contains('.btn', 'Set up project')
          .should('be.disabled')
        })

        it('does not display link to choose existing project', function () {
          cy.get('.setup-project').contains('Create new project').should('not.exist')
        })

        it('switches to project dropdown when org is changed to one with existing projects', function () {
          cy.get('.organizations-select__dropdown-indicator').click()
          cy.get('.organizations-select__menu').should('be.visible')
          cy.get('.organizations-select__option')
          .contains('Acme Developers').click()

          cy.get('#projectName').should('not.exist')
          cy.get('.project-select').should('exist')
        })

        context('visibility', function () {
          it('is private by default', function () {
            cy.contains('Project visibility is set to Private.')
          })

          it('can be toggled on click', function () {
            cy.contains('Project visibility is set to Private.')
            cy.get('.privacy-selector').find('a').click()
            cy.contains('Project visibility is set to Public.')
            cy.get('.privacy-selector').find('a').click()
            cy.contains('Project visibility is set to Private.')
          })

          it('displays tooltip when set to private', function () {
            cy.get('.privacy-selector').children('span').trigger('mouseover')
            cy.get('.cy-tooltip').should('contain', 'Only invited users have access')
          })

          it('displays tooltip when set to public', function () {
            cy.get('.privacy-selector').find('a').click()
            cy.get('.privacy-selector').children('span').trigger('mouseover')
            cy.get('.cy-tooltip').should('contain', 'Anyone has access')
          })
        })

        context('on submit', function () {
          onSubmitNewProject('999')
        })
      })
    })

    describe('polls for updates to projects', function () {
      beforeEach(function () {
        cy.clock()
        this.getOrgs.resolve(this.orgs)
        this.getDashboardProjects.resolve(this.dashboardProjects)
        cy.get('.btn').contains('Connect to Dashboard').click()
      })

      it('polls for dashboard projects twice in 10+sec', function () {
        cy.tick(11000).then(() => {
          expect(this.ipc.getDashboardProjects).to.be.calledTwice
        })
      })

      it('updates project name on list on successful poll', function () {
        const name = 'My Project Name'

        this.dashboardProjects[1].name = name
        this.ipc.getDashboardProjects.onCall(2).resolves(this.dashboardProjects)

        cy.get('.organizations-select__dropdown-indicator').click()
        cy.get('.organizations-select__menu').should('be.visible')
        cy.get('.organizations-select__option')
        .contains('Acme Developers').click()

        cy.tick(11000)

        cy.get('.project-select__dropdown-indicator').click()
        cy.get('.project-select__menu').should('be.visible')
        cy.get('.project-select__option')
        .contains(name)
      })

      it('adds new project to list on successful poll', function () {
        this.dashboardProjects.push({
          ...this.dashboardProjects[0],
          'orgId': '777',
          'orgName': 'Acme Developers',
          'orgDefault': false,
        })

        this.ipc.getDashboardProjects.onCall(2).resolves(this.dashboardProjects)

        cy.get('.organizations-select__dropdown-indicator').click()
        cy.get('.organizations-select__menu').should('be.visible')
        cy.get('.organizations-select__option')
        .contains('Acme Developers').click()

        cy.tick(11000)

        cy.get('.project-select__dropdown-indicator').click()
        cy.get('.project-select__menu').should('be.visible')
        cy.get('.project-select__option')
        .contains(this.dashboardProjects[0].name)
      })

      it('stays on new project when additional project is added to org', function () {
        this.dashboardProjects.push({
          ...this.dashboardProjects[0],
          'orgId': '777',
          'orgName': 'Acme Developers',
          'orgDefault': false,
        })

        this.ipc.getDashboardProjects.onCall(2).resolves(this.dashboardProjects)

        cy.get('.organizations-select__dropdown-indicator').click()
        cy.get('.organizations-select__menu').should('be.visible')
        cy.get('.organizations-select__option')
        .contains('Acme Developers').click()

        cy.contains('Create new project').click()

        cy.get('#projectName').should('exist').clear().type('Project Name')

        cy.tick(11000)

        cy.get('#projectName').should('have.value', 'Project Name')
        cy.contains('Choose an existing project')
      })

      it('stays on new project when first project is added to org', function () {
        this.dashboardProjects.push({
          ...this.dashboardProjects[0],
          'orgId': '999',
          'orgName': 'Osato Devs',
          'orgDefault': false,
        })

        this.ipc.getDashboardProjects.onCall(2).resolves(this.dashboardProjects)

        cy.get('.organizations-select__dropdown-indicator').click()
        cy.get('.organizations-select__menu').should('be.visible')
        cy.get('.organizations-select__option')
        .contains('Osato Devs').click()

        cy.get('#projectName').should('exist').clear().type('Project Name')
        cy.contains('Choose an existing project').should('not.exist')

        cy.tick(11000)

        cy.get('#projectName').should('have.value', 'Project Name')
        cy.contains('Choose an existing project')
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
