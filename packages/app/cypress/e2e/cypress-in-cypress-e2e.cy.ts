import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import { snapshotAUTPanel } from './support/snapshot-aut-panel'
import { getPathForPlatform } from '../../src/paths'

describe('Cypress In Cypress E2E', { viewportWidth: 1500, defaultCommandTimeout: 10000 }, () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.findBrowsers()
    cy.openProject('cypress-in-cypress')
    cy.startAppServer()
  })

  it('test e2e', () => {
    cy.visitApp()
    cy.contains('dom-content.spec').click()
    cy.location().should((location) => {
      expect(location.hash).to.contain('dom-content.spec')
    })

    cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')
    cy.findByTestId('aut-url').should('be.visible')
    cy.findByTestId('playground-activator').should('be.visible')
    cy.findByTestId('select-browser').click()

    cy.contains('Canary').should('be.visible')
    cy.findByTestId('select-browser').click()
    cy.get('[data-cy="viewport"]').click()

    cy.contains('Chrome 1')
    .focus()
    .type('{esc}')

    snapshotAUTPanel('browsers open')

    cy.contains('Canary').should('be.hidden')

    cy.get('[data-cy="viewport"]').click()
    cy.contains('The viewport determines the width and height of your application. By default the viewport will be 1000px by 660px for End-to-end Testing unless specified by a cy.viewport command.')
    .should('be.visible')

    snapshotAUTPanel('viewport info open')

    cy.get('body').click()

    cy.findByTestId('playground-activator').click()
    cy.findByTestId('playground-selector').clear().type('li')

    snapshotAUTPanel('cy.get selector')

    cy.findByTestId('playground-num-elements').contains('3 Matches')

    // This validates that each matching element is covered by the playground highlighting
    cy.get('iframe.aut-iframe').its('0.contentDocument.body').then(cy.wrap).within(() => {
      cy.get('li').each(($highlightedItem) => {
        const el = $highlightedItem[0]
        const rect = el.getBoundingClientRect()

        const elAtPoint = el.ownerDocument.elementFromPoint(rect.left, rect.top)

        expect(el).not.eq(elAtPoint)
      })
    })

    cy.findByLabelText('Selector Methods').click()
    cy.findByRole('menuitem', { name: 'cy.contains' }).click()

    cy.findByTestId('playground-selector').clear().type('Item 1')

    snapshotAUTPanel('cy.contains selector')

    cy.findByTestId('playground-num-elements').contains('1 Match')

    cy.window().then((win) => cy.spy(win.console, 'log'))
    cy.findByTestId('playground-print').click().window().then((win) => {
      expect(win.console.log).to.have.been.calledWith('%cCommand:  ', 'font-weight: bold', 'cy.contains(\'Item 1\')')
    })
  })

  it('navigation between specs and other parts of the app works', () => {
    cy.visitApp()
    cy.contains('dom-content.spec').click()
    cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')

    // go to Settings page and back to spec runner
    cy.contains('a', 'Settings').click()
    cy.contains(defaultMessages.settingsPage.device.title).should('be.visible')
    cy.contains('a', 'Specs').click()
    cy.contains('dom-content.spec').click()
    cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')

    // go to Runs page and back to spec runner
    cy.contains('a', 'Runs').click()
    cy.contains(defaultMessages.runs.connect.title).should('be.visible')
    cy.contains('a', 'Specs').click()
    cy.contains('dom-content.spec').click()
    cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')
  })

  it('redirects to the specs list with error if a spec is not found when navigating', () => {
    const { noSpecErrorTitle, noSpecErrorIntro, noSpecErrorExplainer } = defaultMessages.specPage
    const badFilePath = 'cypress/e2e/does-not-exist.spec.js'

    cy.visitApp(`/specs/runner?file=${getPathForPlatform(badFilePath)}`)
    cy.contains(noSpecErrorTitle).should('be.visible')
    cy.contains(noSpecErrorIntro).should('be.visible')
    cy.contains(noSpecErrorExplainer).should('be.visible')
    cy.contains(getPathForPlatform(badFilePath)).should('be.visible')
    cy.location()
    .its('href')
    .should('eq', 'http://localhost:4455/__/#/specs')

    cy.percySnapshot()

    // should clear after reload
    cy.reload()
    cy.contains(noSpecErrorTitle).should('not.exist')
  })

  it('redirects to the specs list with error if an open spec is not found when specs list updates', () => {
    const { noSpecErrorTitle, noSpecErrorIntro, noSpecErrorExplainer } = defaultMessages.specPage

    const goodFilePath = 'cypress/e2e/dom-content.spec.js'

    cy.visit(`http://localhost:4455/__/#/specs/runner?file=${getPathForPlatform(goodFilePath)}`)

    cy.contains('Dom Content').should('be.visible')

    cy.withCtx((ctx, o) => {
      ctx.actions.project.setSpecs(ctx.project.specs.filter((spec) => !spec.absolute.includes(o.path)))
    }, { path: goodFilePath }).then(() => {
      cy.contains(noSpecErrorTitle).should('be.visible')
      cy.contains(noSpecErrorIntro).should('be.visible')
      cy.contains(noSpecErrorExplainer).should('be.visible')
      cy.contains(getPathForPlatform(goodFilePath)).should('be.visible')
      cy.location()
      .its('href')
      .should('eq', 'http://localhost:4455/__/#/specs')
    })
  })

  it('should show blank page', () => {
    cy.visitApp()
    cy.contains('blank-contents.spec')
    .click()

    cy.get('[data-model-state="passed"]').should('contain', 'renders the blank page')
  })

  it('should show visit failure blank page', () => {
    cy.visitApp()
    cy.contains('blank-contents.spec')
    .click()

    cy.get('[data-model-state="failed"]').should('contain', 'renders the blank page')
    cy.percySnapshot()
  })

  it('shows automation disconnected warning', () => {
    cy.visitApp()
    cy.get('[data-cy="spec-item"]').first().click()
    // Let runner stabilize
    cy.get('[data-cy="reporter-panel"]').should('be.visible')

    cy.withCtx((ctx) => {
      ctx.coreData.servers.appSocketServer?.emit('automation:disconnected')
    })

    cy.contains('h3', 'The Cypress extension has disconnected')

    cy.withCtx((ctx, { sinon }) => {
      sinon.stub(ctx.actions.project, 'launchProject').resolves()
    })

    cy.contains('button', 'Reload the browser').click()

    cy.withCtx((ctx) => {
      expect(ctx.actions.project.launchProject).to.have.been.called
    })

    cy.percySnapshot()
  })

  it('shows automation missing warning', () => {
    let connectedCallback: any

    cy.visitApp()

    cy.window().then((win) => {
      const originalEmit: Function = win.ws?.emit || function () {}
      const stub = cy.stub(win.ws as any, 'emit')

      stub.callsFake((...args) => {
        if (args[0] === 'is:automation:client:connected') {
          connectedCallback = args[2]
        }

        originalEmit.call(win.ws, ...args)
      })
    })

    cy.get('[data-cy="spec-item"]').first().click()
    // Let runner stabilize
    cy.get('[data-cy="reporter-panel"]').should('be.visible').then(() => {
      connectedCallback()
    })

    cy.contains('h3', 'The Cypress extension is missing')

    cy.percySnapshot()

    cy.get('[data-cy="select-browser"]').click()

    cy.percySnapshot()

    cy.withCtx((ctx, { sinon }) => {
      sinon.stub(ctx.actions.project, 'launchProject').resolves()
    })

    cy.contains('li', 'Electron').click()

    cy.withCtx((ctx) => {
      expect(ctx.coreData.chosenBrowser?.displayName).eq('Electron')
      expect(ctx.actions.project.launchProject).to.have.been.called
    })
  })
})
