import { loadProjectAndRunSpec } from './helper'

describe('Cypress Studio - Error Handling and Retry Logic', () => {
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
