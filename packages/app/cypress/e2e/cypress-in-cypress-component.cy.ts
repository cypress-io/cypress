import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import { snapshotAUTPanel } from './support/snapshot-aut-panel'

describe('Cypress In Cypress CT', { viewportWidth: 1500 }, () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.findBrowsers()
    cy.openProject('cypress-in-cypress')
    cy.startAppServer('component')
  })

  it('test component', () => {
    cy.__incorrectlyVisitAppWithIntercept()
    cy.contains('TestComponent.spec').click()
    cy.location().should((location) => {
      expect(location.hash).to.contain('TestComponent.spec')
    })

    cy.get('[data-model-state="passed"]').should('contain', 'renders the test component')

    cy.findByTestId('aut-url').should('not.exist')
    cy.findByTestId('select-browser').click()

    cy.contains('Canary').should('be.visible')
    cy.findByTestId('viewport').click()

    snapshotAUTPanel('browsers open')
    cy.contains('Canary').should('be.hidden')
    cy.contains('The viewport determines the width and height of your application. By default the viewport will be 500px by 500px for Component Testing unless specified by a cy.viewport command.')
    .should('be.visible')

    snapshotAUTPanel('viewport info open')

    cy.get('body').click()

    cy.findByTestId('playground-activator').click()
    cy.findByTestId('playground-selector').clear().type('#__cy_root')

    snapshotAUTPanel('cy.get selector')

    cy.findByTestId('playground-num-elements').contains('1 Match')

    cy.window().then((win) => cy.spy(win.console, 'log'))
    cy.findByTestId('playground-print').click().window().then((win) => {
      expect(win.console.log).to.have.been.calledWith('%cCommand:  ', 'font-weight: bold', 'cy.get(\'#__cy_root\')')
    })

    cy.findByLabelText('Selector Methods').click()
    cy.findByRole('menuitem', { name: 'cy.contains' }).click()

    cy.findByTestId('playground-selector').clear().type('Component Test')

    snapshotAUTPanel('cy.contains selector')

    cy.findByTestId('playground-num-elements').contains('1 Match')
  })

  it('navigation between specs and other parts of the app works', () => {
    cy.visitApp()
    cy.contains('TestComponent.spec').click()
    cy.get('[data-model-state="passed"]').should('contain', 'renders the test component')

    // go to Settings page and back to spec runner
    cy.contains('a', 'Settings').click()
    cy.contains(defaultMessages.settingsPage.device.title).should('be.visible')
    cy.contains('a', 'Specs').click()
    cy.contains('TestComponent.spec').click()
    cy.get('[data-model-state="passed"]').should('contain', 'renders the test component')

    // go to Runs page and back to spec runner
    cy.contains('a', 'Runs').click()
    cy.contains(defaultMessages.runs.connect.title).should('be.visible')
    cy.contains('a', 'Specs').click()
    cy.contains('TestComponent.spec').click()
    cy.get('[data-model-state="passed"]').should('contain', 'renders the test component')
  })

  it('redirects to the specs list with error if a spec is not found', () => {
    cy.visitApp()
    const { noSpecErrorTitle, noSpecErrorIntro, noSpecErrorExplainer } = defaultMessages.specPage
    const badFilePath = 'src/DoesNotExist.spec.js'

    cy.visitApp(`/specs/runner?file=${badFilePath}`)
    cy.contains(noSpecErrorTitle).should('be.visible')
    cy.contains(noSpecErrorIntro).should('be.visible')
    cy.contains(noSpecErrorExplainer).should('be.visible')
    cy.contains(badFilePath).should('be.visible')
    cy.location()
    .its('href')
    .should('eq', 'http://localhost:4455/__/#/specs')

    // should clear after reload
    cy.reload()
    cy.contains(noSpecErrorTitle).should('not.exist')
  })

  it('redirects to the specs list with error if an open spec is not found when specs list updates', () => {
    const { noSpecErrorTitle, noSpecErrorIntro, noSpecErrorExplainer } = defaultMessages.specPage

    const goodFilePath = 'src/TestComponent.spec.jsx'

    cy.visitApp(`/specs/runner?file=${goodFilePath}`)

    cy.contains('renders the test component').should('be.visible')

    cy.withCtx((ctx) => {
      // rename relative path for any specs that happen to be found
      const specs = ctx.project.specs.map((spec) => ({ ...spec, relative: `${spec.relative}-updated` }))

      ctx.actions.project.setSpecs(specs)
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

  it('browser picker in runner calls mutation with current spec path', () => {
    cy.__incorrectlyVisitAppWithIntercept()
    cy.contains('TestComponent.spec').click()
    cy.get('[data-model-state="passed"]').should('contain', 'renders the test component')

    cy.intercept('mutation-VerticalBrowserListItems_SetBrowser').as('setBrowser')

    cy.get('[data-cy="select-browser"]')
    .click()

    cy.contains('Firefox')
    .click()

    cy.wait('@setBrowser').then(({ request }) => {
      expect(request.body.variables.specPath).to.contain('/cypress-in-cypress/src/TestComponent.spec.jsx')
    })
  })
})
