import type { SinonStub } from 'sinon'
import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import { getPathForPlatform } from '../../src/paths'
// import { snapshotAUTPanel } from './support/snapshot-aut-panel'

describe('Cypress In Cypress CT', { viewportWidth: 1500, defaultCommandTimeout: 10000 }, () => {
  context('default config', () => {
    beforeEach(() => {
      cy.scaffoldProject('cypress-in-cypress')
      cy.findBrowsers()
      cy.openProject('cypress-in-cypress', ['--component'])
      cy.startAppServer('component')
    })

    it('test component', () => {
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('TestComponent.spec').click()
      cy.waitForSpecToFinish()
      cy.get('[data-model-state="passed"]').should('contain', 'renders the test component')

      cy.findByTestId('aut-url-input').should('be.disabled')
      cy.findByTestId('select-browser').click()

      cy.contains('Canary').should('be.visible')
      // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435
      // snapshotAUTPanel('browsers open')
      cy.findByTestId('viewport-size').should('be.visible')

      cy.get('body').click()

      cy.findByTestId('playground-activator').click()
      cy.findByTestId('playground-selector').clear()
      cy.findByTestId('playground-selector').type('[data-cy-root]')

      // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435
      // snapshotAUTPanel('cy.get selector')

      cy.findByTestId('playground-num-elements').contains('1 match')

      cy.window().then((win) => cy.spy(win.console, 'log'))
      cy.findByTestId('playground-print').click().window().then((win) => {
        expect(win.console.log).to.have.been.calledWith('%cCommand:  ', 'font-weight: bold', 'cy.get(\'[data-cy-root]\')')
      })

      cy.findByLabelText('Selector methods').click()
      cy.findByRole('menuitem', { name: 'cy.contains' }).click()

      cy.findByTestId('playground-selector').clear().type('Component Test')

      // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435
      // snapshotAUTPanel('cy.contains selector')

      cy.findByTestId('playground-num-elements').contains('1 match')

      // Temporarily removed from CT since it doesn't work. Invert this assertion when completing https://github.com/cypress-io/cypress/issues/24549
      cy.get('.hook-open-in-ide').should('not.exist')
    })

    it('navigation between specs and other parts of the app works', () => {
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('TestComponent.spec').click()
      cy.waitForSpecToFinish()
      cy.get('[data-model-state="passed"]').should('contain', 'renders the test component')

      // go to Settings page and back to spec runner
      cy.contains('a', 'Settings').click()
      cy.contains(defaultMessages.settingsPage.device.title).should('be.visible')
      cy.contains('a', 'Specs').click()
      cy.contains('TestComponent.spec').click()
      cy.waitForSpecToFinish()
      cy.get('[data-model-state="passed"]').should('contain', 'renders the test component')

      // go to Runs page and back to spec runner
      cy.contains('a', 'Runs').click()
      cy.contains(defaultMessages.runs.connect.title).should('be.visible')
      cy.contains('a', 'Specs').click()
      cy.contains('TestComponent.spec').click()
      cy.waitForSpecToFinish()
      cy.get('[data-model-state="passed"]').should('contain', 'renders the test component')
    })

    // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23159
    it('redirects to the specs list with error if a spec is not found', { retries: 15 }, () => {
      cy.visitApp()
      cy.specsPageIsVisible()
      const { title, intro, explainer } = defaultMessages.specPage.noSpecError
      const badFilePath = 'src/DoesNotExist.spec.js'

      cy.visitApp(`/specs/runner?file=${badFilePath}`)
      cy.contains(title).should('be.visible')
      cy.contains(intro).should('be.visible')
      cy.contains(explainer).should('be.visible')
      cy.contains(getPathForPlatform(badFilePath)).should('be.visible')
      cy.location()
      .its('href')
      .should('eq', 'http://localhost:4455/__/#/specs')

      // should clear after reload
      cy.reload()
      cy.contains(title).should('not.exist')
    })

    it('redirects to the specs list with error if an open spec is not found when specs list updates', () => {
      const { title, intro, explainer } = defaultMessages.specPage.noSpecError

      const goodFilePath = 'src/TestComponent.spec.jsx'

      cy.visitApp(`/specs/runner?file=${goodFilePath}`)

      cy.contains('renders the test component').should('be.visible')

      cy.withCtx((ctx, o) => {
        ctx.actions.project.setSpecs(ctx.project.specs.filter((spec) => !spec.absolute.includes(o.path)))
      }, { path: goodFilePath }).then(() => {
        cy.contains(title).should('be.visible')
        cy.contains(intro).should('be.visible')
        cy.contains(explainer).should('be.visible')
        cy.contains(getPathForPlatform(goodFilePath)).should('be.visible')
        cy.location()
        .its('href')
        .should('eq', 'http://localhost:4455/__/#/specs')
      })
    })

    it('browser picker in runner calls mutation with current spec path', () => {
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('TestComponent.spec').click()
      cy.waitForSpecToFinish()
      cy.get('[data-model-state="passed"]').should('contain', 'renders the test component')

      cy.withCtx((ctx, o) => {
        o.sinon.stub(ctx.actions.browser, 'setActiveBrowserById')
        o.sinon.stub(ctx.actions.project, 'launchProject').resolves()
      })

      cy.get('[data-cy="select-browser"]')
      .click()

      cy.contains('Firefox')
      .click()

      cy.withCtx((ctx, o) => {
        const browserId = (ctx.actions.browser.setActiveBrowserById as SinonStub).args[0][0]
        const genId = ctx.fromId(browserId, 'Browser')

        expect(ctx.actions.browser.setActiveBrowserById).to.have.been.calledWith(browserId)
        expect(genId).to.eql('firefox-firefox-stable')
        expect(ctx.actions.project.launchProject).to.have.been.calledWith(
          ctx.coreData.currentTestingType, { shouldLaunchNewTab: false }, o.sinon.match(new RegExp('cypress\-in\-cypress\/src\/TestComponent\.spec\.jsx$')),
        )
      })
    })

    it('restarts server on devServer config change', () => {
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.get('[data-cy="spec-item"]')

      cy.withCtx(async (ctx, { sinon }) => {
        ctx.coreData.app.browserStatus = 'open'

        sinon.stub(ctx.actions.project, 'initializeActiveProject')

        const config = await ctx.file.readFileInProject('cypress.config.js')
        const newCypressConfig = config.replace(`webpackConfig: require('./webpack.config.js')`, `webpackConfig: {}`)

        await ctx.actions.file.writeFileInProject('cypress.config.js', newCypressConfig)
      })

      cy.get('[data-cy="loading-spinner"]').should('be.visible')
      cy.contains('[role="alert"]', 'Loading')

      cy.withRetryableCtx((ctx) => {
        expect(ctx.actions.project.initializeActiveProject).to.be.called
      })
    })
  })

  context('custom config', () => {
    beforeEach(() => {
      cy.scaffoldProject('cypress-in-cypress')
      cy.findBrowsers()
    })

    it('set the correct viewport values from CLI', () => {
      cy.openProject('cypress-in-cypress', ['--config', 'viewportWidth=333,viewportHeight=333', '--component'])
      cy.startAppServer('component')

      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('TestComponent.spec').click()

      cy.get('#unified-runner').should('have.css', 'width', '333px')
      cy.get('#unified-runner').should('have.css', 'height', '333px')
    })
  })
})
