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

  it('does not exit studio mode if the spec is changed on the file system', () => {
    launchStudio({ enableCloudStudio: true })

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

  it('does not record studio commands when cloud studio is enabled', () => {
    launchStudio({ enableCloudStudio: true })

    cy.findByTestId('studio-panel').should('be.visible')

    // Attempt to perform actions that would normally be recorded in regular studio
    // but should NOT be recorded in when cloud studio is enabled because event listeners are not attached
    cy.getAutIframe().within(() => {
      cy.get('p').contains('Count is 0')

      // Try to click the increment button - this should NOT be recorded
      // because cloud studio event listeners should not be attached
      cy.get('#increment').realClick().then(() => {
        cy.get('p').contains('Count is 1')
      })
    })

    // Verify that no legacy studio commands were recorded
    cy.get('.command-is-studio').should('not.exist')

    // Verify that the actual DOM interactions still work (button was clicked, counter incremented)
    // but they just weren't recorded by the legacy studio event listeners
    cy.getAutIframe().within(() => {
      cy.get('p').should('contain', 'Count is 1')
    })

    cy.findByTestId('studio-panel').should('be.visible')

    cy.get('[data-cy="studio-toolbar"]').should('not.exist')
  })

  describe('failing to load studio and retrying', () => {
    it('displays error panel when studio bundle fails to load', () => {
      // Intercept the studio bundle request and make it fail
      cy.intercept('GET', '/__cypress-studio/app-studio.js', {
        statusCode: 500,
        body: 'Internal Server Error',
      }).as('studioBundleFail')

      loadProjectAndRunSpec({ enableCloudStudio: true })

      cy.contains('visits a basic html page')
      .closest('.runnable-wrapper')
      .findByTestId('launch-studio')
      .click()

      cy.waitForSpecToFinish()

      // Wait for the failed studio bundle request
      cy.wait('@studioBundleFail')

      // Verify the error panel is displayed
      cy.get('[data-cy="studio-error-panel"]').should('be.visible')
      cy.contains('Something went wrong')
      cy.contains('There was a problem with Cypress Studio')

      // Verify retry button is present
      cy.get('[data-cy="studio-error-retry-button"]').should('be.visible')

      cy.percySnapshot('studio-error-panel')
    })

    it('shows retry button with refresh icon', () => {
      // Intercept and fail the studio bundle request
      cy.intercept('GET', '/__cypress-studio/app-studio.js', {
        statusCode: 404,
        body: 'Not Found',
      }).as('studioBundleNotFound')

      loadProjectAndRunSpec({ enableCloudStudio: true })

      cy.contains('visits a basic html page')
      .closest('.runnable-wrapper')
      .findByTestId('launch-studio')
      .click()

      cy.waitForSpecToFinish()

      // Wait for the failed request
      cy.wait('@studioBundleNotFound')

      // Verify error panel and retry button
      cy.get('[data-cy="studio-error-panel"]').should('be.visible')
      cy.get('[data-cy="studio-error-retry-button"]')
      .should('be.visible')
      .should('contain', 'Retry')
      .find('svg') // Check for the refresh icon
      .should('exist')
    })

    it('retries studio initialization when retry button is clicked', () => {
      let callCount = 0

      // First call fails, subsequent calls succeed
      cy.intercept('GET', '/__cypress-studio/app-studio.js*', (req) => {
        callCount++
        if (callCount === 1) {
          req.reply({
            statusCode: 500,
            body: 'Server Error',
          })
        } else {
          req.continue() // Let subsequent requests succeed normally
        }
      }).as('studioBundle')

      loadProjectAndRunSpec({ enableCloudStudio: true })

      cy.contains('visits a basic html page')
      .closest('.runnable-wrapper')
      .findByTestId('launch-studio')
      .click()

      cy.waitForSpecToFinish()

      // Wait for the first failed request
      cy.wait('@studioBundle')

      // Verify error panel is shown
      cy.get('[data-cy="studio-error-panel"]').should('be.visible')

      // Click retry button
      cy.get('[data-cy="studio-error-retry-button"]').click()

      // Verify that the error panel disappears (indicating retry worked)
      cy.get('[data-cy="studio-error-panel"]').should('not.exist')

      // Verify loading panel appears
      cy.get('[data-cy="loading-studio-panel"]').should('be.visible')

      // Wait for studio to load successfully
      cy.findByTestId('studio-panel', { timeout: 10000 }).should('be.visible')

      cy.get('[data-cy="test-block-editor"]').within(() => {
        cy.contains('cy.visit')
      })
    })

    it('maintains studio button functionality during error state', () => {
      // Intercept and fail the studio bundle request
      cy.intercept('GET', '/__cypress-studio/app-studio.js', {
        statusCode: 503,
        body: 'Service Unavailable',
      }).as('studioBundleUnavailable')

      loadProjectAndRunSpec({ enableCloudStudio: true })

      cy.contains('visits a basic html page')
      .closest('.runnable-wrapper')
      .findByTestId('launch-studio')
      .click()

      cy.waitForSpecToFinish()

      // Wait for the failed request
      cy.wait('@studioBundleUnavailable')

      // Verify error panel is displayed
      cy.get('[data-cy="studio-error-panel"]').should('be.visible')

      // Verify studio button is still present in the error panel header
      cy.get('[data-cy="studio-error-panel"]').within(() => {
        cy.get('[data-cy="studio-button"]').should('be.visible')
      })

      // Click studio button to close error panel
      cy.get('[data-cy="studio-button"]').click()

      // Verify error panel is closed
      cy.get('[data-cy="studio-error-panel"]').should('not.exist')
    })

    it('handles multiple retry attempts gracefully', () => {
      let callCount = 0

      // First two calls fail, third call succeeds
      cy.intercept('GET', '/__cypress-studio/app-studio.js*', (req) => {
        callCount++
        if (callCount <= 2) {
          req.reply({
            statusCode: 500,
            body: `Attempt ${callCount} failed`,
          })
        } else {
          req.continue() // Let the third request succeed normally
        }
      }).as('studioBundle')

      loadProjectAndRunSpec({ enableCloudStudio: true })

      cy.contains('visits a basic html page')
      .closest('.runnable-wrapper')
      .findByTestId('launch-studio')
      .click()

      cy.waitForSpecToFinish()

      // Wait for first failed request
      cy.wait('@studioBundle')

      // First retry attempt
      cy.get('[data-cy="studio-error-panel"]').should('be.visible')
      cy.get('[data-cy="studio-error-retry-button"]').click()

      // Second retry attempt
      cy.get('[data-cy="studio-error-panel"]').should('be.visible')
      cy.get('[data-cy="studio-error-retry-button"]').click()

      // Third attempt should succeed
      cy.get('[data-cy="studio-error-panel"]').should('not.exist')
      cy.findByTestId('studio-panel', { timeout: 10000 }).should('be.visible')
      cy.get('[data-cy="test-block-editor"]').within(() => {
        cy.contains('cy.visit')
      })
    })
  })
})
