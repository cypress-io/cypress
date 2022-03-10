import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import { snapshotAUTPanel } from './support/snapshot-aut-panel'

describe('Cypress In Cypress', { viewportWidth: 1500 }, () => {
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

    cy.visit(`http://localhost:4455/__/#/specs/runner?file=${badFilePath}`)
    cy.contains(noSpecErrorTitle).should('be.visible')
    cy.contains(noSpecErrorIntro).should('be.visible')
    cy.contains(noSpecErrorExplainer).should('be.visible')
    cy.contains(badFilePath).should('be.visible')
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

    // TODO: Figure out why test is flaky without wait
    // see: https://cypress-io.atlassian.net/browse/UNIFY-1294
    cy.wait(1000)
    cy.visit(`http://localhost:4455/__/#/specs/runner?file=${goodFilePath}`)

    cy.contains('Dom Content').should('be.visible')

    cy.withCtx((ctx) => {
      ctx.actions.project.setSpecs([])
      ctx.emitter.toApp()
    }).then(() => {
      cy.contains(noSpecErrorTitle).should('be.visible')
      cy.contains(noSpecErrorIntro).should('be.visible')
      cy.contains(noSpecErrorExplainer).should('be.visible')
      cy.contains(goodFilePath).should('be.visible')
      cy.location()
      .its('href')
      .should('eq', 'http://localhost:4455/__/#/specs')
    })
  })
})
