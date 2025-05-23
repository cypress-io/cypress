import { launchStudio, loadProjectAndRunSpec, assertClosingPanelWithoutChanges } from './helper'
import pDefer from 'p-defer'

describe('Studio Cloud', () => {
  it('enables protocol for cloud studio', () => {
    launchStudio({ enableCloudStudio: true })

    cy.window().then((win) => {
      expect(win.Cypress.config('isDefaultProtocolEnabled')).to.be.false
      expect(win.Cypress.state('isProtocolEnabled')).to.be.true
    })
  })

  it('loads the legacy studio UI correctly when studio bundle is taking too long to load', () => {
    loadProjectAndRunSpec({ enableCloudStudio: false })

    cy.window().then(() => {
      cy.withCtx((ctx) => {
        // Mock the studioLifecycleManager.getStudio method to return a hanging promise
        if (ctx.coreData.studioLifecycleManager) {
          const neverResolvingPromise = new Promise<null>(() => {})

          ctx.coreData.studioLifecycleManager.getStudio = () => neverResolvingPromise
          ctx.coreData.studioLifecycleManager.isStudioReady = () => false
        }
      })
    })

    cy.contains('visits a basic html page')
    .closest('.runnable-wrapper')
    .findByTestId('launch-studio')
    .click()

    cy.waitForSpecToFinish()

    // Verify the cloud studio panel is not present
    cy.findByTestId('studio-panel').should('not.exist')

    cy.get('[data-cy="loading-studio-panel"]').should('not.exist')

    cy.get('[data-cy="hook-name-studio commands"]').should('exist')

    cy.getAutIframe().within(() => {
      cy.get('#increment').realClick()
    })

    cy.findByTestId('hook-name-studio commands').closest('.hook-studio').within(() => {
      cy.get('.command').should('have.length', 2)
      cy.get('.command-name-get').should('contain.text', '#increment')
      cy.get('.command-name-click').should('contain.text', 'click')
    })

    cy.get('button').contains('Save Commands').should('not.be.disabled')
  })

  it('immediately loads the studio panel', () => {
    const deferred = pDefer()

    loadProjectAndRunSpec({ enableCloudStudio: true })

    cy.findByTestId('studio-panel').should('not.exist')

    cy.intercept('/cypress/e2e/index.html', () => {
      // wait for the promise to resolve before responding
      // this will ensure the studio panel is loaded before the test finishes
      return deferred.promise
    }).as('indexHtml')

    cy.contains('visits a basic html page')
    .closest('.runnable-wrapper')
    .findByTestId('launch-studio')
    .click()

    // regular studio is not loaded until after the test finishes
    cy.get('[data-cy="hook-name-studio commands"]').should('not.exist')
    // cloud studio is loaded immediately
    cy.findByTestId('studio-panel').then(() => {
      // check for the loading panel from the app first
      cy.get('[data-cy="loading-studio-panel"]').should('be.visible')
      // we've verified the studio panel is loaded, now resolve the promise so the test can finish
      deferred.resolve()
    })

    cy.wait('@indexHtml')

    // Studio re-executes spec before waiting for commands - wait for the spec to finish executing.
    cy.waitForSpecToFinish()

    // Verify the studio panel is still open
    cy.findByTestId('studio-panel')
    cy.get('[data-cy="hook-name-studio commands"]')
  })

  it('hides selector playground and studio controls when studio beta is available', () => {
    launchStudio({ enableCloudStudio: true })

    cy.findByTestId('studio-panel').should('be.visible')

    cy.get('[data-cy="playground-activator"]').should('not.exist')
    cy.get('[data-cy="studio-toolbar"]').should('not.exist')
  })

  it('closes studio panel when clicking studio button (from the cloud)', () => {
    launchStudio({ enableCloudStudio: true })

    cy.findByTestId('studio-panel').should('be.visible')
    cy.get('[data-cy="loading-studio-panel"]').should('not.exist')

    cy.get('[data-cy="studio-header-studio-button"]').click()

    assertClosingPanelWithoutChanges()
  })

  it('opens studio panel to new test when clicking on studio button (from the app) next to url', () => {
    cy.viewport(1500, 1000)
    loadProjectAndRunSpec({ enableCloudStudio: true })
    // studio button should be visible when using cloud studio
    cy.get('[data-cy="studio-button"]').should('be.visible').click()
    cy.get('[data-cy="studio-panel"]').should('be.visible')

    cy.contains('New Test')

    cy.get('[data-cy="studio-url-prompt"]').should('not.exist')

    cy.percySnapshot()
  })

  it('opens a cloud studio session with AI enabled', () => {
    cy.mockNodeCloudRequest({
      url: '/studio/testgen/n69px6/enabled',
      method: 'get',
      body: { enabled: true },
    })

    // this endpoint gets called twice, so we need to mock it twice
    cy.mockNodeCloudRequest({
      url: '/studio/testgen/n69px6/enabled',
      method: 'get',
      body: { enabled: true },
    })

    const aiOutput = 'cy.get(\'button\').should(\'have.text\', \'Increment\')'

    cy.mockNodeCloudStreamingRequest({
      url: '/studio/testgen/n69px6/generate',
      method: 'post',
      body: { recommendations: [{ content: aiOutput }] },
    })

    cy.mockStudioFullSnapshot({
      fullSnapshot: {
        id: 1,
        nodeType: 1,
        nodeName: 'div',
        localName: 'div',
        nodeValue: 'div',
        children: [],
        shadowRoots: [],
      },
      url: 'http://localhost:3000/cypress/e2e/index.html',
    })

    const deferred = pDefer()

    loadProjectAndRunSpec({ enableCloudStudio: true })

    cy.findByTestId('studio-panel').should('not.exist')

    cy.intercept('/cypress/e2e/index.html', () => {
      // wait for the promise to resolve before responding
      // this will ensure the studio panel is loaded before the test finishes
      return deferred.promise
    }).as('indexHtml')

    cy.contains('visits a basic html page')
    .closest('.runnable-wrapper')
    .findByTestId('launch-studio')
    .click()

    // regular studio is not loaded until after the test finishes
    cy.get('[data-cy="hook-name-studio commands"]').should('not.exist')
    // cloud studio is loaded immediately
    cy.findByTestId('studio-panel').then(() => {
      // check for the loading panel from the app first
      cy.get('[data-cy="loading-studio-panel"]').should('be.visible')
      // we've verified the studio panel is loaded, now resolve the promise so the test can finish
      deferred.resolve()
    })

    cy.wait('@indexHtml')

    // Studio re-executes spec before waiting for commands - wait for the spec to finish executing.
    cy.waitForSpecToFinish()

    // Verify the studio panel is still open
    cy.findByTestId('studio-panel')
    cy.get('[data-cy="hook-name-studio commands"]')

    // make sure studio is not loading
    cy.get('[data-cy="loading-studio-panel"]').should('not.exist')

    // Verify that AI is enabled
    cy.get('[data-cy="ai-status-text"]').should('contain.text', 'Enabled')

    // Verify that the AI output is correct
    cy.get('[data-cy="recommendation-editor"]').should('contain', aiOutput)
  })
})
