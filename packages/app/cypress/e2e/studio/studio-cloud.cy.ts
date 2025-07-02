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
    cy.findByTestId('hook-name-studio commands').should('not.exist')
    // cloud studio is loaded immediately
    cy.findByTestId('studio-panel').then(() => {
      // check for the loading panel from the app first
      cy.findByTestId('loading-studio-panel').should('be.visible')
      // we've verified the studio panel is loaded, now resolve the promise so the test can finish
      deferred.resolve()
    })

    cy.wait('@indexHtml')

    // Studio re-executes spec before waiting for commands - wait for the spec to finish executing.
    cy.waitForSpecToFinish()

    // Verify the studio panel is still open
    cy.findByTestId('studio-panel')
    cy.findByTestId('hook-name-studio commands')
  })

  it('hides selector playground and studio controls when studio beta is available', () => {
    launchStudio()

    cy.findByTestId('studio-panel').should('be.visible')

    cy.findByTestId('playground-activator').should('not.exist')
    cy.findByTestId('studio-toolbar').should('not.exist')
  })

  it('closes studio panel when clicking studio button (from the cloud)', () => {
    launchStudio()

    cy.findByTestId('studio-panel').should('be.visible')
    cy.findByTestId('loading-studio-panel').should('not.exist')

    cy.findByTestId('studio-header-studio-button').click()

    assertClosingPanelWithoutChanges()
  })

  it('opens studio panel to new test when clicking on studio button (from the app) next to url', () => {
    cy.viewport(1500, 1000)
    loadProjectAndRunSpec()
    // studio button should be visible when using cloud studio
    cy.findByTestId('studio-button').should('be.visible').click()
    cy.findByTestId('studio-panel').should('be.visible')

    cy.contains('New Test')

    cy.findByTestId('studio-url-prompt').should('not.exist')

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
    cy.findByTestId('hook-name-studio commands').should('not.exist')
    // cloud studio is loaded immediately
    cy.findByTestId('studio-panel').then(() => {
      // check for the loading panel from the app first
      cy.findByTestId('loading-studio-panel').should('be.visible')
      // we've verified the studio panel is loaded, now resolve the promise so the test can finish
      deferred.resolve()
    })

    cy.wait('@indexHtml')

    // Studio re-executes spec before waiting for commands - wait for the spec to finish executing.
    cy.waitForSpecToFinish()

    // Verify the studio panel is still open
    cy.findByTestId('studio-panel')
    cy.findByTestId('hook-name-studio commands')

    // make sure studio is not loading
    cy.findByTestId('loading-studio-panel').should('not.exist')

    // Verify that AI is enabled
    cy.findByTestId('ai-status-text').should('contain.text', 'Enabled')

    // Verify that the AI output is correct
    cy.findByTestId('recommendation-editor').should('contain', aiOutput)
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

    cy.findByTestId('studio-toolbar').should('not.exist')
  })

  describe('failing to load studio and retrying', () => {
    it('displays error panel when studio bundle fails to load', () => {
      // Intercept the studio bundle request and make it fail
      cy.intercept('GET', '/__cypress-studio/app-studio.js', {
        statusCode: 500,
        body: 'Internal Server Error',
      }).as('studioBundleFail')

      loadProjectAndRunSpec()

      cy.contains('visits a basic html page')
      .closest('.runnable-wrapper')
      .findByTestId('launch-studio')
      .click()

      cy.waitForSpecToFinish()

      // Wait for the failed studio bundle request
      cy.wait('@studioBundleFail')

      // Verify the error panel is displayed
      cy.findByTestId('studio-error-panel').should('be.visible')
      cy.contains('Something went wrong')
      cy.findByTestId('studio-error-panel').should('contain.text', 'There was a problem with Cypress Studio. Our team has been notified. If the problem persists, please try again later.')

      // Verify retry button is present
      cy.findByTestId('studio-error-retry-button').should('be.visible')

      cy.percySnapshot('studio-error-panel')
    })

    it('shows retry button with refresh icon', () => {
      // Intercept and fail the studio bundle request
      cy.intercept('GET', '/__cypress-studio/app-studio.js', {
        statusCode: 404,
        body: 'Not Found',
      }).as('studioBundleNotFound')

      loadProjectAndRunSpec()

      cy.contains('visits a basic html page')
      .closest('.runnable-wrapper')
      .findByTestId('launch-studio')
      .click()

      cy.waitForSpecToFinish()

      // Wait for the failed request
      cy.wait('@studioBundleNotFound')

      // Verify error panel and retry button
      cy.findByTestId('studio-error-panel').should('be.visible')
      cy.findByTestId('studio-error-retry-button')
      .should('be.visible')
      .should('contain', 'Retry')
      .find('svg') // Check for the refresh icon
      .should('exist')
    })

    it('retries studio initialization when retry button is clicked', () => {
      let firstCallMade = false

      cy.intercept('GET', '/__cypress-studio/app-studio.js*', (req) => {
        if (!firstCallMade) {
          // First call fails
          firstCallMade = true
          req.reply({
            statusCode: 500,
            body: 'Server Error',
          })
        } else {
          // Subsequent calls succeed
          req.continue()
        }
      }).as('studioBundleRequest')

      loadProjectAndRunSpec()

      cy.contains('visits a basic html page')
      .closest('.runnable-wrapper')
      .findByTestId('launch-studio')
      .click()

      cy.waitForSpecToFinish()

      // Wait for the first failed request
      cy.wait('@studioBundleRequest')

      // Verify error panel is shown
      cy.findByTestId('studio-error-panel').should('be.visible')

      // Click retry button
      cy.findByTestId('studio-error-retry-button').click()

      // Verify that the error panel disappears (indicating retry worked)
      cy.findByTestId('studio-error-panel').should('not.exist')

      // Verify loading panel appears
      cy.findByTestId('loading-studio-panel').should('be.visible')

      // Wait for studio to load successfully
      cy.findByTestId('studio-panel', { timeout: 10000 }).should('be.visible')

      cy.findByTestId('test-block-editor').within(() => {
        cy.contains('cy.visit')
      })
    })

    it('maintains studio button functionality during error state', () => {
      // Intercept and fail the studio bundle request
      cy.intercept('GET', '/__cypress-studio/app-studio.js', {
        statusCode: 503,
        body: 'Service Unavailable',
      }).as('studioBundleUnavailable')

      loadProjectAndRunSpec()

      cy.contains('visits a basic html page')
      .closest('.runnable-wrapper')
      .findByTestId('launch-studio')
      .click()

      cy.waitForSpecToFinish()

      // Wait for the failed request
      cy.wait('@studioBundleUnavailable')

      // Verify error panel is displayed
      cy.findByTestId('studio-error-panel').should('be.visible')

      // Verify studio button is still present in the error panel header
      cy.findByTestId('studio-error-panel').within(() => {
        cy.findByTestId('studio-button').should('be.visible')
      })

      // Click studio button to close error panel
      cy.findByTestId('studio-button').click()

      // Verify error panel is closed
      cy.findByTestId('studio-error-panel').should('not.exist')
    })

    it('handles multiple retry attempts gracefully', () => {
      let failedCallCount = 0

      cy.intercept('GET', '/__cypress-studio/app-studio.js*', (req) => {
        if (failedCallCount < 2) {
          // First two calls fail
          failedCallCount++
          req.reply({
            statusCode: 500,
            body: 'Attempt failed',
          })
        } else {
          // Third call succeeds
          req.continue()
        }
      }).as('studioBundleRequest')

      loadProjectAndRunSpec()

      cy.contains('visits a basic html page')
      .closest('.runnable-wrapper')
      .findByTestId('launch-studio')
      .click()

      cy.waitForSpecToFinish()

      // Wait for first failed request
      cy.wait('@studioBundleRequest')

      // First retry attempt
      cy.findByTestId('studio-error-panel').should('be.visible')
      cy.findByTestId('studio-error-retry-button').click()

      // Second retry attempt
      cy.findByTestId('studio-error-panel').should('be.visible')
      cy.findByTestId('studio-error-retry-button').click()

      // Third attempt should succeed
      cy.findByTestId('studio-error-panel').should('not.exist')
      cy.findByTestId('studio-panel', { timeout: 10000 }).should('be.visible')
      cy.findByTestId('test-block-editor').within(() => {
        cy.contains('cy.visit')
      })
    })
  })
})
