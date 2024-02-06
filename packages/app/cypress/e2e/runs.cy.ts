import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

import type { SinonStub } from 'sinon'

function moveToRunsPage (): void {
  cy.findByTestId('sidebar-link-runs-page').click()
  cy.findByTestId('app-header-bar').findByText('Runs').should('be.visible')
  cy.findByTestId('runs-container').should('be.visible')
}

function scaffoldTestingTypeAndVisitRunsPage (testingType: 'e2e' | 'component'): void {
  cy.scaffoldProject('cypress-in-cypress')
  if (testingType === 'component') {
    cy.openProject('cypress-in-cypress', ['--component'])
  } else {
    cy.openProject('cypress-in-cypress')
  }

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
  cy.specsPageIsVisible()

  moveToRunsPage()
}

describe('App: Runs', { viewportWidth: 1200 }, () => {
  context('Runs Page', () => {
    beforeEach(() => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests', ['--component'])
      cy.startAppServer('component')
    })

    it('resolves the runs page', () => {
      cy.loginUser()
      cy.visitApp()
      cy.specsPageIsVisible()
      moveToRunsPage()
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
      cy.specsPageIsVisible()
      cy.findByTestId('sidebar-link-runs-page').click()
      cy.get('[data-cy*="runsSkeleton-"]')
      cy.get('[data-cy="runs"]')
    })
  })

  context('Runs - Login', () => {
    beforeEach(() => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests', ['--component'])
      cy.startAppServer('component')
    })

    it('when logged out, shows call to action', () => {
      cy.visitApp()
      cy.specsPageIsVisible()
      moveToRunsPage()
      cy.contains(defaultMessages.runs.connect.buttonUser).should('exist')
    })

    it('clicking the login button will open the login modal', () => {
      cy.visitApp()
      cy.specsPageIsVisible()
      moveToRunsPage()
      cy.contains(defaultMessages.runs.connect.buttonUser).click()
      cy.withCtx((ctx, o) => {
        o.sinon.stub(ctx._apis.authApi, 'logIn')
      })

      cy.findByRole('dialog', { name: 'Log in to Cypress' }).within(() => {
        cy.contains('button', 'Log in').click()
      })

      cy.withCtx((ctx, o) => {
        // validate utmSource
        expect((ctx._apis.authApi.logIn as SinonStub).lastCall.args[1]).to.eq('Binary: App')
        // validate utmMedium
        expect((ctx._apis.authApi.logIn as SinonStub).lastCall.args[2]).to.eq('Runs Tab')
      })
    })

    it('if logged in and connected', { viewportWidth: 1200 }, () => {
      cy.loginUser()
      cy.visitApp()
      cy.specsPageIsVisible()

      moveToRunsPage()
      cy.findByTestId('runNumber-status-OVERLIMIT').click()

      cy.withCtx((ctx, o) => {
        expect((ctx.actions.electron.openExternal as SinonStub).lastCall.lastArg).to.contain('http://dummy.cypress.io/runs/4')
      })
    })
  })

  context('Runs - Connect Org', () => {
    it('opens create Org modal after clicking Connect Project button', () => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests', ['--config-file', 'cypressWithoutProjectId.config.js', '--component'])
      cy.startAppServer('component')

      cy.remoteGraphQLIntercept(async (obj) => {
        if (obj.result.data?.cloudViewer?.organizations?.nodes) {
          obj.result.data.cloudViewer.organizations.nodes = []
        }

        if (obj.result.data?.cloudViewer?.firstOrganization?.nodes) {
          obj.result.data.cloudViewer.firstOrganization.nodes = []
        }

        return obj.result
      })

      cy.loginUser()
      cy.visitApp()
      cy.specsPageIsVisible()

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
      cy.openProject('component-tests', ['--config-file', 'cypressWithoutProjectId.config.js', '--component'])
      cy.startAppServer('component')

      cy.remoteGraphQLIntercept(async (obj) => {
        if ((obj.operationName !== 'CreateCloudOrgModal_CloudOrganizationsCheck_refreshOrganizations_cloudViewer')) {
          if (obj.result.data?.cloudViewer?.organizations?.nodes) {
            obj.result.data.cloudViewer.organizations.nodes = []
          }

          if (obj.result.data?.cloudViewer?.firstOrganization?.nodes) {
            obj.result.data.cloudViewer.firstOrganization.nodes = []
          }
        }

        return obj.result
      })

      cy.loginUser()
      cy.visitApp()
      cy.specsPageIsVisible()

      moveToRunsPage()

      cy.findByText(defaultMessages.runs.connect.buttonProject).click()
      cy.get('[aria-modal="true"]').should('exist')

      // Clear existing remote GQL intercept to allow new queries to execute normally
      cy.remoteGraphQLIntercept(async (obj) => {
        return obj.result
      })

      cy.contains('button', defaultMessages.runs.connect.modal.createOrg.refreshButton).click()

      cy.findByText(defaultMessages.runs.connect.modal.selectProject.manageOrgs)
    })

    it('refetches cloudViewer data on open', () => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests', ['--config-file', 'cypressWithoutProjectId.config.js', '--component'])
      cy.startAppServer('component')

      cy.remoteGraphQLIntercept(async (obj, testState) => {
        if (obj.operationName === 'LoginConnectModals_LoginConnectModalsQuery_cloudViewer') {
          testState.refetchCalled = true
        }

        if (obj.result.data?.cloudViewer?.organizations?.nodes) {
          obj.result.data.cloudViewer.organizations.nodes = []
        }

        return obj.result
      })

      cy.loginUser()
      cy.visitApp()
      cy.specsPageIsVisible()

      moveToRunsPage()

      cy.findByText(defaultMessages.runs.connect.buttonProject).click()
      cy.get('[aria-modal="true"]').should('exist')

      cy.withCtx((_, o) => {
        expect(o.testState.refetchCalled).to.eql(true)
      })
    })
  })

  context('Runs - Connect Project', () => {
    it('opens Connect Project modal after clicking Connect Project button', () => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests', ['--config-file', 'cypressWithoutProjectId.config.js', '--component'])
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
      cy.specsPageIsVisible()

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

    it('shows "Connect project" button if a project is not connected after login', () => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests', ['--config-file', 'cypressWithoutProjectId.config.js', '--component'])
      cy.startAppServer('component')

      cy.visitApp()
      cy.specsPageIsVisible()
      moveToRunsPage()

      cy.withCtx(async (ctx, options) => {
        ctx.coreData.app.browserStatus = 'open'
        options.sinon.stub(ctx._apis.electronApi, 'isMainWindowFocused').returns(false)
        options.sinon.stub(ctx._apis.authApi, 'logIn').callsFake(async (onMessage) => {
          setTimeout(() => {
            onMessage({ browserOpened: true })
          }, 500)

          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(options.user)
            }, 1000)
          })
        })
      }, { user: {
        authToken: 'test1',
        email: 'test_user_a@example.com',
        name: 'Test User A',
      } })

      cy.contains('button', 'Connect to Cypress Cloud').click()

      cy.findByRole('dialog', { name: 'Log in to Cypress' }).as('logInModal').within(() => {
        cy.findByRole('button', { name: 'Log in' }).click()
      })

      cy.findByRole('dialog', { name: 'Login successful' }).within(() => {
        cy.findByRole('button', { name: 'Connect project' }).click()
      })

      cy.findByRole('dialog', { name: 'Create project' }).should('be.visible')
    })
  })

  context('Runs - Create Project', () => {
    // TODO: fix flaky test
    it.skip('when a project is created, injects new projectId into the config file, and sends expected UTM params', () => {
      cy.remoteGraphQLIntercept((obj) => {
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
      cy.specsPageIsVisible()

      cy.withCtx(async (ctx, o) => {
        o.sinon.spy(ctx.cloud, 'executeRemoteGraphQL')

        //o.sinon.stub(ctx.lifecycleManager.git!, 'currentBranch').value('fakeBranch')
        const config = await ctx.project.getConfig()

        expect(config.projectId).to.not.equal('newProjectId')
      })

      moveToRunsPage()
      cy.findByText(defaultMessages.runs.connect.buttonProject).click()
      cy.contains('button', defaultMessages.runs.connect.modal.selectProject.createProject).click()
      cy.findByText(defaultMessages.runs.connectSuccessAlert.title, { timeout: 10000 }).scrollIntoView().should('be.visible')

      cy.withCtx(async (ctx) => {
        const config = await ctx.project.getConfig()

        expect(config.projectId).to.equal('newProjectId')
        expect(ctx.cloud.executeRemoteGraphQL).to.have.been.calledWithMatch({
          fieldName: 'cloudProjectCreate',
          operationVariables: {
            medium: 'Runs Tab',
            source: 'Binary: App',
          } })
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
      cy.specsPageIsVisible()

      cy.withCtx(async (ctx) => {
        const config = await ctx.project.getConfig()

        expect(config.projectId).to.not.equal('newProjectId')
      })

      cy.get('[href="#/runs"]').click()
      cy.findByText(defaultMessages.runs.connect.buttonProject).click()
      cy.contains('button', defaultMessages.runs.connect.modal.selectProject.createProject).click()

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
      cy.specsPageIsVisible()

      cy.withCtx(async (ctx) => {
        const config = await ctx.project.getConfig()

        expect(config.projectId).to.not.equal('newProjectId')
      })

      cy.get('[href="#/runs"]').click()
      cy.findByText(defaultMessages.runs.connect.buttonProject).click()
      cy.contains('button', defaultMessages.runs.connect.modal.selectProject.createProject).click()

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
      cy.openProject('component-tests', ['--config-file', 'cypressWithInvalidProjectId.config.js', '--component'])
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
          const projectNodes = obj.result.data.cloudViewer.organizations.nodes[0].projects.nodes

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
      cy.specsPageIsVisible()

      moveToRunsPage()
    })

    it('if project Id is specified in config file that does not exist, shows call to action', () => {
      cy.findByText(defaultMessages.runs.errors.notFound.button).should('be.visible')
    })

    // TODO: fix flaky test
    it.skip('opens Connect Project modal after clicking Reconnect Project button', () => {
      cy.findByText(defaultMessages.runs.errors.notFound.button).click()

      cy.get('[aria-modal="true"]').should('exist')
      cy.contains('[data-cy="selectProject"] button', 'Mock Project')
      cy.get('[data-cy="connect-project"]').click()
      cy.get('[data-cy="runs"]', { timeout: 7500 })
    })
  })

  context('Runs - Unauthorized Project', () => {
    beforeEach(() => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests', ['--component'])
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
        if (obj.operationName?.includes('cloudProject_cloudProjectBySlug')) {
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
      cy.openProject('component-tests', ['--component'])
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
      cy.specsPageIsVisible()

      moveToRunsPage()
    })

    it('if project Id is specified in config file that is not accessible, shows call to action', () => {
      cy.findByText(defaultMessages.runs.errors.unauthorizedRequested.button).should('be.visible')
    })
  })

  context('Runs - No Runs', { viewportWidth: 1280 }, () => {
    it('when no runs and not connected, shows connect to Cypress Cloud button', () => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests', ['--config-file', 'cypressWithoutProjectId.config.js', '--component'])
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
      cy.specsPageIsVisible()
      moveToRunsPage()
      cy.findByText(defaultMessages.runs.connect.buttonProject).should('exist')
    })

    it('displays how to record prompt when connected and no runs in Component Testing', () => {
      scaffoldTestingTypeAndVisitRunsPage('component')
      cy.contains(defaultMessages.runs.empty.title).should('be.visible')
      cy.findByDisplayValue('npx cypress run --component --record --key 2aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa').should('be.visible')
    })

    it('displays how to record prompt when connected and no runs in E2E', () => {
      scaffoldTestingTypeAndVisitRunsPage('e2e')

      cy.contains(defaultMessages.runs.empty.title).should('be.visible')
      cy.findByDisplayValue('npx cypress run --record --key 2aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa').should('be.visible')
    })

    it('displays a copy button and copies correct command in Component Testing', () => {
      scaffoldTestingTypeAndVisitRunsPage('component')
      cy.withCtx(async (ctx, o) => {
        o.sinon.stub(ctx.config.electronApi, 'copyTextToClipboard')
      })

      cy.get('[data-cy="terminal-prompt-input').should('have.value', 'npx cypress run --component --record --key 2aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
      cy.get('[data-cy="copy-button"]').click()
      cy.contains('Copied!')
      cy.withRetryableCtx((ctx) => {
        expect(ctx.config.electronApi.copyTextToClipboard as SinonStub).to.have.been.calledWith('npx cypress run --component --record --key 2aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
      })
    })

    it('displays a copy button and copies correct command in E2E', () => {
      scaffoldTestingTypeAndVisitRunsPage('e2e')

      cy.withCtx(async (ctx, o) => {
        o.sinon.stub(ctx.config.electronApi, 'copyTextToClipboard')
      })

      cy.get('[data-cy="terminal-prompt-input').should('have.value', 'npx cypress run --record --key 2aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
      cy.get('[data-cy="copy-button"]').click()
      cy.contains('Copied!')
      cy.withRetryableCtx((ctx) => {
        expect(ctx.config.electronApi.copyTextToClipboard as SinonStub).to.have.been.calledWith('npx cypress run --record --key 2aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
      })
    })
  })

  context('Runs - Runs List', () => {
    context('no Git data', () => {
      beforeEach(() => {
        cy.scaffoldProject('component-tests')
        cy.openProject('component-tests', ['--component'])
        cy.startAppServer('component')
      })

      it('displays a list of recorded runs if a run has been recorded', () => {
        cy.loginUser()
        cy.visitApp()
        cy.specsPageIsVisible()
        moveToRunsPage()
        cy.get('[data-cy="runs"]')
      })

      it('displays each run with correct information', () => {
        cy.loginUser()
        cy.visitApp()
        cy.specsPageIsVisible()
        moveToRunsPage()

        cy.get('[data-cy="runCard-status-CANCELLED"]').first().within(() => {
          cy.get('[data-cy="runNumber-status-CANCELLED"]')
        })

        cy.get('[data-cy="runCard-status-ERRORED"]').first().within(() => {
          cy.get('[data-cy="runNumber-status-ERRORED"]')
        })

        cy.get('[data-cy="runCard-status-FAILED"]').first().within(() => {
          cy.get('[data-cy="runNumber-status-FAILED"]')
        })

        cy.get('[data-cy="runCard-status-CANCELLED"]').first().as('firstRun')

        cy.get('@firstRun').within(() => {
          cy.get('[data-cy="runCard-author"]').contains('John Appleseed')
          cy.get('[data-cy="runCard-avatar"]')
          cy.get('[data-cy="runCard-branchName"]').contains('main')
          cy.get('[data-cy="runCard-createdAt"]').contains('01m 00s (an hour ago)')

          cy.contains('span', 'skipped')
          cy.get('span').contains('pending')
          cy.get('span').contains('passed')
          cy.get('span').contains('failed')
        })
      })

      it('opens the run page if a run is clicked', () => {
        cy.loginUser()
        cy.visitApp()
        cy.specsPageIsVisible()

        moveToRunsPage()
        cy.get('[data-cy="runNumber-status-CANCELLED"]').first().click()

        cy.withCtx((ctx) => {
          expect((ctx.actions.electron.openExternal as SinonStub).lastCall.lastArg).to.contain('http://dummy.cypress.io/runs/0')
        })
      })

      it('shows connection failed error if no cloudProject', () => {
        let cloudData: any

        cy.loginUser()
        cy.remoteGraphQLIntercept((obj) => {
          if (obj.operationName?.includes('cloudProject_cloudProjectBySlug')) {
            cloudData = obj.result
            obj.result = {}

            return obj.result
          }

          return obj.result
        })

        cy.visitApp()
        cy.specsPageIsVisible()

        moveToRunsPage()

        cy.contains('h2', 'Cannot connect to Cypress Cloud')
        // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435

        cy.remoteGraphQLIntercept((obj) => {
          if (obj.operationName?.includes('cloudProject_cloudProjectBySlug')) {
            return cloudData
          }

          return obj.result
        })

        cy.contains('button', 'Try again').click().should('not.exist')
      })
    })

    context('has Git data', () => {
      beforeEach(() => {
        cy.scaffoldProject('component-tests')
        .then((projectPath) => {
          cy.task('initGitRepoForTestProject', projectPath)
          cy.openProject('component-tests', ['--component'])
          cy.startAppServer('component')
        })
      })

      it('displays a list of recorded runs if a run has been recorded', () => {
        cy.loginUser()
        cy.visitApp()
        cy.specsPageIsVisible()
        moveToRunsPage()
        cy.get('[data-cy="runs"]')
      })

      it('displays each run with correct information', () => {
        cy.loginUser()
        cy.visitApp()
        cy.specsPageIsVisible()
        moveToRunsPage()

        cy.findByText('fix: using Git data CANCELLED')
        cy.get('[href^="http://dummy.cypress.io/runs/0"]').first().within(() => {
          cy.get('[data-cy="runNumber-status-CANCELLED"]')
        })

        cy.get('[data-cy="runCard-status-CANCELLED"]').first().as('firstRun')

        cy.get('@firstRun').within(() => {
          cy.get('[data-cy="runCard-author"]').contains('John Appleseed')
          cy.get('[data-cy="runCard-avatar"]')
          cy.get('[data-cy="runCard-branchName"]').contains('main')
          cy.get('[data-cy="runCard-createdAt"]').contains('01m 00s (an hour ago)')

          cy.contains('span', 'skipped')
          cy.get('span').contains('pending')
          cy.get('span').contains('passed')
          cy.get('span').contains('failed')
        })
      })

      it('opens the run page if a run is clicked', () => {
        cy.loginUser()
        cy.visitApp()
        cy.specsPageIsVisible()

        moveToRunsPage()
        cy.get('[data-cy="runNumber-status-CANCELLED"]').first().click()

        cy.withCtx((ctx) => {
          expect((ctx.actions.electron.openExternal as SinonStub).lastCall.lastArg).to.contain('http://dummy.cypress.io/runs/0')
        })
      })
    })
  })

  describe('no internet connection', () => {
    beforeEach(() => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests', ['--component'])
      cy.startAppServer('component')
    })

    it('shows alert warning if runs have been returned already', () => {
      cy.loginUser()
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.wait(1000)
      moveToRunsPage()
      cy.get('[data-cy="runs"]')

      cy.goOffline()

      cy.get('[data-cy=warning-alert]')
      .should('contain.text', 'You have no internet connection')
      .and('contain.text', 'Check your internet connection to pull the latest data from Cypress Cloud')
    })

    it('should remove the alert warning if the app reconnects to the internet', () => {
      cy.loginUser()
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.wait(1000)
      moveToRunsPage()
      cy.get('[data-cy="runs"]')

      cy.goOffline()

      cy.get('[data-cy=warning-alert]')
      .should('contain.text', 'You have no internet connection')
      .and('contain.text', 'Check your internet connection to pull the latest data from Cypress Cloud')

      cy.goOnline()

      cy.contains('You have no internet connection').should('not.exist')
    })

    it('shows correct message on create org modal', () => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests', ['--config-file', 'cypressWithoutProjectId.config.js', '--component'])
      cy.startAppServer('component')

      cy.remoteGraphQLIntercept((obj) => {
        if (obj.result.data?.cloudViewer?.organizations?.nodes) {
          obj.result.data.cloudViewer.organizations.nodes = []
        }

        if (obj.result.data?.cloudViewer?.firstOrganization?.nodes) {
          obj.result.data.cloudViewer.firstOrganization.nodes = []
        }

        return obj.result
      })

      cy.loginUser()
      cy.visitApp()
      cy.specsPageIsVisible()

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
      .and('contain.text', 'Check your internet connection to pull the latest data from Cypress Cloud')
    })

    it('shows correct message on connect project modal', () => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests', ['--config-file', 'cypressWithoutProjectId.config.js', '--component'])
      cy.startAppServer('component')

      cy.loginUser()
      cy.visitApp()
      cy.specsPageIsVisible()

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
      .and('contain.text', 'Check your internet connection to pull the latest data from Cypress Cloud')
    })
  })

  const RUNNING_COUNT = 3

  describe('refetching', () => {
    beforeEach(() => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests', ['--component'])
      cy.startAppServer('component')
      cy.loginUser()
      cy.remoteGraphQLIntercept((obj) => {
        if (obj.operationName === 'Runs_currentProject_cloudProject_cloudProjectBySlug') {
          if (obj.result.data?.cloudProjectBySlug?.runs?.nodes.length) {
            obj.result.data.cloudProjectBySlug.runs.nodes.map((run) => {
              run.status = 'RUNNING'
            })

            obj.result.data.cloudProjectBySlug.runs.nodes = obj.result.data.cloudProjectBySlug.runs.nodes.slice(0, 3)
          }
        }

        if (obj.operationName === 'RelevantRunSpecsDataSource_Specs') {
          if (obj.result.data?.cloudNodesByIds) {
            obj.result.data?.cloudNodesByIds.map((node) => {
              node.status = 'RUNNING'
            })
          }

          if (obj.result.data) {
            obj.result.data.pollingIntervals = {
              __typename: 'CloudPollingIntervals',
              runByNumber: 0.1,
            }
          }
        }

        return obj.result
      })

      cy.visitApp('/runs')
    })

    // https://github.com/cypress-io/cypress/issues/24575
    const itSkipIfWindows = Cypress.platform === 'win32' ? it.skip : it

    itSkipIfWindows('should re-query for executing runs', () => {
      cy.get('[data-cy="runNumber-status-RUNNING"]').should('have.length', RUNNING_COUNT).should('be.visible')

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
        cy.get('[data-cy="runNumber-status-PASSED"]').should('have.length', passed).should('be.visible')
        if (passed < RUNNING_COUNT) {
          completeNext(passed + 1)
        }
      }

      completeNext(1)
    })
  })
})
