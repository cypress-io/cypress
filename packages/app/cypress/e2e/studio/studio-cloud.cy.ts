import { launchStudio, loadProjectAndRunSpec, assertClosingPanelWithoutChanges } from './helper'
import pDefer from 'p-defer'

describe('Studio Cloud', () => {
  it('enables protocol for cloud studio', () => {
    launchStudio()

    cy.window().then((win) => {
      expect(win.Cypress.config('isDefaultProtocolEnabled')).to.be.false
      expect(win.Cypress.state('isProtocolEnabled')).to.be.true
    })
  })

  it('immediately loads the studio panel', () => {
    const deferred = pDefer()

    loadProjectAndRunSpec()

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
    launchStudio()

    cy.findByTestId('studio-panel').should('be.visible')

    cy.get('[data-cy="playground-activator"]').should('not.exist')
    cy.get('[data-cy="studio-toolbar"]').should('not.exist')
  })

  it('closes studio panel when clicking studio button (from the cloud)', () => {
    launchStudio()

    cy.findByTestId('studio-panel').should('be.visible')
    cy.get('[data-cy="loading-studio-panel"]').should('not.exist')

    cy.get('[data-cy="studio-header-studio-button"]').click()

    assertClosingPanelWithoutChanges()
  })

  it('opens studio panel to new test when clicking on studio button (from the app) next to url', () => {
    cy.viewport(1500, 1000)
    loadProjectAndRunSpec()
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

    loadProjectAndRunSpec()

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

  it('does not exit studio mode if the spec is changed on the file system', () => {
    launchStudio()

    cy.findByTestId('studio-panel').should('be.visible')

    // update the spec on the file system to force a rerun through watched:file:changed
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress/e2e/spec.cy.js', `
describe('studio functionality', () => {
  it('visits a basic html page', () => {
    // new comment
    cy.visit('cypress/e2e/index.html')
  })
})`)
    })

    cy.waitForSpecToFinish()

    // verify studio is still open
    cy.findByTestId('studio-panel').should('be.visible')
  })

  it('does not add studio logs when cloud studio is enabled', () => {
    launchStudio()

    cy.findByTestId('studio-panel').should('be.visible')

    // Attempt to perform actions that would normally add studio logs in regular studio
    // but should NOT be add studio logs when cloud studio is enabled because event listeners are not attached
    cy.getAutIframe().within(() => {
      cy.get('p').contains('Count is 0')

      // Try to click the increment button - this should NOT add studio logs
      // because cloud studio event listeners should not be attached
      cy.get('#increment').realClick().then(() => {
        cy.get('p').contains('Count is 1')
      })
    })

    // Verify that no legacy studio commands were added
    cy.get('.command-is-studio').should('not.exist')

    // Verify that the actual DOM interactions still work (button was clicked, counter incremented)
    // but they just weren't recorded by the legacy studio event listeners
    cy.getAutIframe().within(() => {
      cy.get('p').should('contain', 'Count is 1')
    })

    cy.findByTestId('studio-panel').should('be.visible')

    cy.get('[data-cy="studio-toolbar"]').should('not.exist')
  })
})
