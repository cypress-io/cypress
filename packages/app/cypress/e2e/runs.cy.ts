import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import type { SinonStub } from 'sinon'

function moveToRunsPage (): void {
  cy.findByTestId('sidebar-link-runs-page').click()
  cy.findByTestId('app-header-bar').findByText('Runs').should('be.visible')
  cy.findByTestId('runs-container').should('be.visible')
}

function scaffoldTestingTypeAndVisitRunsPage (testingType: 'e2e' | 'component'): void {
  cy.scaffoldProject('cypress-in-cypress')
  cy.openProject('cypress-in-cypress')
  cy.startAppServer(testingType)

  cy.loginUser()

  // make sure there are no runs found for the project ID
  cy.remoteGraphQLIntercept(async (obj) => {
    if (obj.result.data?.cloudProjectBySlug?.runs?.nodes) {
      obj.result.data.cloudProjectBySlug.runs.nodes = []
    }

    return obj.result
  })

  cy.visitApp()

  moveToRunsPage()
}

describe('App: Runs', { viewportWidth: 1200 }, () => {
  context('Runs Page', () => {
    beforeEach(() => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests')
      cy.startAppServer('component')
    })

    it('resolves the runs page', () => {
      cy.loginUser()
      cy.visitApp()
      cy.get('[href="#/runs"]', { timeout: 1000 }).click()
      cy.get('[data-cy="runs"]')
      cy.get('[data-cy="app-header-bar"]').findByText('Runs').should('be.visible')
    })

    it('shows the loader', () => {
      cy.loginUser()
      cy.remoteGraphQLIntercept(async (obj) => {
        await new Promise((resolve) => setTimeout(resolve, 200))

        return obj.result
      })

      cy.visitApp()
      cy.findByTestId('sidebar-link-runs-page').click()
      cy.get('[data-cy="runs-loader"]')
      cy.get('[data-cy="runs"]')
    })
  })

  context('Runs - Login', () => {
    beforeEach(() => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests')
      cy.startAppServer('component')
    })

    it('when logged out, shows call to action', () => {
      cy.visitApp()
      moveToRunsPage()
      cy.contains(defaultMessages.runs.connect.buttonUser).should('exist')
    })

    it('clicking the login button will open the login modal', () => {
      cy.visitApp()
      moveToRunsPage()
      cy.contains('Log In').click()
      cy.findByRole('dialog', { name: 'Log in to Cypress' }).within(() => {
        cy.get('button').contains('Log In')
      })
    })

    it('if logged in and connected', { viewportWidth: 1200 }, () => {
      cy.loginUser()
      cy.visitApp()

      moveToRunsPage()
      cy.contains('a', 'OVERLIMIT').click()

      cy.withCtx((ctx) => {
        expect((ctx.actions.electron.openExternal as SinonStub).lastCall.lastArg).to.eq('http://dummy.cypress.io/runs/4')
      })
    })
  })

  context('Runs - Connect Org', () => {
    it('opens create Org modal after clicking Connect Project button', () => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests', ['--config-file', 'cypressWithoutProjectId.config.js'])
      cy.startAppServer('component')

      cy.remoteGraphQLIntercept(async (obj) => {
        if (obj.result.data?.cloudViewer?.organizations?.nodes) {
          obj.result.data.cloudViewer.organizations.nodes = []
        }

        return obj.result
      })

      cy.loginUser()
      cy.visitApp()

      moveToRunsPage()

      cy.findByText(defaultMessages.runs.connect.buttonProject).click()
      cy.get('[aria-modal="true"]').should('exist')

      cy.validateExternalLink({
        name: defaultMessages.runs.connect.modal.createOrg.button,
        href: 'http://dummy.cypress.io/organizations/create',
      })

      // validateExternalLink includes clicking on the createOrg button, which triggers the waiting state
      cy.contains('button', defaultMessages.runs.connect.modal.createOrg.waitingButton).should('be.visible')

      cy.validateExternalLink({
        name: defaultMessages.links.needHelp,
        href: 'https://on.cypress.io/adding-new-project',
      })

      cy.get('button').get('[aria-label="Close"').click()
      cy.get('[aria-modal="true"]').should('not.exist')
    })

    it('opens create Org modal after clicking Connect Project button and refetch data from the cloud', () => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests', ['--config-file', 'cypressWithoutProjectId.config.js'])
      cy.startAppServer('component')

      cy.remoteGraphQLIntercept(async (obj) => {
        if ((obj.operationName === 'CheckCloudOrganizations_cloudViewerChange_cloudViewer' || obj.operationName === 'Runs_cloudViewer' || obj.operationName === 'SpecsPageContainer_cloudViewer')) {
          if (obj.result.data?.cloudViewer?.organizations?.nodes) {
            obj.result.data.cloudViewer.organizations.nodes = []
          }
        }

        return obj.result
      })

      cy.loginUser()
      cy.visitApp()

      moveToRunsPage()

      cy.findByText(defaultMessages.runs.connect.buttonProject).click()
      cy.get('[aria-modal="true"]').should('exist')

      cy.contains('button', defaultMessages.runs.connect.modal.createOrg.refreshButton).click()

      cy.findByText(defaultMessages.runs.connect.modal.selectProject.manageOrgs)
    })
  })

  context('Runs - Connect Project', () => {
    it('opens Connect Project modal after clicking Connect Project button', () => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests', ['--config-file', 'cypressWithoutProjectId.config.js'])
      cy.startAppServer('component')
      cy.remoteGraphQLIntercept(async (obj) => {
        if (obj.result.data?.cloudViewer?.organizations?.nodes) {
          const nodes = obj.result.data.cloudViewer.organizations.nodes

          nodes.push({ ...nodes[0], name: 'aaa', id: 'aaa-id' })
        }

        return obj.result
      })

      cy.loginUser()
      cy.visitApp()

      moveToRunsPage()

      cy.findByText(defaultMessages.runs.connect.buttonProject).click()
      cy.get('[aria-modal="true"]').should('exist')

      cy.validateExternalLink({
        name: defaultMessages.runs.connect.modal.selectProject.manageOrgs,
        href: 'http://dummy.cypress.io/organizations',
      })

      cy.contains('button', 'Cypress Test Account 1').click()
      cy.findByText('aaa').should('exist')

      cy.get('button').get('[aria-label="Close"').click()
      cy.get('[aria-modal="true"]').should('not.exist')
    })
  })

  context('Runs - Create Project', () => {
    it('when a project is created, injects new projectId into the config file', () => {
      cy.remoteGraphQLIntercept(async (obj) => {
        if (obj.operationName === 'SelectCloudProjectModal_CreateCloudProject_cloudProjectCreate') {
          obj.result.data!.cloudProjectCreate = {
            slug: 'newProjectId',
            id: 'newId',
          }
        }

        return obj.result
      })

      cy.scaffoldProject('launchpad')
      cy.openProject('launchpad')
      cy.startAppServer('e2e')
      cy.loginUser()
      cy.visitApp()

      cy.withCtx(async (ctx) => {
        const config = await ctx.project.getConfig()

        expect(config.projectId).to.not.equal('newProjectId')
      })

      moveToRunsPage()
      cy.findByText(defaultMessages.runs.connect.buttonProject).click()
      cy.get('button').contains(defaultMessages.runs.connect.modal.selectProject.createProject).click()
      cy.findByText(defaultMessages.runs.connectSuccessAlert.title).should('be.visible')

      cy.withCtx(async (ctx) => {
        const config = await ctx.project.getConfig()

        expect(config.projectId).to.equal('newProjectId')
      })
    })

    it('displays correct error message if the cloud mutation returns UNAUTHORIZED', () => {
      cy.remoteGraphQLIntercept(async (obj) => {
        if (obj.operationName === 'SelectCloudProjectModal_CreateCloudProject_cloudProjectCreate') {
          throw new Error('Unauthorized: You are not member of the organization.')
        }

        return obj.result
      })

      cy.scaffoldProject('launchpad')
      cy.openProject('launchpad')
      cy.startAppServer('e2e')
      cy.loginUser()
      cy.visitApp()

      cy.withCtx(async (ctx) => {
        const config = await ctx.project.getConfig()

        expect(config.projectId).to.not.equal('newProjectId')
      })

      cy.get('[href="#/runs"]').click()
      cy.findByText(defaultMessages.runs.connect.buttonProject).click()
      cy.get('button').contains(defaultMessages.runs.connect.modal.selectProject.createProject).click()

      cy.get('[data-cy="alert"]').within(() => {
        cy.contains(defaultMessages.runs.connect.errors.baseError.title)
        cy.get('[data-cy="alert-suffix-icon"]').should('not.exist')
      })

      cy.get('[data-cy="alert-body"]').within(() => {
        cy.contains('Unauthorized: You are not member of the organization.')
      })
    })

    it('displays correct error message if the cloud mutation returns INTERNAL_SERVER_ERROR', () => {
      cy.remoteGraphQLIntercept(async (obj) => {
        if (obj.operationName === 'SelectCloudProjectModal_CreateCloudProject_cloudProjectCreate') {
          throw new Error('Unreachable')
        }

        return obj.result
      })

      cy.scaffoldProject('launchpad')
      cy.openProject('launchpad')
      cy.startAppServer('e2e')
      cy.loginUser()
      cy.visitApp()

      cy.withCtx(async (ctx) => {
        const config = await ctx.project.getConfig()

        expect(config.projectId).to.not.equal('newProjectId')
      })

      cy.get('[href="#/runs"]').click()
      cy.findByText(defaultMessages.runs.connect.buttonProject).click()
      cy.get('button').contains(defaultMessages.runs.connect.modal.selectProject.createProject).click()

      cy.get('[data-cy="alert"]').within(() => {
        cy.contains(defaultMessages.runs.connect.errors.internalServerError.title)
        cy.get('[data-cy="alert-suffix-icon"]').should('exist')
      })

      cy.get('[data-cy="alert-body"]').within(() => {
        cy.contains(defaultMessages.runs.connect.errors.internalServerError.description.replace('{0}', 'Support Page'))
      })
    })
  })

  context('Runs - Cannot Find Project', () => {
    beforeEach(() => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests', ['--config-file', 'cypressWithInvalidProjectId.config.js'])
      cy.startAppServer('component')

      cy.loginUser()
      cy.remoteGraphQLIntercept(async (obj) => {
        // Currently, all remote requests go through here, we want to use this to modify the
        // remote request before it's used and avoid touching the login query
        if (obj.result.data?.cloudProjectBySlug && obj.variables._v0_slug === 'abcdef42') {
          const proj = obj.result.data.cloudProjectBySlug

          proj.__typename = 'CloudProjectNotFound'
          proj.message = 'Cloud Project Not Found'
        }

        if (obj.result.data?.cloudViewer?.organizations?.nodes) {
          const projectNodes = obj.result.data?.cloudViewer.organizations.nodes[0].projects.nodes

          projectNodes.push({
            __typename: 'CloudProject',
            id: '1',
            slug: 'ghijkl',
            name: 'Mock Project',
          })
        }

        return obj.result
      })

      cy.visitApp()

      moveToRunsPage()
    })

    it('if project Id is specified in config file that does not exist, shows call to action', () => {
      cy.findByText(defaultMessages.runs.errors.notFound.button).should('be.visible')
    })

    it('opens Connect Project modal after clicking Reconnect Project button', () => {
      cy.findByText(defaultMessages.runs.errors.notFound.button).should('be.visible').click()
      cy.get('[aria-modal="true"]').should('exist')
      cy.get('[data-cy="selectProject"] button').click()
      cy.findByText('Mock Project').click()
      cy.findByText(defaultMessages.runs.connect.modal.selectProject.connectProject).click()
      cy.get('[data-cy="runs"]', { timeout: 7500 })
    })
  })

  context('Runs - Unauthorized Project', () => {
    beforeEach(() => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests')
      cy.startAppServer('component')

      cy.loginUser()
    })

    it('if project Id is specified in config file that is not accessible, shows call to action', () => {
      cy.remoteGraphQLIntercept(async (obj) => {
        if (obj.result.data?.cloudProjectBySlug) {
          const proj = obj.result.data.cloudProjectBySlug

          proj.__typename = 'CloudProjectUnauthorized'
          proj.message = 'Cloud Project Unauthorized'
          proj.hasRequestedAccess = false
        }

        return obj.result
      })

      cy.visitApp('/runs')
      cy.findByText(defaultMessages.runs.errors.unauthorized.button).should('be.visible')
    })

    it('clicking on the call to action should call the mutation', () => {
      cy.remoteGraphQLIntercept(async (obj, testState) => {
        if (obj.operationName === 'RunsErrorRenderer_RequestAccess_cloudProjectRequestAccess') {
          obj.result.data!.cloudProjectRequestAccess = {
            __typename: 'CloudProject',
            message: 'Cloud Project',
            hasRequestedAccess: true,
          }

          testState.cloudProjectRequestAccessWasCalled = true

          return obj.result
        }

        if (obj.result.data?.cloudProjectBySlug) {
          const proj = obj.result.data.cloudProjectBySlug

          proj.__typename = 'CloudProjectUnauthorized'
          proj.message = 'Cloud Project Unauthorized'
          proj.hasRequestedAccess = false
        }

        return obj.result
      })

      cy.visitApp('/runs')

      cy.findByText(defaultMessages.runs.errors.unauthorized.button).click()

      cy.withCtx((ctx, o) => {
        expect(o.testState.cloudProjectRequestAccessWasCalled).to.eql(true)
      })
    })

    it('updates the button text when the request access button is clicked', () => {
      cy.remoteGraphQLIntercept(async (obj, testState) => {
        if (obj.operationName === 'Runs_currentProject_cloudProject_cloudProjectBySlug') {
          const proj = obj!.result!.data!.cloudProjectBySlug

          proj.__typename = 'CloudProjectUnauthorized'
          proj.message = 'Cloud Project Unauthorized'
          proj.hasRequestedAccess = false
          testState.project = proj
        } else if (obj.operationName === 'RunsErrorRenderer_RequestAccess_cloudProjectRequestAccess') {
          obj!.result!.data!.cloudProjectRequestAccess = {
            ...testState.project,
            hasRequestedAccess: true,
          }
        }

        return obj.result
      })

      cy.visitApp('/runs')
      cy.findByText(defaultMessages.runs.errors.unauthorized.button).click()
      cy.findByText(defaultMessages.runs.errors.unauthorizedRequested.button).should('exist')
    })
  })

  context('Runs - Pending authorization to project', () => {
    beforeEach(() => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests')
      cy.startAppServer('component')

      cy.loginUser()
      cy.remoteGraphQLIntercept(async (obj) => {
        // Currently, all remote requests go through here, we want to use this to modify the
        // remote request before it's used and avoid touching the login query

        if (obj.result.data?.cloudProjectBySlug) {
          const proj = obj.result.data.cloudProjectBySlug

          proj.__typename = 'CloudProjectUnauthorized'
          proj.message = 'Cloud Project Unauthorized'
          proj.hasRequestedAccess = true
        }

        return obj.result
      })

      cy.visitApp()

      moveToRunsPage()
    })

    it('if project Id is specified in config file that is not accessible, shows call to action', () => {
      cy.findByText(defaultMessages.runs.errors.unauthorizedRequested.button).should('be.visible')
    })
  })

  context('Runs - No Runs', () => {
    it('when no runs and not connected, shows connect to dashboard button', () => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests', ['--config-file', 'cypressWithoutProjectId.config.js'])
      cy.startAppServer('component')

      cy.loginUser()
      cy.remoteGraphQLIntercept(async (obj) => {
        // Currently, all remote requests go through here, we want to use this to modify the
        // remote request before it's used and avoid touching the login query
        if (obj.result.data?.cloudProjectBySlug?.runs?.nodes) {
          obj.result.data.cloudProjectBySlug.runs.nodes = []
        }

        return obj.result
      })

      cy.visitApp()
      moveToRunsPage()
      cy.findByText(defaultMessages.runs.connect.buttonProject).should('exist')
    })

    it('displays how to record prompt when connected and no runs in Component Testing', () => {
      scaffoldTestingTypeAndVisitRunsPage('component')
      cy.contains(defaultMessages.runs.empty.title).should('be.visible')
      cy.contains(defaultMessages.runs.empty.description).should('be.visible')
      cy.contains('cypress run --component --record --key 2aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa').should('be.visible')
    })

    it('displays how to record prompt when connected and no runs in E2E', () => {
      scaffoldTestingTypeAndVisitRunsPage('e2e')

      cy.contains(defaultMessages.runs.empty.title).should('be.visible')
      cy.contains(defaultMessages.runs.empty.description).should('be.visible')
      cy.contains('cypress run --record --key 2aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa').should('be.visible')
    })

    it('displays a copy button and copies correct command in Component Testing', () => {
      scaffoldTestingTypeAndVisitRunsPage('component')
      cy.withCtx(async (ctx, o) => {
        o.sinon.stub(ctx.electronApi, 'copyTextToClipboard')
      })

      cy.get('[data-cy="copy-button"]').click()
      cy.contains('Copied!')
      cy.withRetryableCtx((ctx) => {
        expect(ctx.electronApi.copyTextToClipboard as SinonStub).to.have.been.calledWith('cypress run --component --record --key 2aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
      })
    })

    it('displays a copy button and copies correct command in E2E', () => {
      scaffoldTestingTypeAndVisitRunsPage('e2e')
      cy.withCtx(async (ctx, o) => {
        o.sinon.stub(ctx.electronApi, 'copyTextToClipboard')
      })

      cy.get('[data-cy="copy-button"]').click()
      cy.contains('Copied!')
      cy.withRetryableCtx((ctx) => {
        expect(ctx.electronApi.copyTextToClipboard as SinonStub).to.have.been.calledWith('cypress run --record --key 2aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
      })
    })
  })

  context('Runs - Runs List', () => {
    beforeEach(() => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests')
      cy.startAppServer('component')
    })

    it('displays a list of recorded runs if a run has been recorded', () => {
      cy.loginUser()
      cy.visitApp()
      moveToRunsPage()
      cy.get('[data-cy="runs"]')
    })

    it('displays each run with correct information', () => {
      cy.loginUser()
      cy.visitApp()
      moveToRunsPage()

      cy.get('[href="http://dummy.cypress.io/runs/0"]').first().within(() => {
        cy.findByText('fix: make gql work CANCELLED')
        cy.get('[data-cy="run-card-icon-CANCELLED"]')
      })

      cy.get('[href="http://dummy.cypress.io/runs/1"]').first().within(() => {
        cy.findByText('fix: make gql work ERRORED')
        cy.get('[data-cy="run-card-icon-ERRORED"]')
      })

      cy.get('[href="http://dummy.cypress.io/runs/2"]').first().within(() => {
        cy.findByText('fix: make gql work FAILED')
        cy.get('[data-cy="run-card-icon-FAILED"]')
      })

      cy.get('[href="http://dummy.cypress.io/runs/0"]').first().as('firstRun')

      cy.get('@firstRun').within(() => {
        cy.get('[data-cy="run-card-author"]').contains('John Appleseed')
        cy.get('[data-cy="run-card-avatar"]')
        cy.get('[data-cy="run-card-branch"]').contains('main')
        cy.get('[data-cy="run-card-created-at"]').contains('an hour ago')
        cy.get('[data-cy="run-card-duration"]').contains('01:00')

        cy.contains('span', 'skipped')
        cy.get('span').contains('pending')
        cy.get('span').contains('passed')
        cy.get('span').contains('failed')
      })
    })

    it('opens the run page if a run is clicked', () => {
      cy.loginUser()
      cy.visitApp()

      moveToRunsPage()
      cy.get('[data-cy^="runCard-"]').first().click()

      cy.withCtx((ctx) => {
        expect((ctx.actions.electron.openExternal as SinonStub).lastCall.lastArg).to.eq('http://dummy.cypress.io/runs/0')
      })
    })

    it('shows connection failed error if no cloudProject', () => {
      let cloudData: any

      cy.loginUser()
      cy.remoteGraphQLIntercept((obj) => {
        if (obj.operationName === 'Runs_currentProject_cloudProject_cloudProjectBySlug') {
          cloudData = obj.result
          obj.result = {}

          return obj.result
        }

        return obj.result
      })

      cy.visitApp()

      moveToRunsPage()

      cy.contains('h2', 'Cannot connect to the Cypress Dashboard')
      cy.percySnapshot()

      cy.remoteGraphQLIntercept((obj) => {
        if (obj.operationName === 'Runs_currentProject_cloudProject_cloudProjectBySlug') {
          return cloudData
        }

        return obj.result
      })

      cy.contains('button', 'Try again').click().should('not.exist')
    })
  })

  describe('no internet connection', () => {
    beforeEach(() => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests')
      cy.startAppServer('component')
    })

    afterEach(() => {
      cy.goOnline()
    })

    it('shows alert warning if runs have been returned already', () => {
      cy.loginUser()
      cy.visitApp()
      cy.wait(1000)
      moveToRunsPage()
      cy.get('[data-cy="runs"]')

      cy.goOffline()

      cy.get('[data-cy=warning-alert]')
      .should('contain.text', 'You have no internet connection')
      .and('contain.text', 'Check your internet connection to pull the latest data from the dashboard')
    })

    it('should remove the alert warning if the app reconnects to the internet', () => {
      cy.loginUser()
      cy.visitApp()
      cy.wait(1000)
      moveToRunsPage()
      cy.get('[data-cy="runs"]')

      cy.goOffline()

      cy.get('[data-cy=warning-alert]')
      .should('contain.text', 'You have no internet connection')
      .and('contain.text', 'Check your internet connection to pull the latest data from the dashboard')

      cy.goOnline()

      cy.get('[data-cy=warning-alert]').should('not.exist')
    })

    it('shows correct message on create org modal', () => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests', ['--config-file', 'cypressWithoutProjectId.config.js'])
      cy.startAppServer('component')

      cy.remoteGraphQLIntercept(async (obj) => {
        if (obj.result.data?.cloudViewer?.organizations?.nodes) {
          obj.result.data.cloudViewer.organizations.nodes = []
        }

        return obj.result
      })

      cy.loginUser()
      cy.visitApp()

      cy.get('[href="#/runs"]').click()

      cy.findByText(defaultMessages.runs.connect.buttonProject).click()
      cy.get('[aria-modal="true"]').should('exist')

      cy.validateExternalLink({
        name: defaultMessages.runs.connect.modal.createOrg.button,
        href: 'http://dummy.cypress.io/organizations/create',
      })

      cy.goOffline()

      cy.get('[data-cy=standard-modal]')
      .should('contain.text', 'You have no internet connection')
      .and('contain.text', 'Check your internet connection to pull the latest data from the dashboard')
    })

    it('shows correct message on connect project modal', () => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests', ['--config-file', 'cypressWithoutProjectId.config.js'])
      cy.startAppServer('component')

      cy.loginUser()
      cy.visitApp()

      cy.remoteGraphQLIntercept(async (obj) => {
        if (obj.result.data?.cloudViewer?.organizations?.nodes) {
          const nodes = obj.result.data.cloudViewer.organizations.nodes

          nodes.push({ ...nodes[0], name: 'aaa', id: 'aaa-id' })
        }

        return obj.result
      })

      cy.get('[href="#/runs"]').click()
      cy.findByText(defaultMessages.runs.connect.buttonProject).click()
      cy.get('[aria-modal="true"]').should('exist')

      cy.validateExternalLink({
        name: defaultMessages.runs.connect.modal.selectProject.manageOrgs,
        href: 'http://dummy.cypress.io/organizations',
      })

      cy.goOffline()

      cy.get('[data-cy=standard-modal]')
      .should('contain.text', 'You have no internet connection')
      .and('contain.text', 'Check your internet connection to pull the latest data from the dashboard')
    })
  })

  describe('refetching', () => {
    let obj: {toCall?: Function} = {}
    const RUNNING_COUNT = 3

    beforeEach(() => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests')
      cy.startAppServer('component')
      cy.loginUser()
      cy.remoteGraphQLIntercept((obj, testState) => {
        if (obj.result.data?.cloudProjectBySlug?.runs?.nodes.length) {
          obj.result.data.cloudProjectBySlug.runs.nodes.map((run) => {
            run.status = 'RUNNING'
          })

          obj.result.data.cloudProjectBySlug.runs.nodes = obj.result.data.cloudProjectBySlug.runs.nodes.slice(0, 3)
        }

        return obj.result
      })

      cy.visitApp('/runs', {
        onBeforeLoad (win) {
          const setTimeout = win.setTimeout

          // @ts-expect-error
          win.setTimeout = function (fn, time) {
            if (fn.name === 'fetchNewerRuns') {
              obj.toCall = fn
            } else {
              setTimeout(fn, time)
            }
          }
        },
      })
    })

    it('should re-query for executing runs', () => {
      cy.get('[data-cy="run-card-icon-RUNNING"]').should('have.length', RUNNING_COUNT).should('be.visible')

      cy.remoteGraphQLIntercept(async (obj) => {
        await new Promise((resolve) => setTimeout(resolve, 100))

        if (obj.result.data?.cloudNode?.newerRuns?.nodes) {
          obj.result.data.cloudNode.newerRuns.nodes = []
        }

        if (obj.result.data?.cloudNodesByIds) {
          obj.result.data?.cloudNodesByIds.map((node) => {
            node.status = 'RUNNING'
          })

          obj.result.data.cloudNodesByIds[0].status = 'PASSED'
        }

        return obj.result
      })

      function completeNext (passed) {
        cy.wrap(obj).invoke('toCall').then(() => {
          cy.get('[data-cy="run-card-icon-PASSED"]').should('have.length', passed).should('be.visible')
          if (passed < RUNNING_COUNT) {
            completeNext(passed + 1)
          }
        })
      }

      completeNext(1)
    })

    it('should fetch newer runs and maintain them when navigating', () => {
      cy.get('[data-cy="run-card-icon-RUNNING"]').should('have.length', RUNNING_COUNT).should('be.visible')

      cy.remoteGraphQLIntercept(async (obj) => {
        await new Promise((resolve) => setTimeout(resolve, 100))

        if (obj.result.data?.cloudNodesByIds) {
          obj.result.data?.cloudNodesByIds.map((node) => {
            node.status = 'PASSED'
            node.totalPassed = 100
          })
        }

        return obj.result
      })

      cy.get('[data-cy="run-card-icon-RUNNING"]').should('have.length', 3).should('be.visible')
      cy.wrap(obj).invoke('toCall')

      cy.get('[data-cy="run-card-icon-PASSED"]').should('have.length', 3).should('be.visible').within(() => {
        cy.get('[data-cy="runResults-passed-count"]').should('contain', 100)
      })

      cy.get('[data-cy="run-card-icon-RUNNING"]').should('have.length', 2).should('be.visible')

      // If we navigate away & back, we should see the same runs
      cy.findByTestId('sidebar-link-settings-page').click()
      cy.remoteGraphQLIntercept((obj) => obj.result)

      moveToRunsPage()

      cy.get('[data-cy="run-card-icon-PASSED"]').should('have.length', 3).should('be.visible')
      cy.get('[data-cy="run-card-icon-RUNNING"]').should('have.length', 2).should('be.visible')
    })
  })
})
