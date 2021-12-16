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

      cy.findByTestId('app-header-bar').should('be.visible').and('contain', 'Specs-Index')
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

        cy.findByTestId('top-nav-active-browser').should('contain', 'Firefox v5')
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

        cy.findByTestId('top-nav-active-browser').should('contain', 'Chrome v1')
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

        cy.findByTestId('top-nav-cypress-version-current-link').should('have.attr', 'href', 'https://github.com/cypress-io/cypress/releases/tag/v10.0.0')
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

        cy.findByTestId('update-hint').findByRole('link', { name: '10.1.0' })
        .should('have.attr', 'href', 'https://github.com/cypress-io/cypress/releases/tag/v10.1.0')

        cy.findByTestId('update-hint').findByText('Latest')

        cy.findByTestId('cypress-update-popover').findByRole('button', { name: 'Update to 10.1.0' })

        cy.findByTestId('current-hint').findByRole('link', { name: '10.0.0' })
        .should('have.attr', 'href', 'https://github.com/cypress-io/cypress/releases/tag/v10.0.0')

        cy.findByTestId('current-hint').findByText('Installed')

        cy.findByTestId('cypress-update-popover').findByRole('link', { name: 'See all releases' })
        .should('have.attr', 'href', 'https://github.com/cypress-io/cypress/releases')
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

        cy.findByRole('dialog', { name: 'Upgrade to Cypress 10.1.0 Need help?' }).as('upgradeModal')
        .should('contain', 'You are currently running Version 10.0.0 of Cypress')
        .and('contain', 'npm install --save-dev cypress@10.1.0')

        cy.get('@upgradeModal').findByRole('button', { name: 'Close' }).click()

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

    it('shows shows popover with additional doc links', () => {
      cy.get('@docsButton').click().should('have.attr', 'aria-expanded', 'true')

      cy.findByRole('heading', { name: 'Getting Started', level: 2 })
      cy.findByRole('heading', { name: 'References', level: 2 })
      cy.findByRole('heading', { name: 'Run in CI/CD', level: 2 })

      cy.findByRole('link', { name: 'Write your first test' }).should('have.attr', 'href', 'https://on.cypress.io/writing-first-test?utm_medium=Docs+Menu&utm_content=First+Test')
      cy.findByRole('link', { name: 'Testing your app' }).should('have.attr', 'href', 'https://on.cypress.io/testing-your-app?utm_medium=Docs+Menu&utm_content=Testing+Your+App')
      cy.findByRole('link', { name: 'Organizing Tests' }).should('have.attr', 'href', 'https://on.cypress.io/writing-and-organizing-tests?utm_medium=Docs+Menu&utm_content=Organizing+Tests')

      cy.findByRole('link', { name: 'Best Practices' }).should('have.attr', 'href', 'https://on.cypress.io/best-practices?utm_medium=Docs+Menu&utm_content=Best+Practices')
      cy.findByRole('link', { name: 'Configuration' }).should('have.attr', 'href', 'https://on.cypress.io/configuration?utm_medium=Docs+Menu&utm_content=Configuration')
      cy.findByRole('link', { name: 'API' }).should('have.attr', 'href', 'https://on.cypress.io/api?utm_medium=Docs+Menu&utm_content=API')

      cy.findByRole('link', { name: 'Run tests faster' }).should('have.attr', 'href', 'https://on.cypress.io/parallelization?utm_medium=Docs+Menu&utm_content=Parallelization')

      cy.findByRole('button', { name: 'Set up CI' }).click()
      cy.findByText('Configure CI').should('be.visible')
      cy.findByRole('button', { name: 'Close' }).click()

      cy.findByRole('button', { name: 'Smart Orchestration' }).click()
      cy.findByText('Run tests faster in CI').should('be.visible')
      cy.findByRole('button', { name: 'Close' }).click()
    })
  })

  describe('Login', () => {
    context('user logged in', () => {
      beforeEach(() => {
        cy.findBrowsers()
        cy.openProject('launchpad')
        cy.startAppServer()
        cy.loginUser()
        cy.visitApp()

        cy.findByTestId('app-header-bar').findByRole('button', { name: 'Log In', expanded: false }).as('logInButton')
      })

      it('shows user in top nav when logged in', () => {
        cy.get('@logInButton').click()

        cy.findByTestId('login-panel').contains('Test User').should('be.visible')
        cy.findByTestId('login-panel').contains('test@example.com').should('be.visible')
        cy.findByRole('link', { name: 'Profile Settings' }).should('be.visible').and('have.attr', 'href', 'https://on.cypress.io/dashboard/profile')

        cy.intercept('mutation-Logout').as('logout')

        cy.findByRole('button', { name: 'Log Out' }).should('be.visible').click()

        cy.wait('@logout')
      })
    })

    context('user not logged in', () => {
      beforeEach(() => {
        cy.findBrowsers()
        cy.openProject('launchpad')
        cy.startAppServer()
        cy.visitApp()

        cy.findByTestId('app-header-bar').findByRole('button', { name: 'Log In' }).as('logInButton')
      })

      it('shows log in modal when button is pressed', () => {
        cy.get('@logInButton').click()

        cy.findByRole('dialog', { name: 'Log In To Cypress' }).as('logInModal')
        cy.get('@logInModal').findByRole('button', { name: 'Log In' })
        cy.get('@logInModal').findByRole('button', { name: 'Close' }).click()
      })
    })
  })
})
