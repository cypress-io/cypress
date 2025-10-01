import { launchStudio, loadProjectAndRunSpec, assertClosingPanelWithoutChanges } from './helper'
import pDefer from 'p-defer'

const urlPrompt = '// Visit a page by entering a url in the address bar or typing a cy.visit command here'

const inputNewTestName = (name: string = 'new-test') => {
  cy.findByTestId('new-test-button').click()
  cy.findByTestId('test-name-input').type(name)
  cy.findByTestId('create-test-button').click()

  // verify recording is enabled to ensure the panel is fully ready
  cy.findByTestId('record-button-recording').should('have.text', 'Recording...')

  cy.get('.studio-single-test-container').should('be.visible')
}

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
    launchStudio({ specName: 'spec-w-multiple-tests.cy.js', createNewTestFromSuite: true })

    // verify we are not in single test mode
    cy.get('.runnable-title').should('have.length', 4)
    cy.get('.runnable-title').its(0).should('have.text', 'studio functionality')
    cy.get('.runnable-title').its(1).should('contain.text', 'visits a basic html page')
    cy.get('.runnable-title').its(2).should('contain.text', 'visits a basic html page 2')
    cy.get('.runnable-title').its(3).should('contain.text', 'visits a basic html page 3')
  })

  it('creates a new test from spec header', () => {
    launchStudio({ specName: 'spec-w-visit.cy.js', createNewTestFromSpecHeader: true })

    inputNewTestName()

    cy.contains('new-test').click()

    cy.percySnapshot()

    cy.get('.cm-content').invoke('text', 'cy.visit("cypress/e2e/index.html")')

    cy.findByTestId('studio-save-button').click()

    // verify recording is enabled to ensure the panel is fully ready
    cy.findByTestId('record-button-recording').should('have.text', 'Recording...')

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
});

it('new-test', function() {
  cy.visit("cypress/e2e/index.html")
});`.trim())
    })
  })

  // TODO: this test fails in CI but passes locally
  // http://github.com/cypress-io/cypress/issues/31248
  it.skip('creates a new test with a url that changes top', function () {
    launchStudio({ specName: 'spec-w-foobar.cy.js', createNewTestFromSuite: true })

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
    launchStudio({ specName: 'spec-w-visit.cy.js', createNewTestFromSuite: true })

    // create a new test from a specific suite
    cy.findByTestId('create-new-test-from-suite').click()

    inputNewTestName()

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
  });

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

    it('shows the assertions menu for an element inside an invisible wrapper', () => {
      launchStudio({ specName: 'spec-w-invisible-wrapper.cy.js' })

      cy.getAutIframe().within(() => {
        // Show menu
        cy.contains('Increment').realClick({
          button: 'right',
        })

        cy.get('.__cypress-studio-assertions-menu').shadow()
        .find('.assertions-menu').should('be.visible').then(($el) => {
          const transform = $el.css('transform')

          // Extract all matrix values: matrix(a, b, c, d, tx, ty)
          const match = transform.match(/matrix\(([^)]+)\)/)

          if (match) {
            const values = match[1].split(',').map((v) => parseFloat(v.trim()))
            const [scaleX, skewY, skewX, scaleY, translateX, translateY] = values

            expect(scaleX).to.equal(1)
            expect(skewY).to.equal(0)
            expect(skewX).to.equal(0)
            expect(scaleY).to.equal(1)
            expect(translateX).to.equal(0)
            expect(translateY).to.be.closeTo(141, 1) // translateY (allow ±1 pixel)
          } else {
            throw new Error(`Could not parse transform value: ${transform}`)
          }
        })

        // Show submenu
        cy.get('.__cypress-studio-assertions-menu').shadow()
        .find('.assertion-type-text:first').realHover()

        cy.get('.__cypress-studio-assertions-menu').shadow()
        .find('.assertion-option')
        .contains('Increment')
        .should('be.visible')
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
      await ctx.actions.file.writeFileInProject('cypress/e2e/spec.cy.js', `describe('studio functionality', () => {
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

    cy.get('[data-cy="runnable-options-button"]').click()
    cy.get('[data-cy="more-options-runnable-popover"]').should('be.visible')

    cy.get('[data-cy="runnable-popover-open-ide"]').contains('Open in IDE')
    cy.get('[data-cy="runnable-popover-open-ide"]').click()

    cy.contains('External editor preferences')

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
    launchStudio({ specName: 'navigation.cy.js', createNewTestFromSuite: true })

    inputNewTestName()

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

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=').and('contain', 'sessionId=')
  })

  it('update the url with the suiteId and studio parameters when entering studio with a suite', () => {
    launchStudio({ createNewTestFromSuite: true })

    cy.location().its('hash').should('contain', 'suiteId=r2').and('contain', 'studio=').and('contain', 'sessionId=')
  })

  it('updates the studio url parameters and displays the single test view after creating a new test', () => {
    loadProjectAndRunSpec()

    // open the studio panel to create a new test in the root suite
    cy.findByTestId('studio-button').click()
    cy.location().its('hash').should('contain', 'suiteId=r1').and('contain', 'studio=').and('contain', 'sessionId=')

    // create a new test in the root suite
    inputNewTestName()

    // the studio url parameters should be removed
    cy.location().its('hash').and('not.contain', 'suiteId=').and('contain', 'studio=').and('contain', 'testId=r2')

    cy.get('.studio-single-test-container').should('be.visible')

    cy.percySnapshot()
  })

  it('does not remove the studio url parameters when saving test changes', () => {
    launchStudio()

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=').and('contain', 'sessionId=')

    cy.findByTestId('record-button-recording').should('be.visible')

    cy.waitForSpecToFinish()

    cy.getAutIframe().within(() => {
      cy.get('#increment').realClick()
    })

    cy.findByTestId('studio-save-button').click()

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=').and('contain', 'sessionId=')
  })

  it('does not remove the studio url parameters if saving fails', () => {
    launchStudio({ cliArgs: ['--config', 'watchForFileChanges=false'] })

    cy.findByTestId('record-button-recording').should('be.visible')

    incrementCounter(0)

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=').and('contain', 'sessionId=')

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

    cy.location().its('hash').and('not.contain', 'testId=').and('not.contain', 'studio=').and('not.contain', 'sessionId=')
  })

  it('does not prompt for a URL until studio is active', () => {
    launchStudio({ specName: 'spec-w-visit.cy.js', createNewTestFromSuite: true })
    cy.location().its('hash').should('contain', 'suiteId=r2').and('contain', 'studio=')
    cy.waitForSpecToFinish()

    cy.findByTestId('aut-url-input').should('have.value', 'http://localhost:4455/cypress/e2e/index.html')
  })

  it('does not reload the page if we didnt open a test in studio', () => {
    launchStudio({ specName: 'spec-w-visit.cy.js', createNewTestFromSuite: true })

    // set a property on the window to see if the page reloads
    cy.window().then((w) => w['beforeReload'] = true)

    // close new test mode
    cy.findByTestId('studio-header-studio-button').click()

    // if this property is still set on the window, then the page didn't reload
    cy.window().then((w) => expect(w['beforeReload']).to.be.true)
  })

  it('removes the studio url parameters when closing studio new test', () => {
    launchStudio({ specName: 'spec-w-visit.cy.js', createNewTestFromSuite: true })

    cy.location().its('hash').should('contain', 'suiteId=r2').and('contain', 'studio=')

    cy.findByTestId('studio-header-studio-button').click()

    cy.location().its('hash').and('not.contain', 'suiteId=').and('not.contain', 'studio=')
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

  describe('prompt for a new url', () => {
    const autUrl = 'http://localhost:4455/cypress/e2e/index.html'
    const visitUrl = 'cypress/e2e/index.html'

    const clearUrl = () => {
      cy.findByTestId('aut-url-input').should('have.value', autUrl)

      cy.get('.cm-content').invoke('text', '')

      cy.findByTestId('studio-save-button').click()

      cy.findByTestId('aut-url-input').should('have.value', '')

      cy.findByTestId('aut-url-input').should('have.focus')

      cy.get('.cm-line').should('contain.text', urlPrompt)
    }

    const assertAutUrlInput = () => {
      cy.findByTestId('aut-url-input').should('have.value', autUrl)

      cy.get('.cm-line').should('not.contain.text', urlPrompt)

      cy.get('.cm-line').should('contain.text', `cy.visit('${visitUrl}')`)
    }

    const clearAndAddAutUrl = () => {
      clearUrl()
      cy.findByTestId('aut-url-input').type(`${visitUrl}{enter}`)
      assertAutUrlInput()
    }

    const clearAndAddTestBlockEditorUrl = () => {
      clearUrl()
      cy.get('.cm-content').invoke('text', 'cy.visit(\'cypress/e2e/index.html\')')
      cy.findByTestId('studio-save-button').click()
      assertAutUrlInput()
    }

    beforeEach(() => {
      launchStudio()
    })

    it('when an existing visit command is cleared and adds a new url via the aut url input', () => {
      clearAndAddAutUrl()
    })

    it('when an existing visit command is cleared and adds a new url via test block editor', () => {
      clearAndAddTestBlockEditorUrl()
    })

    it('ensures we clear the aut url input properly in between adding and clearing urls', () => {
      clearAndAddAutUrl()
      clearAndAddTestBlockEditorUrl()
    })
  })

  it('creates a new test from an empty spec', () => {
    loadProjectAndRunSpec({ specName: 'empty.cy.js', specSelector: 'title' })

    cy.contains('Create test with Cypress Studio').click()

    inputNewTestName()

    // Cypress re-runs after the new test is saved.
    cy.waitForSpecToFinish()

    cy.get('.cm-content').invoke('text', 'cy.visit("cypress/e2e/index.html")')

    cy.findByTestId('studio-save-button').click()

    // verify recording is enabled to ensure the panel is fully ready
    cy.findByTestId('record-button-recording').should('have.text', 'Recording...')

    // we should have the commands we executed after we save
    cy.withCtx(async (ctx) => {
      const spec = await ctx.actions.file.readFileInProject('cypress/e2e/empty.cy.js')

      expect(spec.trim().replace(/\r/g, '')).to.equal(`
it('new-test', function() {
    cy.visit("cypress/e2e/index.html")
});`.trim())
    })
  })

  it('enables protocol for cloud studio', () => {
    launchStudio()

    cy.window().then((win) => {
      expect(win.Cypress.config('isDefaultProtocolEnabled')).to.be.false
      expect(win.Cypress.state('isProtocolEnabled')).to.be.true
    })
  })

  it('allows .only tests to be edited in studio', () => {
    loadProjectAndRunSpec({ specName: 'spec-with-only.cy.js' })

    // verify the test is the only one that runs
    cy.get('.test').should('have.length', 1)
    cy.get('.test').contains('should be the only test to run normally').should('be.visible')

    // open edit in studio
    cy.contains('should be the only test to run normally')
    .closest('.runnable-wrapper')
    .findByTestId('launch-studio')
    .click()

    cy.findByTestId('studio-panel').should('be.visible')

    cy.findByTestId('studio-single-test-title').should('have.text', 'should be the only test to run normally')
  })

  it('creates and runs new tests in studio mode when there is a .only test in the spec file', () => {
    loadProjectAndRunSpec({ specName: 'spec-with-only.cy.js' })

    cy.get('.test').should('have.length', 1)
    cy.get('.test').contains('should be the only test to run normally').should('be.visible')

    // launch studio and create a new test
    cy.findByTestId('studio-button').click()
    cy.findByTestId('studio-panel').should('be.visible').within(() => {
      cy.contains('button', 'New test').click()
      cy.get('[data-cy="test-name-input"]').type('new test{enter}')
    })

    cy.get('.spec-name').should('have.text', 'spec-with-only')
    // our new test runs in studio mode even though it doesn't have a .only
    cy.get('[data-cy="studio-single-test-title"]').should('have.text', 'new test')
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

  it('hides selector playground and studio controls when experimentalStudio is enabled', () => {
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

    cy.contains('New test')

    cy.percySnapshot()
  })

  // TODO: un-skip this test when we enable Studio AI
  it.skip('opens a cloud studio session with AI enabled', () => {
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

    // make sure studio is not loading
    cy.findByTestId('loading-studio-panel').should('not.exist')

    // Verify that AI is enabled
    cy.findByTestId('ai-status-text').should('contain.text', 'Enabled')

    // Verify that the AI output is correct
    cy.findByTestId('recommendation-editor').should('contain', aiOutput)
  })

  it('studio AI is marked as coming soon', () => {
    launchStudio()

    // Verify that AI is coming soon
    cy.get('[data-cy="ai-status-text"]').should('contain.text', 'Coming soon')
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

  it('does not show the studio button in component testing mode', () => {
    // Load project in component testing mode
    cy.scaffoldProject('experimental-studio')
    cy.openProject('experimental-studio', ['--component'])
    cy.startAppServer('component')
    cy.visitApp()
    cy.specsPageIsVisible()
    cy.get('[data-cy-row="HelloWorld.cy.jsx"]').eq(1).click()
    cy.waitForSpecToFinish({ passCount: 1 })

    // Verify studio button is not present
    cy.findByTestId('studio-button').should('not.exist')

    // Verify no launch studio buttons are present in test results
    cy.get('.runnable-wrapper').should('not.contain', '[data-cy="launch-studio"]')
  })

  it('hides studio button when running all specs', () => {
    // Use the run-all-specs project which already has run-all-specs enabled
    cy.scaffoldProject('run-all-specs')
    cy.openProject('run-all-specs')

    // Enable experimental studio by modifying the config
    cy.withCtx(async (ctx) => {
      const configPath = 'cypress.config.js'
      const configContent = await ctx.actions.file.readFileInProject(configPath)
      const updatedConfig = configContent.replace(
        'experimentalRunAllSpecs: true,',
        'experimentalRunAllSpecs: true,\n    experimentalStudio: true,',
      )

      await ctx.actions.file.writeFileInProject(configPath, updatedConfig)
    })

    cy.startAppServer('e2e')
    cy.visitApp()
    cy.specsPageIsVisible()

    // Spawns new browser so we need to stub this
    cy.withCtx((ctx, { sinon }) => {
      sinon.stub(ctx.actions.project, 'launchProject').resolves()
    })

    // Run all specs
    cy.findByTestId('run-all-specs-for-all').click()

    // Wait for the runner to load
    cy.waitForSpecToFinish()

    // Verify that we're running all specs by checking the header
    cy.get('[data-cy="runnable-header"]').should('contain', 'All Specs')

    // Verify that the studio button is NOT visible when running all specs
    cy.findByTestId('studio-button').should('not.exist')

    // Verify that the studio panel is NOT visible
    cy.findByTestId('studio-panel').should('not.exist')
  })

  it('shows studio button when running a single spec', () => {
    // Use the existing experimental-studio project
    cy.scaffoldProject('experimental-studio')
    cy.openProject('experimental-studio')
    cy.startAppServer('e2e')
    cy.visitApp()
    cy.specsPageIsVisible()

    // Run a single spec instead of all specs
    cy.get('[data-cy-row="spec.cy.js"]').click()

    cy.waitForSpecToFinish()

    // Verify that we're running a single spec (not all specs)
    cy.get('[data-cy="runnable-header"]').should('contain', 'spec.cy.js')
    cy.get('[data-cy="runnable-header"]').should('not.contain', 'All Specs')

    // Verify that the studio button IS visible when running a single spec
    cy.findByTestId('studio-button').should('be.visible')
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

  it('persists sessionId across page refresh', () => {
    launchStudio()

    cy.findByTestId('studio-panel').should('be.visible')

    cy.location().its('hash').should('contain', 'sessionId=')

    let originalSessionId: string

    cy.location('hash').then((hash) => {
      const urlParams = new URLSearchParams(hash)

      originalSessionId = urlParams.get('sessionId')!

      expect(originalSessionId).to.be.a('string')
      expect(originalSessionId).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    })

    cy.reload()

    cy.waitForSpecToFinish()

    cy.findByTestId('studio-panel').should('be.visible')

    cy.location().its('hash').should('contain', 'sessionId=')

    cy.location('hash').then((hash) => {
      const urlParams = new URLSearchParams(hash)
      const persistedSessionId = urlParams.get('sessionId')

      expect(persistedSessionId).to.equal(originalSessionId)
    })

    cy.findByTestId('studio-header-studio-button').click()

    cy.location().its('hash').should('not.contain', 'sessionId=')

    cy.findByTestId('studio-panel').should('not.exist')
  })
})
