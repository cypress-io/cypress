import { launchStudio, loadProjectAndRunSpec, assertClosingPanelWithoutChanges } from './helper'

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

  it('does not show the studio button if experimentalStudio is not enabled', () => {
    loadProjectAndRunSpec({ cliArgs: ['--config', 'experimentalStudio=false'] })

    cy.findByTestId('studio-button').should('not.exist')
  })

  it('shows the studio button if experimentalStudio is enabled', () => {
    loadProjectAndRunSpec({ cliArgs: ['--config', 'experimentalStudio=true'] })

    cy.findByTestId('studio-button').should('be.visible')
  })

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

    cy.get('.cm-line').should('contain.text', `cy.get('#increment').should('be.enabled');`)

    cy.getAutIframe().within(() => {
      cy.get('#increment').rightclick().then(() => {
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('be visible').realClick()
      })
    })

    cy.get('.cm-line').should('contain.text', `cy.get('#increment').should('be.visible');`)

    cy.getAutIframe().within(() => {
      cy.get('#increment').rightclick().then(() => {
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('have text').realHover()
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('Increment').realClick()
      })
    })

    cy.get('.cm-line').should('contain.text', `cy.get('#increment').should('have.text', 'Increment');`)

    cy.getAutIframe().within(() => {
      cy.get('#increment').rightclick().then(() => {
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('have id').realHover()
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('increment').realClick()
      })
    })

    cy.get('.cm-line').should('contain.text', `cy.get('#increment').should('have.id', 'increment');`)

    cy.getAutIframe().within(() => {
      cy.get('#increment').rightclick().then(() => {
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('have attr').realHover()
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('onclick').realClick()
      })
    })

    cy.get('.cm-line').should('contain.text', `cy.get('#increment').should('have.attr', 'onclick', 'increment()');`)

    cy.get('[data-cy="studio-save-button"]').click()

    cy.withCtx(async (ctx) => {
      const spec = await ctx.actions.file.readFileInProject('cypress/e2e/spec.cy.js')

      expect(spec.trim().replace(/\r/g, '')).to.eq(`
describe('studio functionality', () => {
  it('visits a basic html page', () => {
    cy.visit('cypress/e2e/index.html')
    cy.get('#increment').should('be.enabled');
    cy.get('#increment').should('be.visible');
    cy.get('#increment').should('have.text', 'Increment');
    cy.get('#increment').should('have.id', 'increment');
    cy.get('#increment').should('have.attr', 'onclick', 'increment()');
  })
})`.trim())
    })
  })

  it('does not update the test when it is cancelled', () => {
    launchStudio()

    incrementCounter(0)

    cy.get('.cm-line').should('contain.text', `cy.get('#increment').click();`)

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
    cy.findByTestId('studio-panel').should('not.exist')

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

  it('does not update the test when studio is closed using studio header button', () => {
    launchStudio()

    incrementCounter(0)

    cy.get('.cm-line').should('contain.text', `cy.get('#increment').click();`)

    cy.findByTestId('studio-header-studio-button').click()

    assertClosingPanelWithoutChanges()
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

  // TODO: skipping until https://github.com/cypress-io/cypress-services/issues/10425 is completed
  it.skip('creates a new test for an existing spec with the url already defined', () => {
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
    cy.findByTestId('hook-name-studio commands').closest('.hook-studio').within(() => {
      cy.get('.command').should('have.length', 1)
      cy.get('.studio-prompt').should('contain.text', 'Interact with your site to add test commands. Right click to add assertions.')
    })

    cy.findByTestId('studio-save-button').should('be.disabled')
  })

  it('removes pending commands when rerunning the test', () => {
    launchStudio()

    incrementCounter(0)

    cy.get('.cm-line').should('contain.text', `cy.get('#increment').click();`)

    cy.get('button[aria-label="Rerun all tests"]').click()

    cy.waitForSpecToFinish()

    // after reloading we should still be in studio mode but the commands should be removed
    cy.findByTestId('hook-name-studio commands').closest('.hook-studio').within(() => {
      cy.get('.command').should('have.length', 1)
      cy.get('.studio-prompt').should('contain.text', 'Interact with your site to add test commands. Right click to add assertions.')
    })

    cy.findByTestId('studio-save-button').should('be.disabled')
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

    cy.get('.cm-line').should('contain.text', `cy.get('#increment').click();`)

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

    cy.get('.cm-line').should('contain.text', `cy.get('#increment').click();`)

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

  it('writes the studio commands to the test block when the spec is updated on the file system and file watching is disabled', () => {
    launchStudio({ cliArgs: ['--config', 'watchForFileChanges=false'] })

    cy.findByTestId('record-button-recording').should('be.visible')

    incrementCounter(0)

    cy.get('.cm-line').should('contain.text', `cy.get('#increment').click();`)

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

    cy.findByTestId('studio-save-button').click()

    cy.waitForSpecToFinish({ passCount: 1 })

    cy.findByTestId('hook-name-studio commands').should('not.exist')

    // only the commands in the editor are written to the test block - ideally we should also pick up the changes from the file system
    // TODO: https://github.com/cypress-io/cypress-services/issues/11085
    cy.get('.command-name-visit').within(() => {
      cy.contains('visit')
      cy.contains('cypress/e2e/index.html')
    })

    cy.get('.command-name-get').eq(0).within(() => {
      cy.contains('get')
      cy.contains('#increment')
    })

    cy.get('.command-name-click').within(() => {
      cy.contains('click')
    })
  })

  it('remains in studio mode when the test name is changed on the file system and file watching is disabled', () => {
    launchStudio({ cliArgs: ['--config', 'watchForFileChanges=false'] })

    cy.findByTestId('record-button-recording').should('be.visible')

    incrementCounter(0)

    cy.get('.cm-line').should('contain.text', `cy.get('#increment').click();`)

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

    cy.wait(200)

    cy.findByTestId('studio-save-button').click()

    // the commands should still be there since the save failed
    cy.get('.cm-line').should('contain.text', `cy.get('#increment').click();`)

    cy.findByTestId('studio-error').should('contain.text', 'Failed to save test code')
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

    cy.findByTestId('record-button-recording').should('be.visible')

    cy.getAutIframe().within(() => {
      cy.get('#increment').realClick()
    })

    cy.findByTestId('studio-save-button').click()

    cy.location().its('hash').and('not.contain', 'testId=').and('not.contain', 'studio=')
  })

  // TODO: skipping until https://github.com/cypress-io/cypress-services/issues/10425 is completed
  it.skip('removes the studio url parameters when saving a new test', () => {
    launchStudio({ specName: 'spec-w-visit.cy.js', createNewTest: true })

    cy.location().its('hash').should('contain', 'suiteId=r2').and('contain', 'studio=')

    cy.getAutIframe().within(() => {
      cy.get('#increment').realClick()
    })

    cy.get('[data-cy="studio-save-button"]').click()
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

    cy.findByTestId('record-button-recording').should('be.visible')

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

    cy.wait(200)

    cy.findByTestId('studio-save-button').click()

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=')
  })
})
