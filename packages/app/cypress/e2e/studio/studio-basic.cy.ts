import { launchStudio, loadProjectAndRunSpec, assertClosingPanelWithoutChanges, incrementCounter } from './helper'

describe('Cypress Studio - Basic Functionality', () => {
  it('does not display the launch studio button when test is pending', () => {
    loadProjectAndRunSpec({ specName: 'skipped.cy.js' })

    cy.contains('skipped test')
    .closest('.runnable-wrapper').as('runnable-wrapper')
    .realHover()

    cy.get('@runnable-wrapper')
    .findByTestId('launch-studio')
    .should('not.exist')
  })

  it('updates an existing test with an action', () => {
    launchStudio()

    cy.findByTestId('studio-save-button').should('be.disabled')

    incrementCounter(0)

    cy.findByTestId('studio-save-button').should('be.enabled')

    cy.get('.cm-line').should('contain.text', `cy.get('#increment').click();`)

    cy.findByTestId('studio-save-button').click()

    cy.withCtx(async (ctx) => {
      const spec = await ctx.actions.file.readFileInProject('cypress/e2e/spec.cy.js')

      expect(spec.trim().replace(/\r/g, '')).to.eq(`
describe('studio functionality', () => {
  it('visits a basic html page', () => {
    cy.visit('cypress/e2e/index.html')
    cy.get('#increment').click();
  })
})`.trim())
    })

    // Studio re-executes the test after writing it file.
    cy.waitForSpecToFinish()

    // Assert the commands we input via Studio are executed.
    cy.get('.command-name-visit').within(() => {
      cy.contains('visit')
      cy.contains('cypress/e2e/index.html')
    })

    cy.get('.command-name-get').first().within(() => {
      cy.contains('get')
      cy.contains('#increment')
    })

    cy.get('.command-name-click').within(() => {
      cy.contains('click')
    })
  })

  it('does not update the test when studio is closed using studio header button', () => {
    launchStudio()

    incrementCounter(0)

    cy.get('.cm-line').should('contain.text', `cy.get('#increment').click();`)

    cy.findByTestId('studio-header-studio-button').click()

    assertClosingPanelWithoutChanges()
  })

  it('removes pending commands if the page is reloaded', () => {
    launchStudio()

    incrementCounter(0)

    cy.get('.cm-line').should('contain.text', `cy.get('#increment').click();`)

    cy.window().then((win) => {
      // calling cy.reload() or win.location.reload() confuses the test runner
      // and causes it to go to the spec list of the main runner instead of reloading the inner runner,
      // so we need to navigate to the same url to trigger a reload
      // eslint-disable-next-line no-self-assign
      win.location.href = win.location.href
    })

    cy.waitForSpecToFinish()

    // after reloading we should still be in studio mode but the commands should be removed
    // so the save button should be disabled
    cy.findByTestId('studio-save-button').should('be.disabled')
  })

  it('removes pending commands when rerunning the test', () => {
    launchStudio()

    incrementCounter(0)

    cy.get('.cm-line').should('contain.text', `cy.get('#increment').click();`)

    cy.get('button[aria-label="Rerun all tests"]').click()

    cy.waitForSpecToFinish()
    // after reloading we should still be in studio mode but the commands should be removed
    // the save button should be disabled since the commands were removed
    cy.findByTestId('studio-save-button').should('be.disabled')
  })

  it('handles clicking the open in IDE button', () => {
    launchStudio()

    cy.withCtx((ctx, o) => {
      o.sinon.stub(ctx.actions.file, 'openFile')
    })

    cy.get('[data-cy="runnable-options-button"]').click()
    cy.get('[data-cy="more-options-runnable-popover"]').should('be.visible')

    cy.get('[data-cy="runnable-popover-open-ide"]').contains('Open in IDE')
    cy.get('[data-cy="runnable-popover-open-ide"]').click()

    cy.contains('External editor preferences')

    cy.percySnapshot()
  })

  it('enables protocol for cloud studio', () => {
    launchStudio()

    cy.window().then((win) => {
      expect(win.Cypress.config('isDefaultProtocolEnabled')).to.be.false
      expect(win.Cypress.state('isProtocolEnabled')).to.be.true
    })
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

  it('supports showing and hiding a command snapshot', () => {
    launchStudio()

    incrementCounter(0)

    // hover over the visit command to show a snapshot
    cy.get('.command-name-visit').realHover()
    cy.getAutIframe().within(() => {
      // verify the count in the snapshot is 0
      cy.get('p').should('contain', 'Count is 0')
    })

    // hover over the html element to hide the snapshot
    cy.get('html').realHover()
    cy.getAutIframe().within(() => {
      // verify the count in the live page is 1
      cy.get('p').should('contain', 'Count is 1')
    })
  })
})
