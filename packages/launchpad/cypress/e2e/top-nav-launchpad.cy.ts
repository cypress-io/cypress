import type { SinonStub } from 'sinon'
import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import type Sinon from 'sinon'
import { CYPRESS_REMOTE_MANIFEST_URL, NPM_CYPRESS_REGISTRY_URL } from '@packages/types'

const pkg = require('@packages/root')

const loginText = defaultMessages.topNav.login

const headerBarId = 'header-bar-content'

beforeEach(() => {
  cy.clock(Date.UTC(2021, 9, 30), ['Date'])
})

describe('Launchpad Top Nav Workflows', () => {
  context('Page Name', () => {
    it('shows the current page name in the top nav', () => {
      cy.scaffoldProject('launchpad')
      cy.findBrowsers()
      cy.openProject('launchpad')
      cy.visitLaunchpad()

      cy.findByTestId(headerBarId).should('be.visible').and('contain', 'launchpad')
    })

    it('shows breadcrumbs in global mode', () => {
      cy.scaffoldProject('launchpad')
      cy.openGlobalMode()
      cy.addProject('launchpad')
      cy.visitLaunchpad()

      cy.findByTestId(headerBarId).should('be.visible').and('contain', 'Projects')

      cy.get('[data-cy="project-card"]').click()

      cy.findByTestId(headerBarId).should('be.visible').and('contain', 'Projects').and('contain', 'launchpad')
    })
  })

  context('Cypress Version', () => {
    context('user version current', () => {
      it('renders link to external docs if version is current', () => {
        cy.scaffoldProject('launchpad')
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
        cy.visitLaunchpad()

        cy.findByTestId(headerBarId).validateExternalLink({
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

        cy.scaffoldProject('launchpad')
        cy.openProject('launchpad')
        cy.visitLaunchpad()
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
          cy.findAllByDisplayValue('npm install -D cypress@10.1.0').should('be.visible')
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

        cy.scaffoldProject('launchpad')
        cy.findBrowsers()
        cy.openProject('launchpad')
        cy.visitLaunchpad()

        cy.findByTestId(headerBarId).validateExternalLink({
          name: `v${pkg.version}`,
          href: `https://on.cypress.io/changelog#${pkg.version.replaceAll('.', '-')}`,
        })
      })
    })
  })

  describe('Docs', () => {
    context('user initiated', () => {
      beforeEach(() => {
        cy.scaffoldProject('launchpad')
        cy.findBrowsers()
        cy.openProject('launchpad')
        cy.visitLaunchpad()

        cy.findByTestId(headerBarId).findByRole('button', { name: 'Docs', expanded: false }).as('docsButton')
      })

      it('shows popover with additional doc links', () => {
        cy.get('@docsButton').click().should('have.attr', 'aria-expanded', 'true')

        cy.findByRole('heading', { name: 'Getting started', level: 2 })
        cy.findByRole('heading', { name: 'References', level: 2 })
        cy.findByRole('heading', { name: 'Run in CI/CD', level: 2 })

        const expectedLinks = [
          {
            name: 'Write your first test',
            href: 'https://on.cypress.io/writing-first-test?utm_medium=Docs+Menu&utm_content=First+Test&utm_source=Binary%3A+Launchpad',
          },
          {
            name: 'Testing your app',
            href: 'https://on.cypress.io/testing-your-app?utm_medium=Docs+Menu&utm_content=Testing+Your+App&utm_source=Binary%3A+Launchpad',
          },
          {
            name: 'Organizing tests',
            href: 'https://on.cypress.io/writing-and-organizing-tests?utm_medium=Docs+Menu&utm_content=Organizing+Tests&utm_source=Binary%3A+Launchpad',
          },
          {
            name: 'Best practices',
            href: 'https://on.cypress.io/best-practices?utm_medium=Docs+Menu&utm_content=Best+Practices&utm_source=Binary%3A+Launchpad',
          },
          {
            name: 'Configuration',
            href: 'https://on.cypress.io/configuration?utm_medium=Docs+Menu&utm_content=Configuration&utm_source=Binary%3A+Launchpad',
          },
          {
            name: 'API',
            href: 'https://on.cypress.io/api?utm_medium=Docs+Menu&utm_content=API&utm_source=Binary%3A+Launchpad',
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

    context('time based operations', () => {
      beforeEach(() => {
        cy.clock(1609891200000)
        cy.scaffoldProject('launchpad')
        cy.openProject('launchpad')
      })

      it('growth prompts do not auto-open 4 days after first project opened', () => {
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

        cy.visitLaunchpad()
        cy.contains('launchpad')
        cy.wait(1000)
        cy.contains('Configure CI').should('not.exist')
      })
    })
  })

  describe('Login', () => {
    context('user logged in at launch', () => {
      beforeEach(() => {
        cy.findBrowsers()
        cy.openProject('launchpad')
        cy.loginUser()
        cy.visitLaunchpad()

        cy.findByTestId(headerBarId).findByRole('button', { name: 'Profile and logout', expanded: false }).as('logInButton')
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

        cy.findByTestId(headerBarId).findByText('Log in').should('be.visible')
      })
    })

    context('user fails log in', () => {
      it('logs out user if cloud request returns unauthorized', () => {
        cy.findBrowsers()
        cy.scaffoldProject('component-tests')
        cy.openProject('component-tests')
        cy.loginUser()
        cy.visitLaunchpad()

        cy.remoteGraphQLIntercept((obj) => {
          if (obj.result.data?.cloudProjectBySlug) {
            return new obj.Response('Unauthorized', { status: 401 })
          }

          return obj.result
        })

        cy.findByTestId(headerBarId).findByRole('button', { name: 'Profile and logout', expanded: false }).as('logInButton')

        cy.get('@logInButton').click()

        cy.findByTestId('login-panel').contains('Test User').should('be.visible')
        cy.findByTestId('login-panel').contains('test@example.com').should('be.visible')

        // Navigate somewhere that will query the cloud to trigger the unauthorized response
        cy.contains('Component Testing').click()
        cy.get('@logInButton').click()

        cy.findByTestId(headerBarId).within(() => {
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
          options.sinon.stub(ctx._apis.electronApi, 'isMainWindowFocused').returns(true)
          options.sinon.stub(ctx._apis.authApi, 'logIn').callsFake(async (onMessage) => {
            setTimeout(() => {
              onMessage({ browserOpened: true })
            }, 2000)

            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(options.user)
              }, 3000)
            })
          })
        }, { user })
      }

      type LoginOptions = {
        expectedNextStepText: 'Continue' | 'Connect project'
        displayName: string
      }

      function logIn ({ expectedNextStepText, displayName }: LoginOptions) {
        cy.findByTestId(headerBarId).within(() => {
          cy.findByTestId('user-avatar-title').should('not.exist')
          cy.findByRole('button', { name: 'Log in' }).click()
        })

        cy.findByRole('dialog', { name: 'Log in to Cypress' }).as('logInModal').within(() => {
          cy.findByRole('button', { name: 'Log in' }).click()

          // The Log In button transitions through a few states as the browser launch lifecycle completes
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

      beforeEach(() => {
        cy.scaffoldProject('launchpad')
        cy.openProject('launchpad')
        cy.visitLaunchpad()
      })

      context('with no project id', () => {
        it('shows "continue" button after login if config has not loaded', () => {
          mockLogInActionsForUser(mockUser)
          logIn({ expectedNextStepText: 'Continue', displayName: mockUser.name })
          cy.withCtx((ctx, o) => {
            // validate utmSource
            expect((ctx._apis.authApi.logIn as SinonStub).lastCall.args[1]).to.eq('Binary: Launchpad')
            // validate utmMedium
            expect((ctx._apis.authApi.logIn as SinonStub).lastCall.args[2]).to.eq('Nav')
          })
        })

        it('shows "connect project" button after login if no project id is set', () => {
          cy.contains('E2E Testing').click()

          mockLogInActionsForUser(mockUser)
          logIn({ expectedNextStepText: 'Connect project', displayName: mockUser.name })
          cy.withCtx((ctx, o) => {
            // validate utmSource
            expect((ctx._apis.authApi.logIn as SinonStub).lastCall.args[1]).to.eq('Binary: Launchpad')
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
          cy.visitLaunchpad()
        })

        it('shows log in modal workflow for user with name and email', () => {
          cy.contains('Component Testing').click()
          mockLogInActionsForUser(mockUser)

          logIn({ expectedNextStepText: 'Continue', displayName: mockUser.name })

          cy.get('@logInModal').should('not.exist')
          cy.findByTestId(headerBarId).findByTestId('user-avatar-title').should('be.visible')
        })

        it('shows log in modal workflow for user with only email', () => {
          cy.contains('Component Testing').click()
          mockLogInActionsForUser(mockUserNoName)

          logIn({ expectedNextStepText: 'Continue', displayName: mockUserNoName.email })

          cy.get('@logInModal').should('not.exist')
          cy.findByTestId(headerBarId).findByTestId('user-avatar-title').should('be.visible')
        })

        it('if the project has no runs, shows "record your first run" prompt after choosing testing type', () => {
          cy.remoteGraphQLIntercept((obj) => {
            if (obj.result?.data?.cloudProjectBySlug?.runs?.nodes?.length) {
              obj.result.data.cloudProjectBySlug.runs.nodes = []
            }

            return obj.result
          })

          cy.contains('E2E Testing').click()

          cy.contains(defaultMessages.setupWizard.chooseBrowser.title).should('be.visible')

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

          cy.findByTestId(headerBarId).within(() => {
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

          cy.findByTestId(headerBarId).within(() => {
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

          cy.findByTestId(headerBarId).within(() => {
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

          cy.findByTestId(headerBarId).within(() => {
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

      context('global mode', () => {
        it('shows "continue" button after login if project not selected', () => {
          cy.openGlobalMode()
          cy.visitLaunchpad()

          mockLogInActionsForUser(mockUser)
          logIn({ expectedNextStepText: 'Continue', displayName: mockUser.name })
          cy.withCtx((ctx, o) => {
            // validate utmSource
            expect((ctx._apis.authApi.logIn as SinonStub).lastCall.args[1]).to.eq('Binary: Launchpad')
            // validate utmMedium
            expect((ctx._apis.authApi.logIn as SinonStub).lastCall.args[2]).to.eq('Nav')
          })
        })

        it('shows "continue" button after login if project selected', () => {
          cy.openGlobalMode()
          cy.addProject('component-tests')
          cy.visitLaunchpad()

          cy.get('[data-cy="project-card"]').click()

          mockLogInActionsForUser(mockUser)
          logIn({ expectedNextStepText: 'Continue', displayName: mockUser.name })
          cy.withCtx((ctx, o) => {
            // validate utmSource
            expect((ctx._apis.authApi.logIn as SinonStub).lastCall.args[1]).to.eq('Binary: Launchpad')
            // validate utmMedium
            expect((ctx._apis.authApi.logIn as SinonStub).lastCall.args[2]).to.eq('Nav')
          })
        })

        it('shows "continue" button after login if project selected has project id', () => {
          cy.openGlobalMode()
          cy.addProject('component-tests')
          cy.visitLaunchpad()

          cy.get('[data-cy="project-card"]').click()

          cy.contains('E2E Testing', { timeout: 10000 }).click()

          mockLogInActionsForUser(mockUser)
          logIn({ expectedNextStepText: 'Continue', displayName: mockUser.name })
          cy.withCtx((ctx, o) => {
            // validate utmSource
            expect((ctx._apis.authApi.logIn as SinonStub).lastCall.args[1]).to.eq('Binary: Launchpad')
            // validate utmMedium
            expect((ctx._apis.authApi.logIn as SinonStub).lastCall.args[2]).to.eq('Nav')
          })
        })

        it('shows "connect project" button after login if project selected has no project id', () => {
          cy.openGlobalMode()
          cy.addProject('launchpad')
          cy.visitLaunchpad()

          cy.get('[data-cy="project-card"]').click()

          cy.contains('E2E Testing', { timeout: 10000 }).click()

          mockLogInActionsForUser(mockUser)
          logIn({ expectedNextStepText: 'Connect project', displayName: mockUser.name })
          cy.withCtx((ctx, o) => {
            // validate utmSource
            expect((ctx._apis.authApi.logIn as SinonStub).lastCall.args[1]).to.eq('Binary: Launchpad')
            // validate utmMedium
            expect((ctx._apis.authApi.logIn as SinonStub).lastCall.args[2]).to.eq('Nav')
          })

          cy.findByRole('dialog', { name: 'Create project' }).should('be.visible')
        })
      })
    })
  })
})
