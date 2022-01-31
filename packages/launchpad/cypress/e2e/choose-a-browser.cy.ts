describe('Choose a Browser Page', () => {
  beforeEach(() => {
    cy.scaffoldProject('launchpad')
  })

  describe('System Browsers Detected', () => {
    beforeEach(() => {
      cy.findBrowsers({
        filter: (browser) => {
          return Cypress._.includes(['chrome', 'firefox', 'electron', 'edge'], browser.name) && browser.channel === 'stable'
        },
      })
    })

    it('preselects browser that is provided through the command line', () => {
      cy.openProject('launchpad', ['--e2e', '--browser', 'edge'])

      cy.visitLaunchpad()

      cy.get('h1').should('contain', 'Choose a Browser')

      cy.findByRole('radio', { name: 'Edge v8', checked: true })

      cy.percySnapshot()
    })

    it('shows warning when launched with --browser name that cannot be matched to found browsers', () => {
      cy.openProject('launchpad', ['--e2e', '--browser', 'doesNotExist'])
      cy.visitLaunchpad()

      cy.get('h1').should('contain', 'Choose a Browser')
      cy.get('[data-cy="alert-header"]').should('contain', 'Warning: Browser Not Found')
      cy.get('[data-cy="alert-body"]')
      .should('contain', 'The specified browser was not found on your system or is not supported by Cypress: doesNotExist')

      cy.get('[data-cy="alert-body"]').within(() => {
        cy.validateExternalLink({
          name: 'use a custom browser',
          href: 'https://on.cypress.io/customize-browsers',
        })

        cy.validateExternalLink({
          name: 'how to troubleshoot launching browsers',
          href: 'https://on.cypress.io/troubleshooting-launching-browsers',
        })
      })

      // Ensure warning can be dismissed
      cy.get('[data-cy="alert-suffix-icon"]').click()
      cy.get('[data-cy="alert-header"]').should('not.exist')
    })

    it('shows warning when launched with --browser path option that cannot be matched to found browsers', () => {
      cy.openProject('launchpad', ['--e2e', '--browser', '/path/does/not/exist'])

      cy.visitLaunchpad()

      cy.get('h1').should('contain', 'Choose a Browser')

      cy.get('[data-cy="alert-header"]').should('contain', 'Warning: Browser Not Found')
      cy.get('[data-cy="alert-body"]')
      .should('contain', 'We could not identify a known browser at the path you specified: /path/does/not/exist')
      .should('contain', 'spawn /path/does/not/exist ENOENT')
      .validateExternalLink({
        name: 'how to troubleshoot launching browsers',
        href: 'https://on.cypress.io/troubleshooting-launching-browsers',
      })

      cy.percySnapshot()

      // Ensure warning can be dismissed
      cy.get('[data-cy="alert-suffix-icon"]').click()
      cy.get('[data-cy="alert-header"]').should('not.exist')
    })

    it('shows installed browsers with their relevant properties', () => {
      cy.openProject('launchpad', ['--e2e'])

      cy.visitLaunchpad()

      cy.get('h1').should('contain', 'Choose a Browser')

      cy.findByRole('radio', { name: 'Chrome v1' })

      cy.findByRole('radio', { name: 'Firefox v5' })

      cy.findByRole('radio', { name: 'Electron v12' })

      cy.findByRole('radio', { name: 'Edge v8' })
    })

    it('performs mutation to launch selected browser when launch button is pressed', () => {
      cy.openProject('launchpad', ['--e2e'])

      cy.visitLaunchpad()

      cy.get('h1').should('contain', 'Choose a Browser')

      cy.contains('button', 'Start E2E Testing in Chrome').as('launchButton')

      // Stub out response to prevent browser launch but not break internals
      cy.intercept('mutation-OpenBrowser_LaunchProject', {
        body: {
          data: {
            launchOpenProject: true,
            setProjectPreferences: {
              currentProject: {
                id: 'test-id',
                title: 'launchpad',
                __typename: 'CurrentProject',
              },
              __typename: 'Query',
            },
          },
        },
        delay: 500,
      }).as('launchProject')

      cy.get('@launchButton').click()
      cy.contains('button', 'Opening E2E Testing in Chrome')

      cy.wait('@launchProject').then(({ request }) => {
        expect(request?.body.variables.testingType).to.eq('e2e')
      })
    })

    it('performs mutation to change selected browser when browser item is clicked', () => {
      cy.openProject('launchpad', ['--e2e'])

      cy.visitLaunchpad()

      cy.get('h1').should('contain', 'Choose a Browser')

      cy.findByRole('radio', { name: 'Chrome v1', checked: true }).as('chromeItem')
      cy.findByRole('radio', { name: 'Firefox v5', checked: false }).as('firefoxItem')

      cy.contains('button', 'Start E2E Testing in Chrome').should('be.visible')

      cy.intercept('mutation-OpenBrowserList_SetBrowser').as('setBrowser')

      cy.get('@firefoxItem').click().find('label').then(($label) => {
        cy.wait('@setBrowser').its('request.body.variables.id').should('eq', $label.attr('for'))
      })

      cy.findByRole('radio', { name: 'Chrome v1', checked: false })
      cy.findByRole('radio', { name: 'Firefox v5', checked: true })

      cy.contains('button', 'Start E2E Testing in Firefox').should('be.visible')
    })

    it('prevents calling launchProject multiple times', () => {
      cy.openProject('launchpad', ['--e2e'])

      cy.visitLaunchpad()

      cy.get('h1').should('contain', 'Choose a Browser')

      cy.withCtx((ctx) => {
        ctx.actions.project.launchProject = sinon.spy()
      })

      cy.intercept('mutation-OpenBrowser_LaunchProject', cy.stub().as('launchProject'))
      cy.contains('button', 'Start E2E Testing in Chrome').dblclick()

      cy.get('@launchProject').its('callCount').should('equal', 1)
    })

    it('performs mutation to close browser', () => {
      cy.intercept('query-OpenBrowser', (req) => {
        req.on('before:response', (res) => {
          res.body.data.currentProject.isBrowserOpen = true
        })
      })

      cy.openProject('launchpad', ['--e2e'])

      cy.visitLaunchpad()

      cy.contains('button', 'Running Chrome')

      cy.intercept('mutation-OpenBrowser_CloseBrowser').as('closeBrowser')
      cy.contains('button', 'Close').click()
      cy.wait('@closeBrowser')
    })

    it('performs mutation to focus open browser when focus button is pressed', () => {
      cy.openProject('launchpad', ['--e2e'])

      cy.visitLaunchpad()

      cy.get('h1').should('contain', 'Choose a Browser')

      cy.contains('button', 'Start E2E Testing in Chrome').as('launchButton')

      // Stub out response to prevent browser launch but not break internals
      cy.intercept('mutation-OpenBrowser_LaunchProject', {
        body: {
          data: {
            launchOpenProject: true,
            setProjectPreferences: {
              currentProject: {
                id: 'test-id',
                title: 'launchpad',
                __typename: 'CurrentProject',
              },
              __typename: 'Query',
            },
          },
        },
        delay: 500,
      }).as('launchProject')

      cy.get('@launchButton').click()
      cy.contains('button', 'Opening E2E Testing in Chrome').should('be.visible')

      cy.wait('@launchProject').then(({ request }) => {
        expect(request?.body.variables.testingType).to.eq('e2e')
      })

      cy.intercept('query-OpenBrowser', (req) => {
        req.on('before:response', (res) => {
          res.body.data.currentProject.isBrowserOpen = true
        })
      })

      cy.contains('button', 'Focus').as('focusButton')

      cy.intercept('mutation-OpenBrowser_FocusActiveBrowserWindow').as('focusBrowser')

      cy.withCtx((ctx) => {
        sinon.spy(ctx.actions.browser, 'focusActiveBrowserWindow')
      })

      cy.get('@focusButton').click()

      cy.wait('@focusBrowser').then(() => {
        cy.withCtx((ctx) => {
          expect(ctx.actions.browser.focusActiveBrowserWindow).to.be.called
        })
      })
    })
  })

  describe('No System Browsers Detected', () => {
    it('shows single electron browser option when no system browsers are detected and process is running in electron', () => {
      cy.log('This test simulates the Electron browser injection performed by server.getBrowsers')
      cy.findBrowsers({
        filter: (browser) => {
          return browser.name === 'electron'
        },
      })

      cy.openProject('launchpad', ['--e2e'])

      cy.visitLaunchpad()

      cy.get('h1').should('contain', 'Choose a Browser')

      cy.get('[data-cy="open-browser-list"]').children().should('have.length', 1)

      cy.findByRole('radio', { name: 'Electron v12', checked: true })
      cy.percySnapshot()
    })
  })
})
