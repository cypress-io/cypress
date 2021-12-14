import type { FoundBrowser } from '@packages/types/src'

describe('Choose a Browser Page', () => {
  // Walks through setup pages to get to browser selection
  const stepThroughConfigPages = () => {
    cy.get('h1').should('contain', 'Configuration Files')
    cy.contains('Continue').click()
    cy.get('h1').should('contain', 'Initializing Config...')
    cy.contains('Next Step').click()
  }

  // Mocks server's browser detection with known list
  const setupMockBrowsers = function () {
    cy.withCtx(async (ctx, o) => {
      const mockBrowsers = [{
        channel: 'stable',
        displayName: 'Chrome',
        family: 'chromium',
        name: 'chrome',
        version: '1.2.333.445',
        path: '/test/chrome/path',
        majorVersion: '1',
      }, {
        channel: 'stable',
        displayName: 'Firefox',
        family: 'firefox',
        name: 'firefox',
        path: '/test/firefox/path',
        version: '2.3.444',
        majorVersion: '2',
      }, {
        channel: 'stable',
        displayName: 'Electron',
        family: 'chromium',
        name: 'electron',
        path: '/test/electron/path',
        version: '3.4.555.66',
        majorVersion: '3',
      }, {
        channel: 'stable',
        displayName: 'Edge',
        family: 'chromium',
        name: 'edge',
        path: '/test/edge/path',
        version: '4.5.666.77',
        majorVersion: '4',
      }] as FoundBrowser[]

      sinon.stub(ctx._apis.appApi, 'getBrowsers').resolves(mockBrowsers)
    })
  }

  // Force the server to return no detected browsers
  const setupZeroMockBrowsers = function () {
    cy.withCtx(async (ctx, o) => {
      sinon.stub(ctx._apis.appApi, 'getBrowsers').resolves([])
    })
  }

  // Creates and returns aliases for browsers found on the DOM
  const getBrowserAliases = function () {
    cy.get('[data-cy="open-browser-list"] [data-selected-browser]').eq(0).as('chromeRadioOption')
    cy.get('[data-cy="open-browser-list"] [data-selected-browser]').eq(1).as('firefoxRadioOption')
    cy.get('[data-cy="open-browser-list"] [data-selected-browser]').eq(2).as('electronRadioOption')
    cy.get('[data-cy="open-browser-list"] [data-selected-browser]').eq(3).as('edgeRadioOption')

    return {
      chrome: '@chromeRadioOption',
      firefox: '@firefoxRadioOption',
      electron: '@electronRadioOption',
      edge: '@edgeRadioOption',
    }
  }

  beforeEach(() => {
    cy.scaffoldProject('launchpad')
  })

  describe('System Browsers Detected', () => {
    beforeEach(() => {
      setupMockBrowsers()
    })

    it('preselects browser that is provided through the command line', () => {
      cy.openProject('launchpad', ['--e2e', '--browser', 'edge'])

      cy.visitLaunchpad()
      stepThroughConfigPages()

      cy.get('h1').should('contain', 'Choose a Browser')

      cy.get('[data-cy="open-browser-list"] [data-selected-browser="true"]')
      .should('contain', 'Edge')
    })

    it('shows warning when launched with --browser name that cannot be matched to found browsers', () => {
      cy.openProject('launchpad', ['--e2e', '--browser', 'doesNotExist'])
      cy.visitLaunchpad()

      stepThroughConfigPages()

      cy.get('h1').should('contain', 'Choose a Browser')
      cy.get('[data-cy="alert-header"]').should('contain', 'Warning: Browser Not Found')
      cy.get('[data-cy="alert-body"]')
      .should('contain', 'The specified browser was not found on your system or is not supported by Cypress: doesNotExist')

      cy.get('[data-cy="alert-body"] a').eq(1)
      .should('have.attr', 'href')
      .and('equal', 'https://on.cypress.io/troubleshooting-launching-browsers')

      // Ensure warning can be dismissed
      cy.get('[data-cy="alert-suffix-icon"]').click()
      cy.get('[data-cy="alert-header"]').should('not.exist')
    })

    it('shows warning when launched with --browser path option that cannot be matched to found browsers', () => {
      cy.openProject('launchpad', ['--e2e', '--browser', '/path/does/not/exist'])

      cy.visitLaunchpad()

      stepThroughConfigPages()

      cy.get('h1').should('contain', 'Choose a Browser')

      cy.get('[data-cy="alert-header"]').should('contain', 'Warning: Browser Not Found')
      cy.get('[data-cy="alert-body"]')
      .should('contain', 'We could not identify a known browser at the path you specified: /path/does/not/exist')
      .should('contain', 'spawn /path/does/not/exist ENOENT')

      cy.get('[data-cy="alert-body"] a')
      .should('have.attr', 'href')
      .and('equal', 'https://on.cypress.io/troubleshooting-launching-browsers')

      // Ensure warning can be dismissed
      cy.get('[data-cy="alert-suffix-icon"]').click()
      cy.get('[data-cy="alert-header"]').should('not.exist')
    })

    it('shows installed browsers with their relevant properties', () => {
      cy.openProject('launchpad', ['--e2e'])

      cy.visitLaunchpad()

      stepThroughConfigPages()

      cy.get('h1').should('contain', 'Choose a Browser')

      const { chrome, firefox, electron, edge } = getBrowserAliases()

      cy.get(chrome)
      .should('contain', 'Chrome')
      .and('contain', 'v1.x')
      .find('img')
      .should('have.attr', 'alt', 'Chrome')

      cy.get(firefox)
      .should('contain', 'Firefox')
      .and('contain', 'v2.x')
      .find('img')
      .should('have.attr', 'alt', 'Firefox')

      cy.get(electron)
      .should('contain', 'Electron')
      .and('contain', 'v3.x')
      .find('img')
      .should('have.attr', 'alt', 'Electron')

      cy.get(edge)
      .should('contain', 'Edge')
      .and('contain', 'v4.x')
      .find('img')
      .should('have.attr', 'alt', 'Edge')
    })

    it('performs mutation to launch selected browser when launch button is pressed', () => {
      cy.openProject('launchpad', ['--e2e'])

      cy.visitLaunchpad()

      stepThroughConfigPages()

      cy.get('h1').should('contain', 'Choose a Browser')

      cy.contains('Launch Chrome').as('launchButton')

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
      }).as('launchProject')

      cy.get('@launchButton').click()

      cy.wait('@launchProject').then(({ request }) => {
        expect(request?.body.variables.browserPath).to.contain('/test/chrome/path')
        expect(request?.body.variables.testingType).to.eq('e2e')
      })
    })

    it('performs mutation to change selected browser when browser item is clicked', () => {
      cy.openProject('launchpad', ['--e2e'])

      cy.visitLaunchpad()
      stepThroughConfigPages()

      cy.get('h1').should('contain', 'Choose a Browser')

      const { chrome, firefox } = getBrowserAliases()

      cy.get(chrome).should('have.attr', 'data-selected-browser', 'true')
      cy.get(firefox).should('have.attr', 'data-selected-browser', 'false')

      cy.contains('Launch Chrome').should('be.visible')

      cy.intercept('mutation-OpenBrowserList_SetBrowser').as('setBrowser')

      cy.get(firefox).click().then(($element) => {
        cy.wait('@setBrowser').its('request.body.variables.id').should('eq', $element.attr('data-browser-id'))
      })

      cy.get(chrome)
      .should('have.attr', 'data-selected-browser', 'false')

      cy.get(firefox)
      .should('have.attr', 'data-selected-browser', 'true')

      cy.contains('Launch Firefox').should('be.visible')
    })
  })

  describe('No System Browsers Detected', () => {
    beforeEach(() => {
      setupZeroMockBrowsers()
    })

    it('does not show browser list when no browsers are detected', () => {
      cy.openProject('launchpad', ['--e2e'])

      cy.visitLaunchpad()

      stepThroughConfigPages()

      cy.get('h1').should('contain', 'Choose a Browser')

      cy.get('[data-cy="open-browser-list"]').children().should('have.length', 0)
      cy.get('button').contains('Back').should('be.visible').and('not.be.disabled')
    })
  })
})
