import { launchStudio, loadProjectAndRunSpec } from './helper'
import pDefer from 'p-defer'

describe('Cypress Studio - UI and Panel Management', () => {
  it('closes studio panel when clicking studio button (from the cloud)', () => {
    launchStudio()

    cy.findByTestId('studio-panel').should('be.visible')
    cy.findByTestId('loading-studio-panel').should('not.exist')

    cy.findByTestId('studio-header-studio-button').click()

    // Cypress re-runs after you cancel Studio.
    // Original spec should pass
    cy.waitForSpecToFinish({ passCount: 1 })

    cy.get('.command').should('have.length', 1)

    // Assert the spec was executed without any new commands.
    cy.get('.command-name-visit').within(() => {
      cy.contains('visit')
      cy.contains('cypress/e2e/index.html')
    })

    cy.withCtx(async (ctx) => {
      const spec = await ctx.actions.file.readFileInProject('cypress/e2e/spec.cy.js')

      // No change, since we closed studio
      expect(spec.trim().replace(/\r/g, '')).to.eq(`
describe('studio functionality', () => {
  it('visits a basic html page', () => {
    cy.visit('cypress/e2e/index.html')
  })
})`.trim())
    })
  })

  it('opens studio panel to new test when clicking on studio button (from the app) next to url', () => {
    cy.viewport(1500, 1000)
    loadProjectAndRunSpec()
    // studio button should be visible when using cloud studio
    cy.findByTestId('studio-button').should('be.visible').click()
    cy.findByTestId('studio-panel').should('be.visible')

    cy.contains('New test')

    cy.percySnapshot()
  })

  it('immediately loads the studio panel from existing test', () => {
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

    cy.percySnapshot()
  })

  it('shows test body sections correctly when studio panel is open and page is refreshed', () => {
    loadProjectAndRunSpec()

    cy.waitForSpecToFinish()

    cy.findByTestId('studio-button').click()
    cy.findByTestId('studio-panel').should('be.visible')
    cy.findByTestId('new-test-button').should('be.visible')

    cy.reload()

    cy.waitForSpecToFinish()

    cy.findByTestId('studio-panel').should('be.visible')
    cy.findByTestId('new-test-button').should('be.visible')

    // verify test body section is visible after refresh
    cy.get('.runnable-instruments').should('be.visible')
    cy.get('.runnable-commands-region').should('be.visible')

    // verify the test body hook is present
    cy.get('.hook-item').contains('test body').should('be.visible')

    // verify commands are visible within the test body
    cy.get('.command-name-visit').should('be.visible')

    // Verify URL parameters show suite mode, not test mode
    cy.location().its('hash').should('contain', 'suiteId=r1').and('not.contain', 'testId=')
  })

  it('stays in new test mode when studio panel is opened when the spec is running', () => {
    loadProjectAndRunSpec()

    cy.waitForSpecToFinish()

    cy.findByTestId('studio-button').click()
    cy.findByTestId('studio-panel').should('be.visible')
    cy.findByTestId('new-test-button').should('be.visible')

    // Verify we're initially in new test mode
    cy.location().its('hash').should('contain', 'suiteId=r1').and('not.contain', 'testId=')

    // Now restart the spec, which will call interceptTest with the running test
    // This is where the bug would manifest - it would incorrectly switch from
    // "new test" mode to "edit the running test" mode
    cy.get('button.restart').click()

    cy.get('.test').should('have.length', 1)
    cy.get('.test').first().should('have.class', 'runnable-active')

    // verify we're still in new test mode
    cy.findByTestId('studio-panel').should('be.visible')
    cy.findByTestId('new-test-button').should('be.visible')

    // these should not exist if we stayed in new test mode
    cy.findByTestId('studio-single-test-title').should('not.exist')
    cy.findByTestId('record-button-recording').should('not.exist')

    // verify URL still shows suite mode, not edit test mode
    cy.location().its('hash').should('contain', 'suiteId=r1').and('not.contain', 'testId=')
  })

  it('opens a cloud studio session with AI enabled', () => {
    cy.mockNodeCloudRequest({
      url: '/studio/config?projectSlug=n69px6',
      method: 'get',
      body: { AI: { enabled: true } },
    })

    // this endpoint gets called twice, so we need to mock it twice
    cy.mockNodeCloudRequest({
      url: '/studio/config?projectSlug=n69px6',
      method: 'get',
      body: { AI: { enabled: true } },
    })

    const aiOutput = 'cy.get(\'button\').should(\'have.text\', \'Increment\')'

    cy.mockNodeCloudRequest({
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

    launchStudio()

    // Verify that the AI output is correct
    cy.get('.cm-is-recommendation-line').should('contain', aiOutput)
  })

  it('studio AI is marked as coming soon', () => {
    cy.mockNodeCloudRequest({
      url: '/studio/config?projectSlug=n69px6',
      method: 'get',
      body: { AI: { enabled: false, disabledReason: 'studio_ai_feature_flag_disabled' }, featureFlags: { studioAI: false } },
    })

    // this endpoint gets called twice, so we need to mock it twice
    cy.mockNodeCloudRequest({
      url: '/studio/config?projectSlug=n69px6',
      method: 'get',
      body: { AI: { enabled: false, disabledReason: 'studio_ai_feature_flag_disabled' }, featureFlags: { studioAI: false } },
    })

    launchStudio()

    // Verify that AI is coming soon
    cy.get('[data-cy="ai-status-text"]').should('contain.text', 'Coming soon')
  })
})
