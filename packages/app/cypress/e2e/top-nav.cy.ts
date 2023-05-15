import type { SinonStub } from 'sinon'
import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import { CYPRESS_REMOTE_MANIFEST_URL, NPM_CYPRESS_REGISTRY_URL } from '@packages/types'
import type Sinon from 'sinon'

const pkg = require('@packages/root')

const loginText = defaultMessages.topNav.login

beforeEach(() => {
  cy.clock(Date.UTC(2021, 9, 30), ['Date'])
})

describe('App Top Nav Workflows', () => {
  beforeEach(() => {
    cy.scaffoldProject('launchpad')
  })

  describe('Page Name', () => {
    it('shows the current page name in the top nav', () => {
      cy.findBrowsers()
      cy.openProject('launchpad')
      cy.startAppServer()
      cy.visitApp()

      cy.findByTestId('app-header-bar').should('be.visible').and('contain', 'Specs')
    })
  })

  describe('Browser List', () => {
    context('with command line args', () => {
      it('shows current browser when launched with browser option', () => {
        cy.findBrowsers()
        cy.openProject('launchpad', ['--browser', 'firefox'])
        cy.startAppServer()
        cy.visitApp()

        cy.findByTestId('top-nav-active-browser-icon')
        .should('have.attr', 'src')
        .and('contain', 'firefox')

        cy.findByTestId('top-nav-active-browser').should('contain', 'Firefox 5')
      })
    })

    context('without command line args', () => {
      beforeEach(() => {
        cy.findBrowsers({
          filter: (browser) => {
            return Cypress._.includes(['chrome', 'firefox', 'electron', 'edge'], browser.name) && browser.channel === 'stable'
          },
        })

        cy.openProject('launchpad')
        cy.startAppServer()
        cy.visitApp()
      })

      it('shows the current browser in the top nav browser list button', () => {
        cy.findByTestId('top-nav-active-browser-icon')
        .should('have.attr', 'src')
        .and('contain', 'chrome')

        cy.findByTestId('top-nav-active-browser').should('contain', 'Chrome 1')
      })

      it('shows list of browser options in dropdown when selected', () => {
        cy.findByTestId('top-nav-active-browser').click()

        cy.findAllByTestId('top-nav-browser-list-item').as('browserItems').should('have.length', 4)

        cy.get('@browserItems').eq(0)
        .should('contain', 'Chrome')
        .and('contain', 'Version 1')
        .findByTestId('top-nav-browser-list-selected-item')
        .should('exist')

        cy.get('@browserItems').eq(1)
        .should('contain', 'Edge')
        .and('contain', 'Version 8')
        .findByTestId('top-nav-browser-list-selected-item')
        .should('not.exist')

        cy.get('@browserItems').eq(2)
        .should('contain', 'Electron')
        .and('contain', 'Version 12')
        .findByTestId('top-nav-browser-list-selected-item')
        .should('not.exist')

        cy.get('@browserItems').eq(3)
        .should('contain', 'Firefox')
        .and('contain', 'Version 5')
        .findByTestId('top-nav-browser-list-selected-item')
        .should('not.exist')
      })

      it('performs mutations to update and relaunch browser', () => {
        cy.findByTestId('top-nav-active-browser').click()

        cy.withCtx((ctx, o) => {
          o.sinon.stub(ctx.actions.browser, 'setActiveBrowserById')
          o.sinon.stub(ctx.actions.project, 'launchProject').resolves()
        })

        cy.findAllByTestId('top-nav-browser-list-item').eq(1).click()

        cy.withCtx((ctx, o) => {
          const browserId = (ctx.actions.browser.setActiveBrowserById as SinonStub).args[0][0]
          const genId = ctx.fromId(browserId, 'Browser')

          expect(ctx.actions.browser.setActiveBrowserById).to.have.been.calledWith(browserId)
          expect(genId).to.eql('edge-chromium-stable')
          expect(ctx.actions.project.launchProject).to.have.been.calledWith(
            ctx.coreData.currentTestingType, { shouldLaunchNewTab: false }, '',
          )
        })
      })
    })
  })

  describe('Cypress Version', () => {
    context('user version current', () => {
      it('renders link to external docs if version is current', () => {
        cy.findBrowsers()
        cy.withCtx(async (ctx, o) => {
          o.sinon.stub(ctx.versions, 'versionData').resolves({
            current: {
              id: '1',
              version: '10.0.0',
              released: '2021-10-15T21:38:59.983Z',
            },
            latest: {
              id: '1',
              version: '10.0.0',
              released: '2021-10-25T21:38:59.983Z',
            },
          })
        })

        cy.openProject('launchpad')
        cy.startAppServer()
        cy.visitApp()

        cy.findByTestId('app-header-bar').validateExternalLink({
          name: 'v10.0.0',
          href: 'https://on.cypress.io/changelog#10-0-0',
        })
      })
    })

    context('user version outdated', () => {
      beforeEach(() => {
        cy.findBrowsers()
        cy.withCtx(async (ctx, o) => {
          const currRelease = new Date(Date.UTC(2021, 9, 30))
          const prevRelease = new Date(Date.UTC(2021, 9, 29))

          o.sinon.stub(ctx.versions, 'versionData').resolves({
            current: {
              id: '1',
              version: '10.0.0',
              released: prevRelease.toISOString(),
            },
            latest: {
              id: '2',
              version: '10.1.0',
              released: currRelease.toISOString(),
            },
          })
        })

        cy.openProject('launchpad')
        cy.startAppServer()
        cy.visitApp()
      })

      it('shows dropdown with version info if user version is outdated', () => {
        cy.findByTestId('top-nav-version-list').contains('v10.0.0 • Upgrade').click()

        cy.findByTestId('update-hint').within(() => {
          cy.validateExternalLink({ name: '10.1.0', href: 'https://on.cypress.io/changelog#10-1-0' })
          cy.findByText('Latest').should('be.visible')
        })

        cy.findByTestId('cypress-update-popover').findByRole('button', { name: 'Update to 10.1.0' })

        cy.findByTestId('current-hint').within(() => {
          cy.validateExternalLink({ name: '10.0.0', href: 'https://on.cypress.io/changelog#10-0-0' })
          cy.findByText('Installed').should('be.visible')
        })

        cy.findByTestId('cypress-update-popover').validateExternalLink({
          name: 'See all releases',
          href: 'https://on.cypress.io/changelog',
        })
      })

      it('hides dropdown when version in header is clicked', () => {
        cy.findByTestId('cypress-update-popover').findAllByRole('button').first().as('topNavVersionButton').click()

        cy.get('@topNavVersionButton').should('have.attr', 'aria-expanded', 'true')

        cy.get('@topNavVersionButton').click()

        cy.get('@topNavVersionButton').should('have.attr', 'aria-expanded', 'false')
      })

      it('shows upgrade modal when update button is pressed', () => {
        cy.findByTestId('top-nav-version-list').contains('v10.0.0 • Upgrade').click()

        cy.findByTestId('cypress-update-popover').findByRole('button', { name: 'Update to 10.1.0' }).click()

        cy.findByRole('dialog', { name: 'Upgrade to Cypress 10.1.0' }).as('upgradeModal').within(() => {
          cy.contains('You are currently running Version 10.0.0 of Cypress').should('be.visible')
          cy.findByDisplayValue('npm install -D cypress@10.1.0').should('be.visible')
          cy.findByRole('button', { name: 'Close' }).click()
        })

        cy.findAllByRole('dialog').should('not.exist')
      })
    })

    context('version data unreachable', () => {
      it('treats unreachable data as current version', () => {
        cy.withCtx((ctx, o) => {
          (ctx.util.fetch as Sinon.SinonStub).restore()
          const oldFetch = ctx.util.fetch

          o.sinon.stub(ctx.util, 'fetch').callsFake(async (url: RequestInfo | URL, init?: RequestInit) => {
            await new Promise((resolve) => setTimeout(resolve, 500))
            if ([CYPRESS_REMOTE_MANIFEST_URL, NPM_CYPRESS_REGISTRY_URL].includes(String(url))) {
              throw new Error(String(url))
            }

            return oldFetch(url, init)
          })
        })

        cy.findBrowsers()
        cy.openProject('launchpad')
        cy.startAppServer()
        cy.visitApp()

        cy.findByTestId('app-header-bar').validateExternalLink({
          name: `v${pkg.version}`,
          href: `https://on.cypress.io/changelog#${pkg.version.replaceAll('.', '-')}`,
        })
      })
    })
  })

  describe('Docs', () => {
    beforeEach(() => {
      cy.findBrowsers()
      cy.openProject('launchpad')
      cy.startAppServer()
      cy.visitApp()

      cy.findByTestId('app-header-bar').findByRole('button', { name: 'Docs', expanded: false }).as('docsButton')
    })

    it('shows popover with additional doc links', () => {
      cy.get('@docsButton').click().should('have.attr', 'aria-expanded', 'true')

      cy.findByRole('heading', { name: 'Getting started', level: 2 })
      cy.findByRole('heading', { name: 'References', level: 2 })
      cy.findByRole('heading', { name: 'Run in CI/CD', level: 2 })

      const expectedLinks = [
        {
          name: 'Write your first test',
          href: 'https://on.cypress.io/writing-first-test?utm_medium=Docs+Menu&utm_content=First+Test&utm_source=Binary%3A+App',
        },
        {
          name: 'Testing your app',
          href: 'https://on.cypress.io/testing-your-app?utm_medium=Docs+Menu&utm_content=Testing+Your+App&utm_source=Binary%3A+App',
        },
        {
          name: 'Organizing tests',
          href: 'https://on.cypress.io/writing-and-organizing-tests?utm_medium=Docs+Menu&utm_content=Organizing+Tests&utm_source=Binary%3A+App',
        },
        {
          name: 'Best practices',
          href: 'https://on.cypress.io/best-practices?utm_medium=Docs+Menu&utm_content=Best+Practices&utm_source=Binary%3A+App',
        },
        {
          name: 'Configuration',
          href: 'https://on.cypress.io/configuration?utm_medium=Docs+Menu&utm_content=Configuration&utm_source=Binary%3A+App',
        },
        {
          name: 'API',
          href: 'https://on.cypress.io/api?utm_medium=Docs+Menu&utm_content=API&utm_source=Binary%3A+App',
        },
      ]

      expectedLinks.forEach((link) => {
        cy.validateExternalLink(link)
      })
    })

    it('growth prompts appear and call SetPromptShown mutation with the correct payload', () => {
      cy.get('@docsButton').click()

      cy.withCtx((ctx, o) => {
        o.sinon.stub(ctx.actions.project, 'setPromptShown')
      })

      cy.findByRole('button', { name: 'Set up CI' }).click()
      cy.findByText('Configure CI').should('be.visible')
      cy.findByRole('button', { name: 'Close' }).click()

      cy.withCtx((ctx) => {
        expect(ctx.actions.project.setPromptShown).to.have.been.calledWith('ci1')
      })

      cy.findByRole('button', { name: 'Run tests faster' }).click()
      cy.findByText('Run tests faster in CI').should('be.visible')
      cy.findByRole('button', { name: 'Close' }).click()

      cy.withCtx((ctx) => {
        expect(ctx.actions.project.setPromptShown).to.have.been.calledWith('orchestration1')
      })
    })
  })

  describe('Login', () => {
    context('user logged in at launch', () => {
      beforeEach(() => {
        cy.findBrowsers()
        cy.openProject('launchpad')
        cy.startAppServer()
        cy.loginUser()
        cy.visitApp()

        cy.findByTestId('app-header-bar').findByRole('button', { name: 'Profile and logout', expanded: false }).as('logInButton')
      })

      it('shows user in top nav when logged in', () => {
        cy.get('@logInButton').click()

        cy.findByTestId('login-panel').contains('Test User').should('be.visible')
        cy.findByTestId('login-panel').contains('test@example.com').should('be.visible')

        cy.validateExternalLink({
          name: 'Profile Settings',
          href: 'https://on.cypress.io/dashboard/profile',
        })

        cy.findByTestId('user-avatar-panel').should('be.visible')
      })

      it('replaces user avatar after logout', () => {
        cy.get('@logInButton').click()

        cy.withCtx((ctx, o) => {
          o.sinon.stub(ctx._apis.authApi, 'logOut').callsFake(async () => {
            // resolves
          })
        })

        cy.findByRole('button', { name: 'Log out' }).click()

        cy.findByTestId('app-header-bar').findByText('Log in').should('be.visible')
      })

      it('logouts user if cloud request returns unauthorized', () => {
        cy.scaffoldProject('component-tests')
        cy.openProject('component-tests')
        cy.startAppServer('component')

        cy.remoteGraphQLIntercept((obj) => {
          if (obj.result.data?.cloudProjectBySlug) {
            return new obj.Response('Unauthorized', { status: 401 })
          }

          return obj.result
        })

        cy.loginUser()
        cy.visitApp()

        cy.get('@logInButton').click()

        cy.findByTestId('login-panel').contains('Test User').should('be.visible')
        cy.findByTestId('login-panel').contains('test@example.com').should('be.visible')

        cy.findByTestId('sidebar-link-runs-page').click()
        cy.get('@logInButton').click()

        cy.findByTestId('app-header-bar').within(() => {
          cy.findByTestId('user-avatar-title').should('not.exist')
          cy.findByRole('button', { name: 'Log in' }).click()
        })
      })
    })

    context('user not logged in', () => {
      const mockUser = {
        authToken: 'test1',
        email: 'test_user_a@example.com',
        name: 'Test User A',
      }

      const mockUserNoName = {
        authToken: 'test22',
        email: 'test_user_b@example.com',
      }

      const mockLogInActionsForUser = (user) => {
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
              }, 2000)
            })
          })
        }, { user })
      }

      function logIn ({ expectedNextStepText, displayName }) {
        cy.findByTestId('app-header-bar').within(() => {
          cy.findByTestId('user-avatar-title').should('not.exist')
          cy.findByRole('button', { name: 'Log in' }).click()
        })

        cy.findByRole('dialog', { name: 'Log in to Cypress' }).as('logInModal').within(() => {
          cy.findByRole('button', { name: 'Log in' }).click()

          // The Log in button transitions through a few states as the browser launch lifecycle completes
          cy.findByRole('button', { name: 'Opening browser' }).should('be.visible').and('be.disabled')
          cy.findByRole('button', { name: 'Waiting for you to log in' }).should('be.visible').and('be.disabled')
        })

        cy.findByRole('dialog', { name: 'Login successful' }).within(() => {
          cy.findByText('You are now logged in as', { exact: false }).should('be.visible')
          cy.validateExternalLink({ name: displayName, href: 'https://on.cypress.io/dashboard/profile' })

          // The dialog can be closed at this point by either the header close button or the Continue button
          // The Continue button is tested here
          cy.findByRole('button', { name: 'Close' }).should('be.visible').and('not.be.disabled')
          cy.findByRole('button', { name: expectedNextStepText }).click()
        })
      }
      context('with no project id', () => {
        it('shows "connect project" button after login if no project id is set', () => {
          cy.scaffoldProject('component-tests')
          cy.openProject('component-tests', ['--config-file', 'cypressWithoutProjectId.config.js'])
          cy.startAppServer()
          cy.visitApp()
          cy.remoteGraphQLIntercept(async (obj) => {
            if (obj.result.data?.cloudViewer) {
              obj.result.data.cloudViewer.organizations = {
                __typename: 'CloudOrganizationConnection',
                id: 'test',
                nodes: [{ __typename: 'CloudOrganization', id: '987' }],
              }
            }

            return obj.result
          })

          mockLogInActionsForUser(mockUser)
          logIn({ expectedNextStepText: 'Connect project', displayName: mockUser.name })
          cy.withCtx((ctx, o) => {
            // validate utmSource
            expect((ctx._apis.authApi.logIn as SinonStub).lastCall.args[1]).to.eq('Binary: App')
            // validate utmMedium
            expect((ctx._apis.authApi.logIn as SinonStub).lastCall.args[2]).to.eq('Nav')
          })

          cy.findByRole('dialog', { name: 'Create project' }).should('be.visible')
        })
      })

      context('when there is a project id', () => {
        beforeEach(() => {
          cy.findBrowsers()
          cy.scaffoldProject('component-tests')
          cy.openProject('component-tests')
          cy.startAppServer()
          cy.visitApp()
        })

        it('shows log in modal workflow for user with name and email', () => {
          mockLogInActionsForUser(mockUser)

          logIn({ expectedNextStepText: 'Continue', displayName: mockUser.name })

          cy.get('@logInModal').should('not.exist')
          cy.findByTestId('app-header-bar').findByTestId('user-avatar-title').should('be.visible')
        })

        it('shows log in modal workflow for user with only email', () => {
          mockLogInActionsForUser(mockUserNoName)

          logIn({ expectedNextStepText: 'Continue', displayName: mockUserNoName.email })

          cy.get('@logInModal').should('not.exist')
          cy.findByTestId('app-header-bar').findByTestId('user-avatar-title').should('be.visible')
        })

        it('if the project has no runs, shows "record your first run" prompt after clicking', () => {
          cy.remoteGraphQLIntercept((obj) => {
            if (obj.result?.data?.cloudProjectBySlug?.runs?.nodes?.length) {
              obj.result.data.cloudProjectBySlug.runs.nodes = []
            }

            return obj.result
          })

          mockLogInActionsForUser(mockUserNoName)

          logIn({ expectedNextStepText: 'Continue', displayName: mockUserNoName.email })

          cy.contains('[data-cy=standard-modal] h2', defaultMessages.specPage.banners.record.title).should('be.visible')
          cy.contains('[data-cy=standard-modal]', defaultMessages.specPage.banners.record.content).should('be.visible')
          cy.contains('button', 'Copy').should('be.visible')
        })

        it('shows correct error when browser cannot launch', () => {
          cy.withCtx((ctx, o) => {
            o.sinon.stub(ctx._apis.authApi, 'logIn').callsFake(async (onMessage) => {
              onMessage({
                name: 'AUTH_COULD_NOT_LAUNCH_BROWSER',
                message: 'http://127.0.0.1:0000/redirect-to-auth',
                browserOpened: false,
              })

              throw new Error()
            })
          })

          cy.findByTestId('app-header-bar').within(() => {
            cy.findByTestId('user-avatar-title').should('not.exist')
            cy.findByRole('button', { name: 'Log in' }).click()
          })

          cy.findByRole('dialog').within(() => {
            cy.findByRole('button', { name: 'Log in' }).click()

            cy.contains('http://127.0.0.1:0000/redirect-to-auth').should('be.visible')
            cy.contains(loginText.titleBrowserError).should('be.visible')
            cy.contains(loginText.bodyBrowserError).should('be.visible')
            cy.contains(loginText.bodyBrowserErrorDetails).should('be.visible')

            // in this state, there is no retry UI, we ask the user to visit the auth url on their own
            cy.contains('button', loginText.actionTryAgain).should('not.be.visible')
            cy.contains('button', loginText.actionCancel).should('not.be.visible')
          })
        })

        it('shows correct error when error other than browser-launch happens', () => {
          cy.withCtx((ctx, o) => {
            o.sinon.stub(ctx._apis.authApi, 'logIn').callsFake(async (onMessage) => {
              onMessage({
                name: 'AUTH_ERROR_DURING_LOGIN',
                message: 'An unexpected error occurred',
                browserOpened: false,
              })

              throw new Error()
            })
          })

          cy.findByTestId('app-header-bar').within(() => {
            cy.findByTestId('user-avatar-title').should('not.exist')
            cy.findByRole('button', { name: 'Log in' }).click()
          })

          cy.findByRole('dialog').within(() => {
            cy.findByRole('button', { name: 'Log in' }).click()

            cy.contains(loginText.titleFailed).should('be.visible')
            cy.contains(loginText.bodyError).should('be.visible')
            cy.contains('An unexpected error occurred').should('be.visible')

            cy.contains('button', loginText.actionTryAgain).should('be.visible').as('tryAgain')
            cy.contains('button', loginText.actionCancel).should('be.visible')
          })

          // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435

          cy.withCtx((ctx) => {
            (ctx._apis.authApi.logIn as SinonStub).callsFake(async (onMessage) => {
              onMessage({
                name: 'AUTH_BROWSER_LAUNCHED',
                message: '',
                browserOpened: true,
              })

              return Promise.resolve()
            })
          })

          cy.get('@tryAgain').click()

          cy.findByRole('dialog', { name: loginText.titleInitial }).within(() => {
            cy.contains(loginText.actionWaiting).should('be.visible')
          })
        })

        it('cancel button correctly clears error state', () => {
          cy.withCtx((ctx, o) => {
            o.sinon.stub(ctx._apis.authApi, 'logIn').callsFake(async (onMessage) => {
              onMessage({
                name: 'AUTH_ERROR_DURING_LOGIN',
                message: 'An unexpected error occurred',
                browserOpened: false,
              })

              throw new Error()
            })
          })

          cy.findByTestId('app-header-bar').within(() => {
            cy.findByTestId('user-avatar-title').should('not.exist')
            cy.findByRole('button', { name: 'Log in' }).as('loginButton').click()
          })

          cy.findByRole('dialog').within(() => {
            cy.findByRole('button', { name: 'Log in' }).click()

            cy.contains(loginText.titleFailed).should('be.visible')
            cy.contains(loginText.bodyError).should('be.visible')
            cy.contains('An unexpected error occurred').should('be.visible')
          })

          // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435

          cy.findByRole('dialog', { name: loginText.titleFailed }).within(() => {
            cy.contains('button', loginText.actionTryAgain).should('be.visible')
            cy.contains('button', loginText.actionCancel).click()
          })

          cy.get('@loginButton').click()
          cy.contains(loginText.titleInitial).should('be.visible')
        })

        it('closing modal correctly clears error state', () => {
          cy.withCtx((ctx, o) => {
            o.sinon.stub(ctx._apis.authApi, 'logIn').callsFake(async (onMessage) => {
              onMessage({
                name: 'AUTH_ERROR_DURING_LOGIN',
                message: 'An unexpected error occurred',
                browserOpened: false,
              })

              throw new Error()
            })
          })

          cy.findByTestId('app-header-bar').within(() => {
            cy.findByTestId('user-avatar-title').should('not.exist')
            cy.findByRole('button', { name: 'Log in' }).as('loginButton').click()
          })

          cy.findByRole('dialog').within(() => {
            cy.findByRole('button', { name: 'Log in' }).click()
            cy.contains(loginText.titleFailed).should('be.visible')
            cy.contains(loginText.bodyError).should('be.visible')
            cy.contains('An unexpected error occurred').should('be.visible')

            cy.findByLabelText(defaultMessages.actions.close).click()
          })

          cy.get('@loginButton').click()
          cy.contains(loginText.titleInitial).should('be.visible')
        })
      })
    })
  })
})

describe('Growth Prompts Can Open Automatically', () => {
  beforeEach(() => {
    cy.clock(1609891200000)
    cy.scaffoldProject('launchpad')
    cy.openProject('launchpad')
    cy.startAppServer('e2e', { skipMockingPrompts: true })
  })

  it('CI prompt auto-opens 4 days after first project opened', () => {
    cy.withCtx(
      (ctx, o) => {
        o.sinon.stub(ctx._apis.projectApi, 'getCurrentProjectSavedState').resolves({
          firstOpened: 1609459200000,
          lastOpened: 1609459200000,
          promptsShown: {},
          banners: { _disabled: true },
        })
      },
    )

    cy.visitApp()
    cy.contains('E2E specs')
    cy.wait(1000)
    cy.contains('Configure CI').should('be.visible')
  })

  it('CI prompt does not auto-open when it has already been dismissed', () => {
    cy.withCtx(
      (ctx, o) => {
        o.sinon.stub(ctx._apis.projectApi, 'getCurrentProjectSavedState').resolves({
          firstOpened: 1609459200000,
          lastOpened: 1609459200000,
          promptsShown: { ci1: 1609459200000 },
          banners: { _disabled: true },
        })
      },
    )

    cy.visitApp()
    cy.contains('E2E specs')
    cy.wait(1000)
    cy.contains('Configure CI').should('not.exist')
  })
})
