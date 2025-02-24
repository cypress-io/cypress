import type { ReceivedCypressOptions } from '@packages/types'
import type { DraggablePanel } from '../../src/runner/useRunnerStyle'

const testingTypes = ['component', 'e2e'] as const

const dragHandleToClientX = (panel: DraggablePanel, x: number) => {
  return cy.get(`[data-cy="${panel}ResizeHandle"]`).trigger('mousedown', { eventConstructor: 'MouseEvent' })
  .trigger('mousemove', { clientX: x })
  .trigger('mouseup', { eventConstructor: 'MouseEvent' })
}

function startAtSpecsPage (testingType: typeof testingTypes[number]) {
  cy.scaffoldProject('cypress-in-cypress')
  cy.findBrowsers()

  openProject(testingType)

  cy.startAppServer(testingType)
  cy.visitApp()
  cy.specsPageIsVisible()
}

function openProject (testingType: typeof testingTypes[number]) {
  if (testingType === 'e2e') {
    cy.openProject('cypress-in-cypress')
  } else {
    cy.openProject('cypress-in-cypress', ['--component'])
  }
}

// For Cypress-in-Cypress tests that do not vary based on testing type
describe('Cypress in Cypress', { viewportWidth: 1500, defaultCommandTimeout: 10000 }, () => {
  testingTypes.forEach((testingType) => {
    it(`handles automation disconnects in ${testingType}`, () => {
      startAtSpecsPage(testingType)

      cy.get('[data-cy="spec-item"]').first().click()
      cy.waitForSpecToFinish()

      cy.withCtx((ctx) => {
        ctx.coreData.servers.cdpSocketServer?.emit('automation:disconnected')
      })

      cy.contains('h2', 'The Cypress extension has disconnected')

      cy.withCtx((ctx, { sinon }) => {
        sinon.stub(ctx.actions.project, 'launchProject').resolves()
      })

      cy.contains('button', 'Reload the browser').click()

      cy.withCtx((ctx) => {
        expect(ctx.actions.project.launchProject).to.have.been.called
      })

      // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435
    })

    it(`handles automation missing in ${testingType}`, () => {
      let connectedCallback: any

      startAtSpecsPage(testingType)

      cy.window().then((win) => {
        if (!win.ws) {
          throw new Error('"window.ws" is expected to be available')
        }

        const originalEmit: Function = win.ws.emit
        const stub = cy.stub(win.ws as any, 'emit')

        stub.callsFake((...args) => {
          if (args[0] === 'is:automation:client:connected') {
            connectedCallback = args[2]
          }

          originalEmit.call(win.ws, ...args)
        })
      })

      cy.get('[data-cy="spec-item"]').first().click()
      cy.waitForSpecToFinish()
      cy.get('#unified-reporter').should('be.visible').then(() => {
        connectedCallback(false)
      })

      cy.contains('h2', 'The Cypress extension is missing')

      // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435

      cy.get('[data-cy="select-browser"]').click()

      // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435

      cy.withCtx((ctx, { sinon }) => {
        sinon.stub(ctx.actions.project, 'launchProject').resolves()
      })

      cy.contains('li', 'Electron').click()

      cy.withCtx((ctx) => {
        expect(ctx.coreData.activeBrowser?.displayName).eq('Electron')
        expect(ctx.actions.project.launchProject).to.have.been.called
      })
    })

    it(`scales the AUT correctly in ${testingType}`, () => {
      const assertNoScaleShown = () => {
        // check that no message about scale % is shown,
        // meaning the AUT is at 100% scale
        cy.contains('%)').should('not.exist')
      }

      cy.scaffoldProject('cypress-in-cypress')
      cy.findBrowsers()
      openProject(testingType)
      cy.withCtx((ctx) => {
        ctx.coreData.localSettings.preferences.reporterWidth = 800
        ctx.coreData.localSettings.preferences.specListWidth = 250
        ctx.coreData.localSettings.preferences.isSpecsListOpen = false
      })

      cy.startAppServer(testingType)
      cy.visitApp()
      cy.specsPageIsVisible()

      cy.get('[data-cy="spec-item"]').first().click()
      // Let runner stabilize
      cy.get('#unified-reporter').should('be.visible')

      // validate that the width we set in `withCtx` above is the starting point
      cy.get(`[data-cy="reporter-panel"]`).invoke('outerWidth').should('eq', 800)
      // cy.percySnapshot('initial state') // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435

      cy.contains('[aria-controls=reporter-inline-specs-list]', 'Specs')
      .click({ force: true })

      // this tooltip text confirms specs list is open
      cy.contains('Collapse Specs List')

      // we will move the right-hand handle of the Reporter
      // to these positions from the left of the screen
      const dragPositions = [1000, 1090, 900, 600]

      // based on viewport sizes for CT and e2e tests in the `cypress-in-cypress`
      // projects, we expect certain scale % values to be shown
      const testingTypeExpectedScales = {
        component: ['93%', '75%'],
        e2e: ['46%', '37%', '56%', '85%'],
        componentShortViewport: '61%',
        e2eShortViewport: '46%',
        componentNarrowViewport: '40%',
        e2eNarrowViewport: '20%',
      }

      // resize the reporter using each of the dragPositions and take Percy snapshots
      dragPositions.forEach((position, index) => {
        dragHandleToClientX('panel2', position).then(() => {
          const expectedScale = testingTypeExpectedScales[testingType][index]

          // CT hits 100% scale "earlier" than E2E, so sometimes there is no expected scale
          if (expectedScale) {
            cy.contains(expectedScale).should('be.visible')
          } else {
            assertNoScaleShown()
          }

          /*
            TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435
            cy.percySnapshot(`panel 2 at ${ position } px`)
          */
        })
      })

      // now check vertical scaling with viewport resize, and take some snapshots too

      // this viewport should be tall enough to not scale even the e2e test
      cy.viewport(1500, 1300)
      cy.contains('[aria-controls=reporter-inline-specs-list]', 'Specs')
      .click({ force: true })

      // make sure the reporter is narrow enough (should be, but don't want to depend on leftover state from above)
      dragHandleToClientX('panel2', 400).then(() => {
        // but we have to also collapse the Specs List to remove any reason to scale horizontally

        // this tooltip text confirms specs list is closed
        cy.contains('Expand Specs List')

        assertNoScaleShown()
        // cy.percySnapshot('tall viewport') // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435

        cy.viewport(1500, 400)
        cy.contains(testingTypeExpectedScales[`${ testingType }ShortViewport`]).should('be.visible')
        // cy.percySnapshot('short viewport') // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435
      })

      cy.get('[data-cy="select-browser"]').as('selectBrowser')

      cy.viewport(500, 600)
      cy.get('@selectBrowser').scrollIntoView()
      cy.get('@selectBrowser').should('be.visible') // with no specs list open, we should see this by scrolling

      dragHandleToClientX('panel2', 200).then(() => {
        cy.contains('Chrome 1').should('be.visible')
      })

      cy.contains('[aria-controls=reporter-inline-specs-list]', 'Specs')
      .click({ force: true })

      cy.get('@selectBrowser').should('not.be.visible')
      cy.get('@selectBrowser').scrollIntoView()
      cy.get('@selectBrowser').should('not.be.visible') // with specs list open, scrolling is not enough to see this

      dragHandleToClientX('panel1', 130)
      cy.get('@selectBrowser')
      .should('be.visible') // now that we have reduced the specs list, we should be able to see this

      cy.contains(testingTypeExpectedScales[`${ testingType }NarrowViewport`])
    })

    it(`resets selector playground validity when selecting element with playground selector in ${testingType}`, () => {
      startAtSpecsPage(testingType)

      const spec = testingType === 'e2e' ? 'dom-content.spec.js' : 'TestComponent.spec.jsx'

      cy.get('[data-cy="spec-item"]').contains(spec).click()
      cy.get('.passed > .num').should('contain', 1)

      cy.get('[data-cy="playground-activator"]').click()
      cy.get('[data-cy="playground-selector"]').clear()
      cy.get('[data-cy="playground-num-elements"]').contains('Invalid')
      cy.get('iframe.aut-iframe').its('0.contentDocument.documentElement').then(cy.wrap).within(() => {
        cy.get('body').click()
      })

      cy.get('[data-cy="playground-num-elements"]').contains('1 match')
    })

    it(`hides the command log when hideCommandLog is set in open mode for ${testingType}`, () => {
      cy.scaffoldProject('cypress-in-cypress')
      cy.findBrowsers()
      cy.openProject('cypress-in-cypress')
      cy.startAppServer()
      cy.withCtx(async (ctx, o) => {
        const config = ctx._apis.projectApi.getConfig()

        o.sinon.stub(ctx._apis.projectApi, 'getConfig').returns({
          ...config,
          hideCommandLog: true,
        } as ReceivedCypressOptions)
      })

      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('dom-content.spec').click()

      cy.findByTestId('aut-url-input').invoke('val').should('contain', 'http://localhost:4455/cypress/e2e/dom-content.html')
      cy.findByLabelText('Stats').should('not.exist')
      cy.findByTestId('specs-list-panel').should('not.be.visible')
      cy.findByTestId('reporter-panel').should('not.be.visible')
      cy.findByTestId('sidebar').should('be.visible')
    })

    it(`checks that specs load when devServer configuration is not set in open mode for ${testingType}`, () => {
      cy.scaffoldProject('cypress-in-cypress')
      cy.findBrowsers()
      cy.openProject('cypress-in-cypress')
      cy.startAppServer()
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('dom-content.spec').should('exist')
      cy.withCtx(async (ctx, o) => {
        ctx.coreData.app.browserStatus = 'open'

        let config = await ctx.actions.file.readFileInProject('cypress.config.js')

        let oldFramework = `framework: 'react',`
        let oldBundler = `bundler: 'webpack',`
        let oldWebPackConfig = `webpackConfig: require('./webpack.config.js'),`

        config = config.replace(oldFramework, ``).replace(oldBundler, ``).replace(oldWebPackConfig, ``).replace(`devServer: {`, ``).replace(/},/i, ``)

        await ctx.actions.file.writeFileInProject('cypress.config.js', config)

        o.sinon.stub(ctx.actions.browser, 'closeBrowser')
        o.sinon.stub(ctx.actions.browser, 'relaunchBrowser')
      })

      cy.get('[data-cy="loading-spinner"]').should('be.visible')
      cy.get('[data-cy="loading-spinner"]').should('not.exist')

      // We navigate to another page to ensure the specs page re-renders with the updated changes in cypress config
      // so we can assert on an up to date specs page when we navigate back to it.

      cy.get('[href="#/runs"]').click()
      cy.location('hash').should('eq', '#/runs')
      cy.get('[href="#/specs"').click()
      cy.contains('accounts_list.spec').should('be.visible')
    })
  })

  it('restarts browser if there is a change on the config file affecting the browser', () => {
    startAtSpecsPage('e2e')
    cy.get('[data-cy="spec-item"]')

    cy.withCtx(async (ctx, o) => {
      ctx.coreData.app.browserStatus = 'open'

      let config = await ctx.actions.file.readFileInProject('cypress.config.js')

      config = config.replace(`e2e: {`, `e2e: {\n  chromeWebSecurity: false,\n`)

      await ctx.actions.file.writeFileInProject('cypress.config.js', config)

      o.sinon.stub(ctx.actions.browser, 'closeBrowser')
      o.sinon.stub(ctx.actions.browser, 'relaunchBrowser')
    })

    cy.get('[data-cy="loading-spinner"]').should('be.visible')
    cy.contains('[role="alert"]', 'Loading')

    cy.withRetryableCtx((ctx) => {
      expect(ctx.actions.browser.closeBrowser).to.be.called
      expect(ctx.actions.browser.relaunchBrowser).to.be.called
    })
  })

  it('restarts browser if there is a before:browser:launch task and there is a change on the config', () => {
    startAtSpecsPage('e2e')

    cy.withCtx(async (ctx, o) => {
      ctx.coreData.app.browserStatus = 'open'

      let config = await ctx.actions.file.readFileInProject('cypress.config.js')

      config = config.replace(`e2e: {`, `e2e: {\n  setupNodeEvents(on) {\n on('before:browser:launch', () => {})\n},\n`)
      await ctx.actions.file.writeFileInProject('cypress.config.js', config)
    })

    cy.get('[data-cy="spec-item"]')

    cy.withCtx(async (ctx, o) => {
      ctx.coreData.app.browserStatus = 'open'

      let config = await ctx.actions.file.readFileInProject('cypress.config.js')

      config = config.replace(`e2e: {`, `e2e: {\n  viewportHeight: 600,\n`)
      await ctx.actions.file.writeFileInProject('cypress.config.js', config)

      o.sinon.stub(ctx.actions.browser, 'closeBrowser')
      o.sinon.stub(ctx.actions.browser, 'relaunchBrowser')
    })

    cy.get('[data-cy="loading-spinner"]').should('be.visible')
    cy.contains('[role="alert"]', 'Loading')

    cy.withRetryableCtx((ctx) => {
      expect(ctx.actions.browser.closeBrowser).to.be.called
      expect(ctx.actions.browser.relaunchBrowser).to.be.called
    })
  })

  it('restarts server if there is a change on the config file affecting the server', () => {
    startAtSpecsPage('e2e')
    cy.get('[data-cy="spec-item"]')

    cy.withCtx(async (ctx, o) => {
      ctx.coreData.app.browserStatus = 'open'
      o.sinon.stub(ctx.actions.project, 'initializeActiveProject')

      let config = await ctx.actions.file.readFileInProject('cypress.config.js')

      config = config.replace(`{`, `{\n  watchForFileChanges: false,\n`)
      await ctx.actions.file.writeFileInProject('cypress.config.js', config)
    })

    cy.get('[data-cy="loading-spinner"]').should('be.visible')
    cy.contains('[role="alert"]', 'Loading')

    cy.withRetryableCtx((ctx) => {
      expect(ctx.actions.project.initializeActiveProject).to.be.called
    })
  })

  it('restarts server if baseUrl is updated in the config file', () => {
    startAtSpecsPage('e2e')
    cy.get('[data-cy="spec-item"]')

    cy.withCtx(async (ctx, o) => {
      ctx.coreData.app.browserStatus = 'open'
      o.sinon.stub(ctx.actions.project, 'initializeActiveProject')

      let config = await ctx.actions.file.readFileInProject('cypress.config.js')

      config = config.replace(`  e2e: {`, `  e2e: {\n  baseUrl: 'https://example.cypress.io',\n`)
      await ctx.actions.file.writeFileInProject('cypress.config.js', config)
    })

    cy.get('[data-cy="loading-spinner"]').should('be.visible')
    cy.contains('[role="alert"]', 'Loading')

    cy.withRetryableCtx((ctx) => {
      expect(ctx.actions.project.initializeActiveProject).to.be.called
    })
  })

  describe('runSpec mutation', () => {
    it('should trigger expected spec from POST', () => {
      startAtSpecsPage('e2e')

      cy.contains('E2E specs').should('be.visible')

      cy.withCtx(async (ctx) => {
        const currentProject = ctx.currentProject?.replaceAll('\\', '/')
        const specPath = `${currentProject}/cypress/e2e/dom-content.spec.js`
        const url = `http://127.0.0.1:${ctx.coreData.servers.gqlServerPort}/__launchpad/graphql?`
        const payload = `{"query":"mutation{\\nrunSpec(specPath:\\"${specPath}\\"){\\n__typename\\n... on RunSpecResponse{\\ntestingType\\nbrowser{\\nid\\nname\\n}\\nspec{\\nid\\nname\\n}\\n}\\n}\\n}","variables":null}`

        ctx.coreData.app.browserStatus = 'open'

        /*
        Note: If this test starts failing, this fetch is the likely culprit.
        Validate the GQL payload above is still valid by logging the fetch response JSON
        */

        await ctx.util.fetch(
          url,
          {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
            },
            body: payload,
          },
        )
      })

      cy.contains('Dom Content').should('be.visible')
    })
  })
})
