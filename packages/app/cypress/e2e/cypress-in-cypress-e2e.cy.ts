import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
// import { snapshotAUTPanel } from './support/snapshot-aut-panel'
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
    cy.specsPageIsVisible()
    cy.contains('dom-content.spec').click()
    cy.waitForSpecToFinish()

    cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')
    cy.findByTestId('aut-url').should('be.visible')
    cy.findByTestId('playground-activator').should('be.visible')
    cy.findByTestId('select-browser').click()

    cy.contains('Canary').should('be.visible')
    cy.findByTestId('select-browser').click()
    cy.get('[data-cy="viewport-size"]').should('be.visible')

    cy.contains('Chrome 1')
    .focus()
    .type('{esc}')

    // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435
    // snapshotAUTPanel('browsers open')

    cy.contains('Canary').should('be.hidden')
    cy.get('body').click()

    cy.findByTestId('playground-activator').click()
    cy.findByTestId('playground-selector').clear().type('li')

    // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435
    // snapshotAUTPanel('cy.get selector')

    cy.findByTestId('playground-num-elements').contains('3 matches')

    // This validates that each matching element is covered by the playground highlighting
    cy.get('iframe.aut-iframe').its('0.contentDocument.body').then(cy.wrap).within(() => {
      cy.get('li').each(($highlightedItem) => {
        const el = $highlightedItem[0]
        const rect = el.getBoundingClientRect()

        const elAtPoint = el.ownerDocument.elementFromPoint(rect.left, rect.top)

        expect(el).not.eq(elAtPoint)
      })
    })

    cy.findByLabelText('Selector methods').click()
    cy.findByRole('menuitem', { name: 'cy.contains' }).click()

    cy.findByTestId('playground-selector').clear().type('Item 1')

    // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435
    // snapshotAUTPanel('cy.contains selector')

    cy.findByTestId('playground-num-elements').contains('1 match')

    cy.window().then((win) => cy.spy(win.console, 'log'))
    cy.findByTestId('playground-print').click().window().then((win) => {
      expect(win.console.log).to.have.been.calledWith('%cCommand:  ', 'font-weight: bold', 'cy.contains(\'Item 1\')')
    })

    cy.get('.hook-open-in-ide').should('exist')
  })

  it('navigation between specs and other parts of the app works', () => {
    cy.visitApp()
    cy.specsPageIsVisible()
    cy.contains('dom-content.spec').click()
    cy.waitForSpecToFinish()
    cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')

    // go to Settings page and back to spec runner
    cy.contains('a', 'Settings').click()
    cy.contains(defaultMessages.settingsPage.device.title).should('be.visible')
    cy.contains('a', 'Specs').click()
    cy.contains('dom-content.spec').click()
    cy.waitForSpecToFinish()
    cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')

    // go to Runs page and back to spec runner
    cy.contains('a', 'Runs').click()
    cy.contains(defaultMessages.runs.connect.title).should('be.visible')
    cy.contains('a', 'Specs').click()
    cy.contains('dom-content.spec').click()
    cy.waitForSpecToFinish()
    cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')
  })

  it('redirects to the specs list with error if a spec is not found when navigating', () => {
    const { title, intro, explainer } = defaultMessages.specPage.noSpecError
    const badFilePath = 'cypress/e2e/does-not-exist.spec.js'

    cy.visitApp(`/specs/runner?file=${badFilePath}`)
    cy.contains(title).should('be.visible')
    cy.contains(intro).should('be.visible')
    cy.contains(explainer).should('be.visible')
    cy.contains(getPathForPlatform(badFilePath)).should('be.visible')
    cy.location()
    .its('href')
    .should('eq', 'http://localhost:4455/__/#/specs')

    // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435

    // should clear after reload
    cy.reload()
    cy.contains(title).should('not.exist')
  })

  it('redirects to the specs list with error if an open spec is not found when specs list updates', () => {
    const { title, intro, explainer } = defaultMessages.specPage.noSpecError

    const goodFilePath = 'cypress/e2e/dom-content.spec.js'

    cy.visit(`http://localhost:4455/__/#/specs/runner?file=${goodFilePath}`)

    cy.contains('Dom Content').should('be.visible')

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

  it('should show blank page', () => {
    cy.visitApp()
    cy.specsPageIsVisible()
    cy.contains('blank-contents.spec')
    .click()

    cy.get('[data-model-state="passed"]').should('contain', 'renders the blank page')
  })

  it('shows a compilation error with a malformed spec', { viewportHeight: 596, viewportWidth: 1000 }, () => {
    const expectedAutHeight = 456 // based on explicitly setting viewport in this test to 596

    cy.visitApp()
    cy.specsPageIsVisible()

    cy.withCtx(async (ctx, o) => {
      await ctx.actions.file.writeFileInProject(o.path, `describe('Bad spec', () => { it('has a syntax error', () => { expect(true).to.be.true }) }`)
    }, { path: getPathForPlatform('cypress/e2e/bad-spec.spec.js') })

    cy.contains('bad-spec.spec')
    .click()

    cy.contains('No tests found').should('be.visible')

    cy.contains('SyntaxError')
    .should('be.visible')
    .invoke('outerHeight')
    .should('eq', expectedAutHeight)

    // Checking the height here might seem excessive
    // but we really want some warning if this changes
    // and should understand the reasons if it does.
    // We could consider removing this after percy is
    // up and running for e2e tests.

    // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435
  })

  it('should show visit failure blank page', () => {
    cy.visitApp()
    cy.specsPageIsVisible()
    cy.contains('blank-contents.spec')
    .click()

    cy.get('[data-model-state="failed"]').should('contain', 'renders the blank page')
    // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435
  })

  it('set the correct viewport values from CLI', () => {
    cy.openProject('cypress-in-cypress', ['--config', 'viewportWidth=333,viewportHeight=333'])
    cy.startAppServer()

    cy.visitApp()
    cy.specsPageIsVisible()
    cy.contains('dom-content.spec').click()

    cy.get('.toggle-specs-wrapper').click()

    cy.get('#unified-runner').should('have.css', 'width', '333px')
    cy.get('#unified-runner').should('have.css', 'height', '333px')
  })

  it('stops correctly running spec while switching specs', () => {
    cy.visitApp()
    cy.specsPageIsVisible()
    cy.contains('withFailure.spec').click()
    cy.contains('[aria-controls=reporter-inline-specs-list]', 'Specs')
    cy.get('body').type('f')
    cy.contains('Search specs')
    cy.contains('withWait.spec').click()
    cy.waitForSpecToFinish()

    cy.get('.passed > .num').should('contain', 4)
    cy.get('.failed > .num').should('not.contain', 1)
  })

  it('executes a test, navigates back to the spec list, creates a new spec, and runs the new spec', () => {
    cy.visitApp()
    cy.specsPageIsVisible()
    cy.contains('dom-content.spec').click()
    cy.waitForSpecToFinish()
    cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')
    cy.contains('a', 'Specs').click()
    cy.withCtx(async (ctx, o) => {
      await ctx.actions.file.writeFileInProject(o.path, `describe('Simple Test', () => { it('true is true', () => { expect(true).to.be.true }) })`)
    }, { path: getPathForPlatform('cypress/e2e/new-file.spec.js') })

    cy.contains('new-file.spec').click()
    cy.waitForSpecToFinish()
    cy.get('[data-model-state="passed"]').should('contain', 'expected true to be true')
  })

  describe('accessibility', () => {
    it('has no axe violations in specs list panel', () => {
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('withFailure.spec').click()
      cy.get('button[aria-controls="reporter-inline-specs-list"]').click()
    })

    it('has no axe violations in reporter panel', () => {
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('withFailure.spec').click()
      cy.get('button[aria-controls="reporter-inline-specs-list"]').click()
    })
  })
})
