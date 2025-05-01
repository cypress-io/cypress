import { launchStudio, loadProjectAndRunSpec } from './helper'
import pDefer from 'p-defer'

describe('Cypress Studio', () => {
  function incrementCounter (initialCount: number) {
    cy.getAutIframe().within(() => {
      cy.get('p').contains(`Count is ${initialCount}`)

      // (1) First Studio action - get
      cy.get('#increment')

      // (2) Second Studio action - click
      .realClick().then(() => {
        cy.get('p').contains(`Count is ${initialCount + 1}`)
      })
    })
  }

  function assertStudioHookCommandCount (num: number) {
    cy.findByTestId('hook-name-studio commands').closest('.hook-studio').within(() => {
      cy.get('.command').should('have.length', num)
    })
  }

  function assertClosingPanelWithoutChanges () {
    // Cypress re-runs after you cancel Studio.
    // Original spec should pass
    cy.waitForSpecToFinish({ passCount: 1 })

    cy.get('.command').should('have.length', 1)

    // Assert the spec was executed without any new commands.
    cy.get('.command-name-visit').within(() => {
      cy.contains('visit')
      cy.contains('cypress/e2e/index.html')
    })

    cy.findByTestId('hook-name-studio commands').should('not.exist')

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
  }

  context('cloud studio', () => {
    it('loads the studio page', () => {
      launchStudio({ enableCloudStudio: true })

      cy.window().then((win) => {
        expect(win.Cypress.config('isDefaultProtocolEnabled')).to.be.false
        expect(win.Cypress.state('isProtocolEnabled')).to.be.true
      })
    })

    it('loads the studio UI correctly when studio bundle is taking too long to load', () => {
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

    it('does not display Studio button when not using cloud studio', () => {
      loadProjectAndRunSpec({ })

      cy.get('[data-cy="studio-button"]').should('not.exist')
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

    it('closes studio panel when clicking studio button (from the cloud)', () => {
      launchStudio({ enableCloudStudio: true })

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

      const aiOutput = 'cy.get(\'button\').should(\'have.text\', \'Increment\')'

      cy.mockNodeCloudStreamingRequest({
        url: '/studio/testgen/n69px6/generate',
        method: 'post',
        body: { recommendations: [{ content: aiOutput }] },
      })

      cy.mockStudioFullSnapshot({
        id: 1,
        nodeType: 1,
        nodeName: 'div',
        localName: 'div',
        nodeValue: 'div',
        children: [],
        shadowRoots: [],
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

      // Verify that AI is enabled
      cy.get('[data-cy="ai-status-text"]').should('contain.text', 'Enabled')

      // Verify that the AI output is correct
      cy.get('[data-cy="studio-ai-output-textarea"]').should('contain.text', aiOutput)
    })
  })

  it('updates an existing test with an action', () => {
    launchStudio()

    cy.get('button').contains('Save Commands').should('be.disabled')

    incrementCounter(0)

    cy.get('button').contains('Save Commands').should('not.be.disabled')

    cy.get('.studio-command-remove').click()

    cy.get('button').contains('Save Commands').should('be.disabled')

    incrementCounter(1)

    cy.get('button').contains('Save Commands').should('not.be.disabled')

    assertStudioHookCommandCount(2)

    cy.findByTestId('hook-name-studio commands').closest('.hook-studio').within(() => {
      // (1) Get Command
      cy.get('.command-name-get').should('contain.text', '#increment')

      // (2) Click Command
      cy.get('.command-name-click').should('contain.text', 'click')
    })

    cy.get('button').contains('Save Commands').click()

    cy.withCtx(async (ctx) => {
      const spec = await ctx.actions.file.readFileInProject('cypress/e2e/spec.cy.js')

      expect(spec.trim().replace(/\r/g, '')).to.eq(`
describe('studio functionality', () => {
  it('visits a basic html page', () => {
    cy.visit('cypress/e2e/index.html')
    /* ==== Generated with Cypress Studio ==== */
    cy.get('#increment').click();
    /* ==== End Cypress Studio ==== */
  })
})`.trim())
    })

    // Studio re-executes the test after writing it file.
    // It should pass
    cy.waitForSpecToFinish({ passCount: 1 })

    // Assert the commands we input via Studio are executed.
    cy.get('.command-name-visit').within(() => {
      cy.contains('visit')
      cy.contains('cypress/e2e/index.html')
    })

    cy.get('.command-name-get').within(() => {
      cy.contains('get')
      cy.contains('#increment')
    })

    cy.get('.command-name-click').within(() => {
      cy.contains('click')
    })
  })

  it('updates an existing test with an action using studio toolbar', () => {
    launchStudio()

    cy.get('button').contains('Save Commands').should('be.disabled')

    incrementCounter(0)

    cy.get('button').contains('Save Commands').should('not.be.disabled')

    cy.get('.studio-command-remove').click()

    cy.get('button').contains('Save Commands').should('be.disabled')

    incrementCounter(1)

    cy.get('button').contains('Save Commands').should('not.be.disabled')

    assertStudioHookCommandCount(2)
    cy.findByTestId('hook-name-studio commands').closest('.hook-studio').within(() => {
      // (1) Get Command
      cy.get('.command-name-get').should('contain.text', '#increment')

      // (2) Click Command
      cy.get('.command-name-click').should('contain.text', 'click')
    })

    cy.findByTestId('studio-toolbar-controls').findByTestId('save').click()

    cy.withCtx(async (ctx) => {
      const spec = await ctx.actions.file.readFileInProject('cypress/e2e/spec.cy.js')

      expect(spec.trim().replace(/\r/g, '')).to.eq(`
describe('studio functionality', () => {
  it('visits a basic html page', () => {
    cy.visit('cypress/e2e/index.html')
    /* ==== Generated with Cypress Studio ==== */
    cy.get('#increment').click();
    /* ==== End Cypress Studio ==== */
  })
})`.trim())
    })

    // Studio re-executes the test after writing it file.
    // It should pass
    cy.waitForSpecToFinish({ passCount: 1 })

    // Assert the commands we input via Studio are executed.
    cy.get('.command-name-visit').within(() => {
      cy.contains('visit')
      cy.contains('cypress/e2e/index.html')
    })

    cy.get('.command-name-get').within(() => {
      cy.contains('get')
      cy.contains('#increment')
    })

    cy.get('.command-name-click').within(() => {
      cy.contains('click')
    })
  })

  it('updates an existing test with assertions', () => {
    launchStudio()

    cy.getAutIframe().within(() => {
      cy.get('#increment').rightclick().then(() => {
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('be enabled').realClick()
      })
    })

    assertStudioHookCommandCount(2)
    cy.getAutIframe().within(() => {
      cy.get('#increment').rightclick().then(() => {
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('be visible').realClick()
      })
    })

    assertStudioHookCommandCount(4)

    cy.getAutIframe().within(() => {
      cy.get('#increment').rightclick().then(() => {
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('have text').realHover()
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('Increment').realClick()
      })
    })

    assertStudioHookCommandCount(6)

    cy.getAutIframe().within(() => {
      cy.get('#increment').rightclick().then(() => {
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('have id').realHover()
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('increment').realClick()
      })
    })

    assertStudioHookCommandCount(8)

    cy.getAutIframe().within(() => {
      cy.get('#increment').rightclick().then(() => {
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('have attr').realHover()
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('onclick').realClick()
      })
    })

    assertStudioHookCommandCount(10)

    cy.findByTestId('hook-name-studio commands').closest('.hook-studio').within(() => {
      // 10 Commands - 5 assertions, each is a child of the subject's `cy.get`
      cy.get('.command').should('have.length', 10)

      // 5x cy.get Commands
      cy.get('.command-name-get').should('have.length', 5)

      // 5x Assertion Commands
      cy.get('.command-name-assert').should('have.length', 5)

      // (1) Assert Enabled
      cy.get('.command-name-assert').should('contain.text', 'expected <button#increment> to be enabled')

      // (2) Assert Visible
      cy.get('.command-name-assert').should('contain.text', 'expected <button#increment> to be visible')

      // (3) Assert Text
      cy.get('.command-name-assert').should('contain.text', 'expected <button#increment> to have text Increment')

      // (4) Assert Id
      cy.get('.command-name-assert').should('contain.text', 'expected <button#increment> to have id increment')

      // (5) Assert Attr
      cy.get('.command-name-assert').should('contain.text', 'expected <button#increment> to have attr onclick with the value increment()')
    })

    cy.get('button').contains('Save Commands').click()

    cy.withCtx(async (ctx) => {
      const spec = await ctx.actions.file.readFileInProject('cypress/e2e/spec.cy.js')

      expect(spec.trim().replace(/\r/g, '')).to.eq(`
describe('studio functionality', () => {
  it('visits a basic html page', () => {
    cy.visit('cypress/e2e/index.html')
    /* ==== Generated with Cypress Studio ==== */
    cy.get('#increment').should('be.enabled');
    cy.get('#increment').should('be.visible');
    cy.get('#increment').should('have.text', 'Increment');
    cy.get('#increment').should('have.id', 'increment');
    cy.get('#increment').should('have.attr', 'onclick', 'increment()');
    /* ==== End Cypress Studio ==== */
  })
})`.trim())
    })
  })

  it('does not update the test when it is cancelled', () => {
    launchStudio()

    incrementCounter(0)

    assertStudioHookCommandCount(2)
    cy.findByTestId('hook-name-studio commands').closest('.hook-studio').within(() => {
      // (1) Get Command
      cy.get('.command-name-get').should('contain.text', '#increment')

      // (2) Click Command
      cy.get('.command-name-click').should('contain.text', 'click')
    })

    cy.get('a').contains('Cancel').click()

    // Cypress re-runs after you cancel Studio.
    // Original spec should pass
    cy.waitForSpecToFinish({ passCount: 1 })

    cy.get('.command').should('have.length', 1)

    // Assert the spec was executed without any new commands.
    cy.get('.command-name-visit').within(() => {
      cy.contains('visit')
      cy.contains('cypress/e2e/index.html')
    })

    cy.findByTestId('hook-name-studio commands').should('not.exist')

    cy.withCtx(async (ctx) => {
      const spec = await ctx.actions.file.readFileInProject('cypress/e2e/spec.cy.js')

      // No change, since we cancelled.
      expect(spec.trim().replace(/\r/g, '')).to.eq(`
describe('studio functionality', () => {
  it('visits a basic html page', () => {
    cy.visit('cypress/e2e/index.html')
  })
})`.trim())
    })
  })

  it('does not update the test when studio is closed using studio toolbar', () => {
    launchStudio()

    incrementCounter(0)

    assertStudioHookCommandCount(2)
    cy.findByTestId('hook-name-studio commands').closest('.hook-studio').within(() => {
      // (1) Get Command
      cy.get('.command-name-get').should('contain.text', '#increment')

      // (2) Click Command
      cy.get('.command-name-click').should('contain.text', 'click')
    })

    cy.findByTestId('studio-toolbar-controls').findByTestId('close-studio').click()

    assertClosingPanelWithoutChanges()
  })

  it('removes pending commands when restarting studio', () => {
    launchStudio()

    cy.findByTestId('hook-name-studio commands').closest('.hook-studio').within(() => {
      cy.get('.command').should('have.length', 1)
      cy.get('.studio-prompt').should('contain.text', 'Interact with your site to add test commands. Right click to add assertions.')
    })

    incrementCounter(0)

    assertStudioHookCommandCount(2)
    cy.findByTestId('hook-name-studio commands').closest('.hook-studio').within(() => {
      // (1) Get Command
      cy.get('.command-name-get').should('contain.text', '#increment')

      // (2) Click Command
      cy.get('.command-name-click').should('contain.text', 'click')
    })

    cy.findByTestId('studio-toolbar').findByTestId('restart-studio').click()

    cy.waitForSpecToFinish()

    // all of the pending studio commands should have been removed
    cy.findByTestId('hook-name-studio commands').closest('.hook-studio').within(() => {
      cy.get('.command').should('have.length', 1)
      cy.get('.studio-prompt').should('contain.text', 'Interact with your site to add test commands. Right click to add assertions.')
    })

    cy.withCtx(async (ctx) => {
      const spec = await ctx.actions.file.readFileInProject('cypress/e2e/spec.cy.js')

      // No change, since we cancelled.
      expect(spec.trim().replace(/\r/g, '')).to.eq(`
describe('studio functionality', () => {
  it('visits a basic html page', () => {
    cy.visit('cypress/e2e/index.html')
  })
})`.trim())
    })
  })

  it('creates a new test from an empty spec', () => {
    loadProjectAndRunSpec({ specName: 'empty.cy.js', specSelector: 'title' })

    cy.contains('Create test with Cypress Studio').click()
    cy.findByTestId('aut-url').as('urlPrompt')

    cy.get('@urlPrompt').within(() => {
      cy.contains('Continue ➜').should('be.disabled')
    })

    cy.get('@urlPrompt').type('/cypress/e2e/index.html')

    cy.get('@urlPrompt').within(() => {
      cy.contains('Continue ➜').click()
    })

    cy.get('button').contains('Save Commands').click()

    // the save button is disabled until we add a test name
    cy.get('button[type=submit]').should('be.disabled')

    cy.get('#testName').type('new-test')

    cy.get('button[type=submit]').click()

    // Cypress re-runs after the new test is saved.
    cy.waitForSpecToFinish({ passCount: 1 })

    cy.get('.command').should('have.length', 1)
    cy.get('.command-name-visit').within(() => {
      cy.contains('visit')
      cy.contains('cypress/e2e/index.html')
    })

    cy.findByTestId('hook-name-studio commands').should('not.exist')

    cy.withCtx(async (ctx) => {
      const spec = await ctx.actions.file.readFileInProject('cypress/e2e/empty.cy.js')

      expect(spec.trim().replace(/\r/g, '')).to.equal(`
/* ==== Test Created with Cypress Studio ==== */
it('new-test', function() {
  /* ==== Generated with Cypress Studio ==== */
  cy.visit('/cypress/e2e/index.html');
  /* ==== End Cypress Studio ==== */
});
`.trim())
    })
  })

  it('creates a new test for an existing spec', () => {
    launchStudio({ createNewTest: true })

    cy.findByTestId('aut-url').as('urlPrompt')

    cy.get('@urlPrompt').within(() => {
      cy.contains('Continue ➜').should('be.disabled')
    })

    cy.get('@urlPrompt').type('/cypress/e2e/index.html')

    cy.get('@urlPrompt').within(() => {
      cy.contains('Continue ➜').click()
    })

    cy.get('button').contains('Save Commands').click()

    // the save button is disabled until we add a test name
    cy.get('button[type=submit]').should('be.disabled')

    cy.get('#testName').type('new-test')

    cy.get('button[type=submit]').click()

    // Cypress re-runs after the new test is saved.
    cy.waitForSpecToFinish({ passCount: 2 })

    cy.contains('new-test').click()
    cy.get('.command').should('have.length', 1)
    cy.get('.command-name-visit').within(() => {
      cy.contains('visit')
      cy.contains('cypress/e2e/index.html')
    })

    cy.findByTestId('hook-name-studio commands').should('not.exist')

    cy.withCtx(async (ctx) => {
      const spec = await ctx.actions.file.readFileInProject('cypress/e2e/spec.cy.js')

      expect(spec.trim().replace(/\r/g, '')).to.equal(`
describe('studio functionality', () => {
  it('visits a basic html page', () => {
    cy.visit('cypress/e2e/index.html')
  })

  /* ==== Test Created with Cypress Studio ==== */
  it('new-test', function() {
    /* ==== Generated with Cypress Studio ==== */
    cy.visit('/cypress/e2e/index.html');
    /* ==== End Cypress Studio ==== */
  });
})
`.trim())
    })
  })

  // TODO: this test fails in CI but passes locally
  // http://github.com/cypress-io/cypress/issues/31248
  it.skip('creates a new test with a url that changes top', function () {
    launchStudio({ specName: 'spec-w-foobar.cy.js', createNewTest: true })

    cy.origin('http://foobar.com:4455', () => {
      Cypress.require('../support/execute-spec')
      Cypress.require('cypress-real-events/support')
      Cypress.require('@packages/frontend-shared/cypress/support/e2e')
    })

    cy.findByTestId('aut-url').as('urlPrompt')

    cy.get('@urlPrompt').within(() => {
      cy.contains('Continue ➜').should('be.disabled')
    })

    // go to a cross-origin url
    cy.get('@urlPrompt').type('http://foobar.com:4455/cypress/e2e/index.html')

    cy.get('@urlPrompt').within(() => {
      cy.contains('Continue ➜').click()
    })

    cy.origin('http://foobar.com:4455', () => {
      cy.get('button').contains('Save Commands').click()

      // the save button is disabled until we add a test name
      cy.get('button[type=submit]').should('be.disabled')

      cy.get('#testName').type('new-test')

      cy.get('button[type=submit]').click()

      // Cypress re-runs after the new test is saved.
      cy.waitForSpecToFinish({ passCount: 2 })

      cy.contains('new-test').click()
      cy.get('.command').should('have.length', 1)
      cy.get('.command-name-visit').within(() => {
        cy.contains('visit')
        cy.contains('cypress/e2e/index.html')
      })

      cy.findByTestId('hook-name-studio commands').should('not.exist')
    })

    cy.withCtx(async (ctx) => {
      const spec = await ctx.actions.file.readFileInProject('cypress/e2e/spec-w-foobar.cy.js')

      expect(spec.trim().replace(/\r/g, '')).to.equal(`
describe('studio functionality', () => {
  beforeEach(() => {
    cy.intercept('GET', 'http://foobar.com:4455/cypress/e2e/index.html', {
      statusCode: 200,
      body: '<html><body><h1>hello world</h1></body></html>',
      headers: {
        'content-type': 'text/html',
      },
    })
  })

  it('visits a basic html page', () => {
    cy.visit('cypress/e2e/index.html')
  })

  /* ==== Test Created with Cypress Studio ==== */
  it('new-test', function() {
    /* ==== Generated with Cypress Studio ==== */
    cy.visit('http://foobar.com:4455/cypress/e2e/index.html');
    /* ==== End Cypress Studio ==== */
  });
})`.trim())
    })
  })

  it('creates a new test for an existing spec with the url already defined', () => {
    launchStudio({ specName: 'spec-w-visit.cy.js', createNewTest: true })

    incrementCounter(0)

    cy.get('button').contains('Save Commands').click()

    // the save button is disabled until we add a test name
    cy.get('button[type=submit]').should('be.disabled')

    cy.get('#testName').type('new-test')

    cy.get('button[type=submit]').click()

    // Cypress re-runs after the new test is saved.
    cy.waitForSpecToFinish({ passCount: 2 })

    cy.contains('new-test').click()

    cy.get('.command').should('have.length', 3)

    // Assert the commands we input via Studio are executed.
    cy.get('.command-name-visit').within(() => {
      cy.contains('visit')
      cy.contains('cypress/e2e/index.html')
    })

    cy.get('.command-name-get').within(() => {
      cy.contains('get')
      cy.contains('#increment')
    })

    cy.get('.command-name-click').within(() => {
      cy.contains('click')
    })

    cy.findByTestId('hook-name-studio commands').should('not.exist')

    cy.withCtx(async (ctx) => {
      const spec = await ctx.actions.file.readFileInProject('cypress/e2e/spec-w-visit.cy.js')

      expect(spec.trim().replace(/\r/g, '')).to.equal(`
describe('studio functionality', () => {
  beforeEach(() => {
    cy.visit('cypress/e2e/index.html')
  })

  it('visits a basic html page', () => {
    cy.get('h1').should('have.text', 'Hello, Studio!')
  })

  /* ==== Test Created with Cypress Studio ==== */
  it('new-test', function() {
    /* ==== Generated with Cypress Studio ==== */
    cy.get('#increment').click();
    /* ==== End Cypress Studio ==== */
  });
})
`.trim())
    })
  })

  it('does not create a new test if the Save test modal is closed', () => {
    loadProjectAndRunSpec({ specName: 'empty.cy.js', specSelector: 'title' })

    cy.waitForSpecToFinish()

    cy.contains('Create test with Cypress Studio').click()
    cy.findByTestId('aut-url').as('urlPrompt')

    cy.get('@urlPrompt').within(() => {
      cy.contains('Continue ➜').should('be.disabled')
    })

    cy.get('@urlPrompt').type('/cypress/e2e/index.html')

    cy.get('@urlPrompt').within(() => {
      cy.contains('Continue ➜').click()
    })

    cy.getAutIframe().within(() => {
      cy.get('p').contains('Count is 0')
      cy.get('#increment').realClick()
    })

    cy.contains('button', 'Save Commands').click()

    cy.get('#testName').type('new-test')

    cy.get('button[aria-label=Close]').click()

    // all of the existing studio commands should still be there since we didn't save
    cy.findByTestId('hook-name-studio commands').closest('.hook-studio').within(() => {
      cy.get('.command').should('have.length', 3)
      cy.get('.command-name-visit').should('contain.text', '/cypress/e2e/index.html')
      cy.get('.command-name-get').should('contain.text', '#increment')
      cy.get('.command-name-click').should('contain.text', 'click')
    })
  })

  it('shows assertions menu and submenu correctly', () => {
    launchStudio()

    cy.getAutIframe().within(() => {
      // Show menu
      cy.get('h1').realClick({
        button: 'right',
      })

      cy.get('.__cypress-studio-assertions-menu').shadow()
      .find('.assertions-menu').should('be.visible')

      // Show submenu
      cy.get('.__cypress-studio-assertions-menu').shadow()
      .find('.assertion-type-text:first').realHover()

      cy.get('.__cypress-studio-assertions-menu').shadow()
      .find('.assertion-option')
      .should('have.text', 'Hello, Studio!')
      .should('be.visible')
    })
  })

  it('copies the studio commands to the clipboard', () => {
    launchStudio()

    incrementCounter(0)

    // spy on the clipboard to check if the commands are copied
    cy.window().its('navigator.clipboard').then((clipboard) => {
      cy.spy(clipboard, 'writeText').as('writeText')
    })

    cy.get('button.studio-copy').click()

    if (Cypress.platform === 'win32') {
      cy.get('@writeText').should('have.been.calledOnceWith', '/* ==== Generated with Cypress Studio ==== */\r\ncy.get(\'#increment\').click();\r\n/* ==== End Cypress Studio ==== */')
    } else {
      cy.get('@writeText').should('have.been.calledOnceWith', '/* ==== Generated with Cypress Studio ==== */\ncy.get(\'#increment\').click();\n/* ==== End Cypress Studio ==== */')
    }
  })

  it('copies the studio commands to the clipboard using studio toolbar', () => {
    launchStudio()

    incrementCounter(0)

    // spy on the clipboard to check if the commands are copied
    cy.window().its('navigator.clipboard').then((clipboard) => {
      cy.spy(clipboard, 'writeText').as('writeText')
    })

    cy.findByTestId('studio-toolbar-controls').findByTestId('copy-commands').click()

    if (Cypress.platform === 'win32') {
      cy.get('@writeText').should('have.been.calledOnceWith', '/* ==== Generated with Cypress Studio ==== */\r\ncy.get(\'#increment\').click();\r\n/* ==== End Cypress Studio ==== */')
    } else {
      cy.get('@writeText').should('have.been.calledOnceWith', '/* ==== Generated with Cypress Studio ==== */\ncy.get(\'#increment\').click();\n/* ==== End Cypress Studio ==== */')
    }
  })

  it('removes pending commands if the page is reloaded', () => {
    launchStudio()

    incrementCounter(0)

    cy.findByTestId('hook-name-studio commands').closest('.hook-studio').within(() => {
      cy.get('.command').should('have.length', 2)
      // (1) Get Command
      cy.get('.command-name-get').should('contain.text', '#increment')

      // (2) Click Command
      cy.get('.command-name-click').should('contain.text', 'click')
    })

    cy.window().then((win) => {
      // calling cy.reload() or win.location.reload() confuses the test runner
      // and causes it to go to the spec list of the main runner instead of reloading the inner runner,
      // so we need to navigate to the same url to trigger a reload
      // eslint-disable-next-line no-self-assign
      win.location.href = win.location.href
    })

    cy.waitForSpecToFinish()

    // after reloading we should still be in studio mode but the commands should be removed
    cy.findByTestId('hook-name-studio commands').closest('.hook-studio').within(() => {
      cy.get('.command').should('have.length', 1)
      cy.get('.studio-prompt').should('contain.text', 'Interact with your site to add test commands. Right click to add assertions.')
    })

    cy.findByTestId('studio-toolbar-controls').findByTestId('save').should('be.disabled')
  })

  it('removes pending commands when rerunning the test', () => {
    launchStudio()

    incrementCounter(0)

    assertStudioHookCommandCount(2)
    cy.findByTestId('hook-name-studio commands').closest('.hook-studio').within(() => {
      // (1) Get Command
      cy.get('.command-name-get').should('contain.text', '#increment')

      // (2) Click Command
      cy.get('.command-name-click').should('contain.text', 'click')
    })

    cy.get('button[aria-label="Rerun all tests"]').click()

    cy.waitForSpecToFinish()

    // after reloading we should still be in studio mode but the commands should be removed
    cy.findByTestId('hook-name-studio commands').closest('.hook-studio').within(() => {
      cy.get('.command').should('have.length', 1)
      cy.get('.studio-prompt').should('contain.text', 'Interact with your site to add test commands. Right click to add assertions.')
    })

    cy.findByTestId('studio-toolbar-controls').findByTestId('save').should('be.disabled')
  })

  it('does not re-enter studio mode when changing pages and then coming back', () => {
    launchStudio()

    cy.findByTestId('hook-name-studio commands')

    // go to the runs page
    cy.findByTestId('sidebar-link-runs-page').click()

    // go back to the specs page
    cy.findByTestId('sidebar-link-specs-page').click()
    cy.contains('spec.cy.js').click()

    cy.waitForSpecToFinish({ passCount: 1 })

    cy.findByTestId('hook-name-studio commands').should('not.exist')
    cy.location().its('hash').should('not.contain', 'testId=').and('not.contain', 'studio=')
  })

  it('exits studio mode if the spec is changed on the file system', () => {
    launchStudio()

    incrementCounter(0)

    assertStudioHookCommandCount(2)
    cy.findByTestId('hook-name-studio commands').closest('.hook-studio').within(() => {
      // (1) Get Command
      cy.get('.command-name-get').should('contain.text', '#increment')

      // (2) Click Command
      cy.get('.command-name-click').should('contain.text', 'click')
    })

    // update the spec on the file system
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress/e2e/spec.cy.js', `
describe('studio functionality', () => {
  it('visits a basic html page', () => {
    cy.visit('cypress/e2e/index.html')

    // new command
    cy.get('h1').should('have.text', 'Hello, Studio!')
  })
})`)
    })

    cy.waitForSpecToFinish({ passCount: 1 })

    cy.findByTestId('hook-name-studio commands').should('not.exist')

    // assert the commands we wrote directly to the spec are executed
    cy.get('.command-name-visit').within(() => {
      cy.contains('visit')
      cy.contains('cypress/e2e/index.html')
    })

    cy.get('.command-name-get').within(() => {
      cy.contains('get')
      cy.contains('h1')
    })

    cy.get('.command-name-assert').within(() => {
      cy.contains('assert')
      cy.contains('expected <h1> to have text Hello, Studio!')
    })
  })

  it('exits studio mode if the spec is removed on the file system', () => {
    launchStudio()

    incrementCounter(0)

    assertStudioHookCommandCount(2)
    cy.findByTestId('hook-name-studio commands').closest('.hook-studio').within(() => {
      cy.get('.command').should('have.length', 2)
      // (1) Get Command
      cy.get('.command-name-get').should('contain.text', '#increment')

      // (2) Click Command
      cy.get('.command-name-click').should('contain.text', 'click')
    })

    // update the spec on the file system
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.removeFileInProject('cypress/e2e/spec.cy.js')
    })

    cy.location().its('hash').should('equal', '#/specs').and('not.contain', 'testId=').and('not.contain', 'studio=')
    cy.findByTestId('alert').should('contain.text', 'Spec not found')

    if (Cypress.platform === 'win32') {
      cy.findByTestId('alert-body').should('contain.text', 'There is no spec matching the following location: cypress\\e2e\\spec.cy.js')
    } else {
      cy.findByTestId('alert-body').should('contain.text', 'There is no spec matching the following location: cypress/e2e/spec.cy.js')
    }
  })

  it('appends the studio commands to the commands added to the test on the file system when file watching is disabled', () => {
    launchStudio({ cliArgs: ['--config', 'watchForFileChanges=false'] })

    incrementCounter(0)

    assertStudioHookCommandCount(2)
    cy.findByTestId('hook-name-studio commands').closest('.hook-studio').within(() => {
      // (1) Get Command
      cy.get('.command-name-get').should('contain.text', '#increment')

      // (2) Click Command
      cy.get('.command-name-click').should('contain.text', 'click')
    })

    // update the spec on the file system
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress/e2e/spec.cy.js', `
describe('studio functionality', () => {
  it('visits a basic html page', () => {
    cy.visit('cypress/e2e/index.html')

    // new command
    cy.get('h1').should('have.text', 'Hello, Studio!')
  })
})`)
    })

    cy.get('button').contains('Save Commands').click()

    cy.waitForSpecToFinish({ passCount: 1 })

    cy.findByTestId('hook-name-studio commands').should('not.exist')

    // assert the commands we wrote directly to the spec are executed
    cy.get('.command-name-visit').within(() => {
      cy.contains('visit')
      cy.contains('cypress/e2e/index.html')
    })

    cy.get('.command-name-get').eq(0).within(() => {
      cy.contains('get')
      cy.contains('h1')
    })

    cy.get('.command-name-assert').within(() => {
      cy.contains('assert')
      cy.contains('expected <h1> to have text Hello, Studio!')
    })

    cy.get('.command-name-get').eq(1).within(() => {
      cy.contains('get')
      cy.contains('#increment')
    })

    cy.get('.command-name-click').within(() => {
      cy.contains('click')
    })
  })

  it('remains in studio mode when the test name is changed on the file system and file watching is disabled', () => {
    launchStudio({ cliArgs: ['--config', 'watchForFileChanges=false'] })

    incrementCounter(0)

    assertStudioHookCommandCount(2)
    cy.findByTestId('hook-name-studio commands').closest('.hook-studio').within(() => {
      // (1) Get Command
      cy.get('.command-name-get').should('contain.text', '#increment')

      // (2) Click Command
      cy.get('.command-name-click').should('contain.text', 'click')
    })

    // update the spec on the file system by changing the
    // test name which will cause the save to fail since
    // the test won't be found
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress/e2e/spec.cy.js', `
describe('studio functionality', () => {
  it('CHANGED - visits a basic html page', () => {
    cy.visit('cypress/e2e/index.html')

    // new command
    cy.get('h1').should('have.text', 'Hello, Studio!')
  })
})`)
    })

    cy.findByTestId('studio-toolbar-controls')

    cy.get('button').contains('Save Commands').click()

    cy.findByTestId('studio-toolbar-controls')
    cy.get('button').contains('Save Commands')

    cy.findByTestId('hook-name-studio commands').closest('.hook-studio').within(() => {
      cy.get('.command').should('have.length', 2)
      // (1) Get Command
      cy.get('.command-name-get').should('contain.text', '#increment')

      // (2) Click Command
      cy.get('.command-name-click').should('contain.text', 'click')
    })
  })

  it('removes url parameters when selecting a different spec', () => {
    launchStudio()

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=')

    // select a different spec
    cy.get('[aria-controls=reporter-inline-specs-list]').click()
    cy.get('a').contains('spec-w-visit.cy.js').click()
    cy.get('[aria-controls=reporter-inline-specs-list]').click()

    cy.location().its('hash').should('not.contain', 'testId=').and('not.contain', 'studio=')
  })

  it('removes url parameters when going to a different page', () => {
    launchStudio()

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=')

    // go to the runs page
    cy.findByTestId('sidebar-link-runs-page').click()

    cy.location().its('hash').should('contain', '/runs').and('not.contain', 'testId=').and('not.contain', 'studio=')
  })

  it('updates the url with the testId and studio parameters when entering studio with a test', () => {
    launchStudio()

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=')
  })

  it('update the url with the suiteId and studio parameters when entering studio with a suite', () => {
    launchStudio({ createNewTest: true })

    cy.location().its('hash').should('contain', 'suiteId=r2').and('contain', 'studio=')
  })

  it('removes the studio url parameters when saving test changes', () => {
    launchStudio()

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=')

    cy.getAutIframe().within(() => {
      cy.get('#increment').realClick()
    })

    cy.get('button').contains('Save Commands').click()

    cy.location().its('hash').and('not.contain', 'testId=').and('not.contain', 'studio=')
  })

  it('removes the studio url parameters when saving a new test', () => {
    launchStudio({ specName: 'spec-w-visit.cy.js', createNewTest: true })

    cy.location().its('hash').should('contain', 'suiteId=r2').and('contain', 'studio=')

    cy.getAutIframe().within(() => {
      cy.get('#increment').realClick()
    })

    cy.get('button').contains('Save Commands').click()
    cy.get('#testName').type('new-test')
    cy.get('button[type=submit]').click()

    cy.location().its('hash').and('not.contain', 'suiteId=').and('not.contain', 'studio=')
  })

  it('removes the studio url parameters when cancelling test changes', () => {
    launchStudio()

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=')

    cy.get('a').contains('Cancel').click()

    cy.location().its('hash').and('not.contain', 'testId=').and('not.contain', 'studio=')
  })

  it('removes the studio url parameters when cancelling a new test', () => {
    launchStudio({ specName: 'spec-w-visit.cy.js', createNewTest: true })

    cy.location().its('hash').should('contain', 'suiteId=r2').and('contain', 'studio=')

    cy.get('a').contains('Cancel').click()

    cy.location().its('hash').and('not.contain', 'suiteId=').and('not.contain', 'studio=')
  })

  it('does not remove the studio url parameters if saving fails', () => {
    launchStudio({ cliArgs: ['--config', 'watchForFileChanges=false'] })

    incrementCounter(0)

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=')

    // update the spec on the file system by changing the
    // test name which will cause the save to fail since
    // the test won't be found
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress/e2e/spec.cy.js', `
describe('studio functionality', () => {
  it('CHANGED - visits a basic html page', () => {
    cy.visit('cypress/e2e/index.html')

    // new command
    cy.get('h1').should('have.text', 'Hello, Studio!')
  })
})`)
    })

    cy.get('button').contains('Save Commands').click()

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=')
  })
})
