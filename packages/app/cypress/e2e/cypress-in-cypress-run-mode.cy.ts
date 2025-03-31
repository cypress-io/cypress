import { CY_IN_CY_SIMULATE_RUN_MODE } from '@packages/types'
import type { ReceivedCypressOptions } from '@packages/types'

describe('Cypress In Cypress - run mode', { viewportWidth: 1200 }, () => {
  it('e2e run mode spec runner header is correct', () => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.findBrowsers()
    cy.openProject('cypress-in-cypress')
    cy.startAppServer()
    cy.visitApp(`/specs/runner?file=cypress/e2e/dom-content.spec.js&${CY_IN_CY_SIMULATE_RUN_MODE}`)

    cy.waitForSpecToFinish()

    cy.findByTestId('aut-url').should('be.visible')
    cy.findByTestId('playground-activator').should('not.exist')

    cy.findByLabelText('Stats').within(() => {
      cy.get('.passed .num', { timeout: 10000 }).should('have.text', '1')
    })

    // confirm expected content is rendered
    cy.contains('1000x660').should('be.visible')
    cy.contains('71%').should('be.visible')
    cy.contains('Chrome 1').should('be.visible')
    cy.contains('http://localhost:4455/cypress/e2e/dom-content.html').should('be.visible')

    // confirm no interactions are implemented
    cy.findByTestId('viewport-size').should('be.visible')
    cy.contains('Chrome 1').click()
    cy.contains('Firefox').should('not.exist')

    // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435
  })

  it('component testing run mode spec runner header is correct', () => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.findBrowsers()
    cy.openProject('cypress-in-cypress', ['--component'])
    cy.startAppServer('component')
    cy.visitApp(`/specs/runner?file=src/TestComponent.spec.jsx&${CY_IN_CY_SIMULATE_RUN_MODE}`)

    cy.waitForSpecToFinish()
    cy.findByTestId('aut-url').contains('URL navigation disabled in component testing').should('be.visible')
    cy.findByTestId('playground-activator').should('not.exist')

    cy.findByLabelText('Stats').within(() => {
      cy.get('.passed .num', { timeout: 10000 }).should('have.text', '1')
    })

    // confirm expected content is rendered
    cy.contains('500x500').should('be.visible')
    cy.contains('Chrome 1').should('be.visible')

    // confirm no interactions are implemented
    cy.findByTestId('viewport-size').should('be.visible')
    cy.contains('Chrome 1').click()
    cy.contains('Firefox').should('not.exist')

    // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435
  })

  it('hides the command log when hideCommandLog is set in run mode', () => {
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

    cy.visitApp(`/specs/runner?file=cypress/e2e/dom-content.spec.js&${CY_IN_CY_SIMULATE_RUN_MODE}`)

    cy.contains('http://localhost:4455/cypress/e2e/dom-content.html').should('be.visible')
    cy.findByLabelText('Stats').should('not.exist')
    cy.findByTestId('specs-list-panel').should('not.be.visible')
    cy.findByTestId('reporter-panel').should('not.be.visible')
    cy.findByTestId('sidebar').should('not.exist')
  })

  it('hides the runner when hideRunnerUi is set in run mode', () => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.findBrowsers()
    cy.openProject('cypress-in-cypress')
    cy.startAppServer()
    cy.withCtx(async (ctx, o) => {
      const config = ctx._apis.projectApi.getConfig()

      o.sinon.stub(ctx._apis.projectApi, 'getConfig').returns({
        ...config,
        hideCommandLog: true,
        hideRunnerUi: true,
      } as ReceivedCypressOptions)
    })

    cy.visitApp(`/specs/runner?file=cypress/e2e/dom-content.spec.js&${CY_IN_CY_SIMULATE_RUN_MODE}`)

    cy.contains('http://localhost:4455/cypress/e2e/dom-content.html').should('not.exist')
    cy.findByLabelText('Stats').should('not.exist')
    cy.findByTestId('specs-list-panel').should('not.be.visible')
    cy.findByTestId('reporter-panel').should('not.be.visible')
    cy.findByTestId('sidebar').should('not.exist')
    cy.get('#spec-runner-header').should('not.exist')
  })
})
