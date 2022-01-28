import type { AuthMessage } from '../../../data-context/src/actions/AuthActions'

describe('App Top Nav Workflows', () => {
  beforeEach(() => {
    cy.scaffoldProject('launchpad')

    cy.clock(Date.UTC(2021, 9, 30), ['Date'])
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
        .and('contain', 'Version 1.2.3')
        .findByTestId('top-nav-browser-list-selected-item')
        .should('exist')

        cy.get('@browserItems').eq(1)
        .should('contain', 'Firefox')
        .and('contain', 'Version 5.6.7')
        .findByTestId('top-nav-browser-list-selected-item')
        .should('not.exist')

        cy.get('@browserItems').eq(2)
        .should('contain', 'Edge')
        .and('contain', 'Version 8.9.10')
        .findByTestId('top-nav-browser-list-selected-item')
        .should('not.exist')

        cy.get('@browserItems').eq(3)
        .should('contain', 'Electron')
        .and('contain', 'Version 12.13.14')
        .findByTestId('top-nav-browser-list-selected-item')
        .should('not.exist')
      })

      it('performs mutations to update and relaunch browser', () => {
        cy.findByTestId('top-nav-active-browser').click()

        cy.intercept('mutation-TopNav_SetBrowser').as('setBrowser')
        cy.intercept('mutation-TopNav_LaunchOpenProject').as('launchOpenProject')

        cy.findAllByTestId('top-nav-browser-list-item').eq(1).click().then(($element) => {
          cy.wait('@setBrowser').then(({ request }) => {
            expect(request.body.variables.id).to.eq($element.attr('data-browser-id'))
          })

          cy.wait('@launchOpenProject')
        })
      })
    })
  })

  describe('Cypress Version', () => {
    context('user version current', () => {
      it('renders link to external docs if version is current', () => {
        cy.findBrowsers()
        cy.withCtx(async (ctx) => {
          // @ts-ignore sinon is a global in the node process where this is executed
          sinon.stub(ctx, 'versions').resolves({
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
          href: 'https://github.com/cypress-io/cypress/releases/tag/v10.0.0',
        })
      })
    })

    context('user version outdated', () => {
      beforeEach(() => {
        cy.findBrowsers()
        cy.withCtx(async (ctx) => {
          const currRelease = new Date(Date.UTC(2021, 9, 30))
          const prevRelease = new Date(Date.UTC(2021, 9, 29))

          // @ts-ignore sinon is a global in the node process where this is executed
          sinon.stub(ctx, 'versions').resolves({
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
          cy.validateExternalLink({ name: '10.1.0', href: 'https://github.com/cypress-io/cypress/releases/tag/v10.1.0' })
          cy.findByText('Latest').should('be.visible')
        })

        cy.findByTestId('cypress-update-popover').findByRole('button', { name: 'Update to 10.1.0' })

        cy.findByTestId('current-hint').within(() => {
          cy.validateExternalLink({ name: '10.0.0', href: 'https://github.com/cypress-io/cypress/releases/tag/v10.0.0' })
          cy.findByText('Installed').should('be.visible')
        })

        cy.findByTestId('cypress-update-popover').validateExternalLink({
          name: 'See all releases',
          href: 'https://github.com/cypress-io/cypress/releases',
        })
      })

      it('hides dropdown when version in header is clicked', () => {
        cy.findByTestId('cypress-update-popover').findByRole('button', { expanded: false }).as('topNavVersionButton').click()

        cy.get('@topNavVersionButton').should('have.attr', 'aria-expanded', 'true')

        cy.get('@topNavVersionButton').click()

        cy.get('@topNavVersionButton').should('have.attr', 'aria-expanded', 'false')
      })

      it('shows upgrade modal when update button is pressed', () => {
        cy.findByTestId('top-nav-version-list').contains('v10.0.0 • Upgrade').click()

        cy.findByTestId('cypress-update-popover').findByRole('button', { name: 'Update to 10.1.0' }).click()

        cy.findByRole('dialog', { name: 'Upgrade to Cypress 10.1.0' }).as('upgradeModal').within(() => {
          cy.validateExternalLink({ name: 'Need help', href: 'https://on.cypress.io' })
          cy.contains('You are currently running Version 10.0.0 of Cypress').should('be.visible')
          cy.contains('npm install --save-dev cypress@10.1.0').should('be.visible')
          cy.findByRole('button', { name: 'Close' }).click()
        })

        cy.findAllByRole('dialog').should('not.exist')
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

      cy.findByRole('heading', { name: 'Getting Started', level: 2 })
      cy.findByRole('heading', { name: 'References', level: 2 })
      cy.findByRole('heading', { name: 'Run in CI/CD', level: 2 })

      cy.validateExternalLink({
        name: 'Write your first test',
        href: 'https://on.cypress.io/writing-first-test?utm_medium=Docs+Menu&utm_content=First+Test',
      })

      cy.validateExternalLink({
        name: 'Testing your app',
        href: 'https://on.cypress.io/testing-your-app?utm_medium=Docs+Menu&utm_content=Testing+Your+App',
      })

      cy.validateExternalLink({
        name: 'Organizing Tests',
        href: 'https://on.cypress.io/writing-and-organizing-tests?utm_medium=Docs+Menu&utm_content=Organizing+Tests',
      })

      cy.validateExternalLink({
        name: 'Best Practices',
        href: 'https://on.cypress.io/best-practices?utm_medium=Docs+Menu&utm_content=Best+Practices',
      })

      cy.validateExternalLink({
        name: 'Configuration',
        href: 'https://on.cypress.io/configuration?utm_medium=Docs+Menu&utm_content=Configuration',
      })

      cy.validateExternalLink({
        name: 'API',
        href: 'https://on.cypress.io/api?utm_medium=Docs+Menu&utm_content=API',
      })
    })

    it('growth prompts appear and call SetPromptShown mutation with the correct payload', () => {
      cy.get('@docsButton').click()

      cy.intercept('mutation-TopNav_SetPromptShown').as('SetPromptShown')

      cy.findByRole('button', { name: 'Set up CI' }).click()
      cy.findByText('Configure CI').should('be.visible')
      cy.findByRole('button', { name: 'Close' }).click()

      cy.wait('@SetPromptShown')
      .its('request.body.variables.slug')
      .should('equal', 'ci1')

      cy.findByRole('button', { name: 'Run tests faster' }).click()
      cy.findByText('Run tests faster in CI').should('be.visible')
      cy.findByRole('button', { name: 'Close' }).click()

      cy.wait('@SetPromptShown')
      .its('request.body.variables.slug')
      .should('equal', 'orchestration1')
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

        cy.findByTestId('app-header-bar').findByRole('button', { name: 'Profile and Log Out', expanded: false }).as('logInButton')
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

        cy.withCtx((ctx) => {
        // @ts-ignore sinon is a global in the node process where this is executed
          sinon.stub(ctx._apis.authApi, 'logOut').callsFake(async () => {
            // resolves
          })
        })

        cy.intercept('mutation-Logout').as('logout')

        cy.findByRole('button', { name: 'Log Out' }).click()

        cy.wait('@logout')

        cy.findByTestId('app-header-bar').findByText('Log In').should('be.visible')
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
        cy.withCtx((ctx, options) => {
        // @ts-ignore sinon is a global in the node process where this is executed
          sinon.stub(ctx._apis.authApi, 'logIn').callsFake(async (onMessage) => {
            onMessage({ browserOpened: true } as AuthMessage)

            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(options.user)
              }, 2000) // timeout ensures full auth browser lifecycle is testable
            })
          })
        }, { user })
      }

      beforeEach(() => {
        cy.findBrowsers()
        cy.openProject('launchpad')
        cy.startAppServer()
        cy.visitApp()
      })

      it('shows log in modal workflow for user with name and email', () => {
        mockLogInActionsForUser(mockUser)

        cy.findByTestId('app-header-bar').within(() => {
          cy.findByTestId('user-avatar-title').should('not.exist')
          cy.findByRole('button', { name: 'Log In' }).click()
        })

        cy.findByRole('dialog', { name: 'Log in to Cypress' }).as('logInModal').within(() => {
          cy.findByRole('button', { name: 'Log In' }).click()

          // The Log In button transitions through a few states as the browser launch lifecycle completes
          cy.findByRole('button', { name: 'Opening Browser' }).should('be.visible').and('be.disabled')
          cy.findByRole('button', { name: 'Waiting for you to log in' }).should('be.visible').and('be.disabled')
        })

        cy.findByRole('dialog', { name: 'Login Successful' }).within(() => {
          cy.findByText('You are now logged in as', { exact: false }).should('be.visible')
          cy.validateExternalLink({ name: mockUser.name, href: 'https://on.cypress.io/dashboard/profile' })

          // The dialog can be closed at this point by either the header close button or the Continue button
          // The Continue button is tested here
          cy.findByRole('button', { name: 'Close' }).should('be.visible').and('not.be.disabled')
          cy.findByRole('button', { name: 'Continue' }).click()
        })

        cy.get('@logInModal').should('not.exist')
        cy.findByTestId('app-header-bar').findByTestId('user-avatar-title').should('be.visible')
      })

      it('shows log in modal workflow for user with only email', () => {
        mockLogInActionsForUser(mockUserNoName)

        cy.findByTestId('app-header-bar').within(() => {
          cy.findByTestId('user-avatar-title').should('not.exist')
          cy.findByRole('button', { name: 'Log In' }).click()
        })

        cy.findByRole('dialog', { name: 'Log in to Cypress' }).as('logInModal').within(() => {
          cy.findByRole('button', { name: 'Log In' }).click()

          // The Log In button transitions through a few states as the browser launch lifecycle completes
          cy.findByRole('button', { name: 'Opening Browser' }).should('be.visible').and('be.disabled')
          cy.findByRole('button', { name: 'Waiting for you to log in' }).should('be.visible').and('be.disabled')
        })

        cy.findByRole('dialog', { name: 'Login Successful' }).within(() => {
          cy.findByText('You are now logged in as', { exact: false }).should('be.visible')
          cy.validateExternalLink({ name: mockUserNoName.email, href: 'https://on.cypress.io/dashboard/profile' })

          // The dialog can be closed at this point by either the header close button or the Continue button
          // The close button is tested here
          cy.findByRole('button', { name: 'Continue' }).should('be.visible').and('not.be.disabled')
          cy.findByRole('button', { name: 'Close' }).click()
        })

        cy.get('@logInModal').should('not.exist')
        cy.findByTestId('app-header-bar').findByTestId('user-avatar-title').should('be.visible')
      })
    })
  })
})

describe('Growth Prompts Can Open Automatically', () => {
  beforeEach(() => {
    cy.clock(1609891200000)
    cy.scaffoldProject('launchpad')
    cy.openProject('launchpad')
    cy.startAppServer()
  })

  it('CI prompt auto-opens 4 days after first project opened', () => {
    cy.withCtx(
      (ctx) => {
        // @ts-ignore sinon is a global in the node process where this is executed
        sinon.stub(ctx._apis.projectApi, 'getCurrentProjectSavedState').resolves({
          firstOpened: 1609459200000,
          lastOpened: 1609459200000,
          promptsShown: {},
        })
      },
    )

    cy.visitApp()
    cy.contains('Configure CI').should('be.visible')
  })

  it('CI prompt does not auto-open when it has already been dismissed', () => {
    cy.withCtx(
      (ctx) => {
        // @ts-ignore sinon is a global in the node process where this is executed
        sinon.stub(ctx._apis.projectApi, 'getCurrentProjectSavedState').resolves({
          firstOpened: 1609459200000,
          lastOpened: 1609459200000,
          promptsShown: { ci1: 1609459200000 },
        })
      },
    )

    cy.visitApp()
    cy.contains('Configure CI').should('not.exist')
  })
})
