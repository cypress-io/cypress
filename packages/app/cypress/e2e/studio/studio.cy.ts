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

  it('updates an existing test with assertions', () => {
    launchStudio()

    cy.waitForSpecToFinish()

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

  it('does not update the test when studio is closed using studio header button', () => {
    launchStudio()

    incrementCounter(0)

    cy.get('.cm-line').should('contain.text', `cy.get('#increment').click();`)

    cy.findByTestId('studio-header-studio-button').click()

    assertClosingPanelWithoutChanges()
  })

  it('does not enter single test mode when creating a new test', () => {
    launchStudio({ specName: 'spec-w-multiple-tests.cy.js', createNewTest: true })

    // verify we are not in single test mode
    cy.get('.runnable-title').should('have.length', 4)
    cy.get('.runnable-title').its(0).should('have.text', 'studio functionality')
    cy.get('.runnable-title').its(1).should('contain.text', 'visits a basic html page')
    cy.get('.runnable-title').its(2).should('contain.text', 'visits a basic html page 2')
    cy.get('.runnable-title').its(3).should('contain.text', 'visits a basic html page 3')
  })

  it('creates a new test from an empty spec with url already defined', () => {
    launchStudio({ specName: 'spec-w-visit.cy.js', createNewTest: true })

    cy.findByTestId('new-test-button').click()
    cy.findByTestId('test-name-input').type('new-test')
    cy.findByTestId('create-test-button').click()

    cy.contains('new-test').click()

    // verify recording is enabled to ensure the panel is fully ready
    cy.findByTestId('record-button-recording').should('have.text', 'Recording...')

    cy.get('.studio-single-test-container').should('be.visible')

    cy.percySnapshot()

    incrementCounter(0)

    cy.findByTestId('studio-save-button').click()

    // we should have the commands we executed after we save
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

  it('new-test', function() {

cy.get('#increment').click();
  });
})`.trim())
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

  it('creates a new test for a specific suite with the url already defined', () => {
    launchStudio({ specName: 'spec-w-visit.cy.js', createNewTest: true })

    // create a new test from a specific suite
    cy.findByTestId('create-new-test-button').click()

    cy.findByTestId('new-test-button').click()
    cy.findByTestId('test-name-input').type('new-test')
    cy.findByTestId('create-test-button').click()

    cy.contains('new-test').click()

    // verify recording is enabled to ensure the panel is fully ready
    cy.findByTestId('record-button-recording').should('have.text', 'Recording...')

    cy.get('.studio-single-test-container').should('be.visible')

    cy.percySnapshot()

    incrementCounter(0)

    cy.findByTestId('studio-save-button').click()

    // we should have the commands we executed after we save
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

  it('new-test', function() {

cy.get('#increment').click();
  });
})`.trim())
    })
  })

  describe('assertions menu', () => {
    const showAssertionsMenu = (autAssertions?: () => void) => {
      launchStudio()

      cy.waitForSpecToFinish()

      cy.contains('No commands were issued in this test.').should('not.exist')

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

        autAssertions?.()
      })
    }

    const showAssertionsMenuForModal = (autAssertions?: () => void) => {
      launchStudio({ specName: 'spec-w-modal.cy.js' })

      cy.waitForSpecToFinish()

      cy.contains('No commands were issued in this test.').should('not.exist')

      cy.getAutIframe().within(() => {
        // Show menu
        cy.get('.modal-body').realClick({
          button: 'right',
        })

        cy.get('.__cypress-studio-assertions-menu').shadow()
        .find('.assertions-menu').should('be.visible')

        // Show submenu
        cy.get('.__cypress-studio-assertions-menu').shadow()
        .find('.assertion-type-text:first').realHover()

        cy.get('.__cypress-studio-assertions-menu').shadow()
        .find('.assertion-option')
        .should('have.text', 'Semi-transparent background overlay')
        .should('be.visible')

        autAssertions?.()
      })
    }

    const assertionsMenuFns = [
      { fn: showAssertionsMenu, name: 'handles normal element' },
      { fn: showAssertionsMenuForModal, name: 'handles high z-index modal' },
    ]

    assertionsMenuFns.forEach(({ fn, name }) => {
      it(`${name} - shows assertions menu and submenu correctly`, () => {
        fn()
      })

      it(`${name} - closes assertions menu when clicking outside`, () => {
        fn(() => {
          // click outside the menu
          cy.get('.__cypress-studio-assertions-menu').shadow().find('.vue-container').click()
          // check that the menu is closed
          cy.get('.__cypress-studio-assertions-menu').should('not.exist')
        })
      })

      it(`${name} - closes assertions menu on the highlighted element`, () => {
        fn(() => {
          // click on the highlighted element
          cy.get('.__cypress-studio-assertions-menu').shadow().find('.highlight').click()
          // check that the menu is closed
          cy.get('.__cypress-studio-assertions-menu').should('not.exist')
        })
      })
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

  it('does not re-enter studio mode when changing pages and then coming back', () => {
    launchStudio()
    // go to the runs page
    cy.findByTestId('sidebar-link-runs-page').click()

    // go back to the specs page
    cy.findByTestId('sidebar-link-specs-page').click()
    cy.contains('spec.cy.js').click()

    cy.waitForSpecToFinish({ passCount: 1 })

    cy.location().its('hash').should('not.contain', 'testId=').and('not.contain', 'studio=')
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

    cy.waitForSpecToFinish()

    // only the commands in the editor are written to the test block - ideally we should also pick up the changes from the file system
    // TODO: https://github.com/cypress-io/cypress-services/issues/11085
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

  it('handles clicking the open in IDE button', () => {
    launchStudio()

    cy.withCtx((ctx, o) => {
      o.sinon.stub(ctx.actions.file, 'openFile')
    })

    cy.get('.open-in-ide-button').should('have.css', 'opacity', '0')
    cy.get('.spec-file-name').first().realHover()
    cy.get('.open-in-ide-button').first().should('have.css', 'opacity', '1').click()
    cy.get('.open-in-ide-button').first().contains('Open in IDE')

    cy.percySnapshot()
  })

  it('handles back button in single test view', () => {
    launchStudio()

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=')

    cy.get('[data-cy="studio-back-button"]').click()

    cy.location().its('hash').should('not.contain', 'testId=').and('not.contain', 'studio=')

    cy.get('.runnable-title').eq(0).should('contain.text', 'studio functionality')
    cy.get('.runnable-title').eq(1).should('contain.text', 'visits a basic html page')
  })

  it('updates the AUT url when navigating to a different page', () => {
    launchStudio({ specName: 'navigation.cy.js' })

    cy.findByTestId('aut-url-input').should('have.value', 'http://localhost:4455/cypress/e2e/navigation.html')

    cy.getAutIframe().within(() => {
      cy.get('a').contains('Index').realClick()
    })

    cy.findByTestId('aut-url-input').should('have.value', 'http://localhost:4455/cypress/e2e/index.html')
  })

  it('updates the AUT url when creating a new test', () => {
    launchStudio({ specName: 'navigation.cy.js', createNewTest: true })

    cy.findByTestId('new-test-button').click()
    cy.findByTestId('test-name-input').type('new-test')
    cy.findByTestId('create-test-button').click()

    cy.findByTestId('aut-url-input').should('have.focus').type('cypress/e2e/navigation.html{enter}')

    // after entering the url, the test is saved and re-run
    cy.waitForSpecToFinish()

    cy.findByTestId('aut-url-input').should('have.value', 'http://localhost:4455/cypress/e2e/navigation.html')
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

  it('updates the studio url parameters and displays the single test view after creating a new test', () => {
    loadProjectAndRunSpec()

    // open the studio panel to create a new test in the root suite
    cy.findByTestId('studio-button').click()
    cy.location().its('hash').should('contain', 'suiteId=r1').and('contain', 'studio=')

    // create a new test in the root suite
    cy.findByTestId('new-test-button').click()
    cy.findByTestId('test-name-input').type('new-test')
    cy.findByTestId('create-test-button').click()

    // the studio url parameters should be removed
    cy.location().its('hash').and('not.contain', 'suiteId=').and('contain', 'studio=').and('contain', 'testId=r2')

    cy.get('.studio-single-test-container').should('be.visible')

    cy.percySnapshot()
  })

  it('does not remove the studio url parameters when saving test changes', () => {
    launchStudio()

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=')

    cy.findByTestId('record-button-recording').should('be.visible')

    cy.waitForSpecToFinish()

    cy.getAutIframe().within(() => {
      cy.get('#increment').realClick()
    })

    cy.findByTestId('studio-save-button').click()

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=')
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

  it('removes the studio url parameters when closing studio existing test with the back button', () => {
    launchStudio()

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=')

    cy.get('[data-cy="studio-back-button"]').click()

    cy.location().its('hash').and('not.contain', 'testId=').and('not.contain', 'studio=')
  })

  it('removes the studio url parameters when closing studio existing test with the studio header button', () => {
    launchStudio()

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=')

    cy.findByTestId('studio-header-studio-button').click()

    cy.location().its('hash').and('not.contain', 'testId=').and('not.contain', 'studio=')
  })

  it('removes the studio url parameters when closing studio new test', () => {
    launchStudio({ specName: 'spec-w-visit.cy.js', createNewTest: true })

    cy.location().its('hash').should('contain', 'suiteId=r2').and('contain', 'studio=')

    cy.findByTestId('studio-header-studio-button').click()

    cy.location().its('hash').and('not.contain', 'suiteId=').and('not.contain', 'studio=')
  })
})
