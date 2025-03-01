import { launchStudio } from './helper'

describe('Cypress Studio', () => {
  it('updates an existing test with an action', () => {
    function addStudioClick (initialCount: number) {
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

    launchStudio()

    cy.get('button').contains('Save Commands').should('be.disabled')

    addStudioClick(0)

    cy.get('button').contains('Save Commands').should('not.be.disabled')

    cy.get('.studio-command-remove').click()

    cy.get('button').contains('Save Commands').should('be.disabled')

    addStudioClick(1)

    cy.get('button').contains('Save Commands').should('not.be.disabled')

    cy.get('[data-cy="hook-name-studio commands"]').closest('.hook-studio').within(() => {
      cy.get('.command').should('have.length', 2)
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

  it('updates an existing test with an action using studio controls', () => {
    function addStudioClick (initialCount: number) {
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

    launchStudio()

    cy.get('button').contains('Save Commands').should('be.disabled')

    addStudioClick(0)

    cy.get('button').contains('Save Commands').should('not.be.disabled')

    cy.get('.studio-command-remove').click()

    cy.get('button').contains('Save Commands').should('be.disabled')

    addStudioClick(1)

    cy.get('button').contains('Save Commands').should('not.be.disabled')

    cy.get('[data-cy="hook-name-studio commands"]').closest('.hook-studio').within(() => {
      cy.get('.command').should('have.length', 2)
      // (1) Get Command
      cy.get('.command-name-get').should('contain.text', '#increment')

      // (2) Click Command
      cy.get('.command-name-click').should('contain.text', 'click')
    })

    cy.get('[data-cy=studio-toolbar-controls').get('[data-cy=save]').click()

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
    function assertStudioHookCount (num: number) {
      cy.get('[data-cy="hook-name-studio commands"]').closest('.hook-studio').within(() => {
        cy.get('.command').should('have.length', num)
      })
    }

    launchStudio()

    cy.getAutIframe().within(() => {
      cy.get('#increment').rightclick().then(() => {
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('be enabled').realClick()
      })
    })

    assertStudioHookCount(2)
    cy.getAutIframe().within(() => {
      cy.get('#increment').rightclick().then(() => {
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('be visible').realClick()
      })
    })

    assertStudioHookCount(4)

    cy.getAutIframe().within(() => {
      cy.get('#increment').rightclick().then(() => {
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('have text').realHover()
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('Increment').realClick()
      })
    })

    assertStudioHookCount(6)

    cy.getAutIframe().within(() => {
      cy.get('#increment').rightclick().then(() => {
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('have id').realHover()
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('increment').realClick()
      })
    })

    assertStudioHookCount(8)

    cy.getAutIframe().within(() => {
      cy.get('#increment').rightclick().then(() => {
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('have attr').realHover()
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('onclick').realClick()
      })
    })

    assertStudioHookCount(10)

    cy.get('[data-cy="hook-name-studio commands"]').closest('.hook-studio').within(() => {
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

    cy.getAutIframe().within(() => {
      cy.get('p').contains('Count is 0')

      // (1) First Studio action - get
      cy.get('#increment')

      // (2) Second Studio action - click
      .realClick().then(() => {
        cy.get('p').contains('Count is 1')
      })
    })

    cy.get('[data-cy="hook-name-studio commands"]').closest('.hook-studio').within(() => {
      cy.get('.command').should('have.length', 2)
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

    cy.get('[data-cy="hook-name-studio commands"]').should('not.exist')

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

  it('does not update the test when studio is closed using studio controls', () => {
    launchStudio()

    cy.getAutIframe().within(() => {
      cy.get('p').contains('Count is 0')

      // (1) First Studio action - get
      cy.get('#increment')

      // (2) Second Studio action - click
      .realClick().then(() => {
        cy.get('p').contains('Count is 1')
      })
    })

    cy.get('[data-cy="hook-name-studio commands"]').closest('.hook-studio').within(() => {
      cy.get('.command').should('have.length', 2)
      // (1) Get Command
      cy.get('.command-name-get').should('contain.text', '#increment')

      // (2) Click Command
      cy.get('.command-name-click').should('contain.text', 'click')
    })

    cy.get('[data-cy=studio-toolbar-controls]').get('[data-cy=close-studio]').click()

    // Cypress re-runs after you cancel Studio.
    // Original spec should pass
    cy.waitForSpecToFinish({ passCount: 1 })

    cy.get('.command').should('have.length', 1)

    // Assert the spec was executed without any new commands.
    cy.get('.command-name-visit').within(() => {
      cy.contains('visit')
      cy.contains('cypress/e2e/index.html')
    })

    cy.get('[data-cy="hook-name-studio commands"]').should('not.exist')

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

  it('removes pending commands when restarting studio', () => {
    launchStudio()

    cy.get('[data-cy="hook-name-studio commands"]').closest('.hook-studio').within(() => {
      cy.get('.command').should('have.length', 1)
      cy.get('.studio-prompt').should('contain.text', 'Interact with your site to add test commands. Right click to add assertions.')
    })

    cy.getAutIframe().within(() => {
      cy.get('p').contains('Count is 0')

      // (1) First Studio action - get
      cy.get('#increment')

      // (2) Second Studio action - click
      .realClick().then(() => {
        cy.get('p').contains('Count is 1')
      })
    })

    cy.get('[data-cy="hook-name-studio commands"]').closest('.hook-studio').within(() => {
      cy.get('.command').should('have.length', 2)
      // (1) Get Command
      cy.get('.command-name-get').should('contain.text', '#increment')

      // (2) Click Command
      cy.get('.command-name-click').should('contain.text', 'click')
    })

    cy.get('[data-cy=studio-toolbar]').get('button[data-cy=restart-studio]').click()

    cy.waitForSpecToFinish()

    // all of the pending studio commands should have been removed
    cy.get('[data-cy="hook-name-studio commands"]').closest('.hook-studio').within(() => {
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
    cy.scaffoldProject('experimental-studio')
    cy.openProject('experimental-studio')
    cy.startAppServer('e2e')
    cy.visitApp()
    cy.specsPageIsVisible()
    cy.get(`[title="empty.cy.js"]`).should('be.visible').click()

    cy.waitForSpecToFinish()

    cy.contains('Create test with Cypress Studio').click()
    cy.get('[data-cy="aut-url"]').as('urlPrompt')

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

    cy.get('[data-cy="hook-name-studio commands"]').should('not.exist')

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

    cy.get('[data-cy="aut-url"]').as('urlPrompt')

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

    cy.get('[data-cy="hook-name-studio commands"]').should('not.exist')

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

  it('creates a new test for an existing spec with the url already defined', () => {
    launchStudio({ specName: 'spec-w-visit.cy.js', createNewTest: true })

    cy.getAutIframe().within(() => {
      cy.get('p').contains('Count is 0')

      // (1) First Studio action - get
      cy.get('#increment')

      // (2) Second Studio action - click
      .realClick().then(() => {
        cy.get('p').contains('Count is 1')
      })
    })

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

    cy.get('[data-cy="hook-name-studio commands"]').should('not.exist')

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
    cy.scaffoldProject('experimental-studio')
    cy.openProject('experimental-studio')
    cy.startAppServer('e2e')
    cy.visitApp()
    cy.specsPageIsVisible()
    cy.get(`[title="empty.cy.js"]`).should('be.visible').click()

    cy.waitForSpecToFinish()

    cy.contains('Create test with Cypress Studio').click()
    cy.get('[data-cy="aut-url"]').as('urlPrompt')

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

    cy.get('button').contains('Save Commands').click()

    cy.get('#testName').type('new-test')

    cy.get('button[aria-label=Close]').click()

    // all of the existing studio commands should still be there since we didn't save
    cy.get('[data-cy="hook-name-studio commands"]').closest('.hook-studio').within(() => {
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

    cy.getAutIframe().within(() => {
      cy.get('p').contains('Count is 0')

      // (1) First Studio action - get
      cy.get('#increment')

      // (2) Second Studio action - click
      .realClick().then(() => {
        cy.get('p').contains('Count is 1')
      })
    })

    // spy on the clipboard to check if the commands are copied
    cy.window().its('navigator.clipboard').then((clipboard) => {
      cy.spy(clipboard, 'writeText').as('writeText')
    })

    cy.get('button.studio-copy').click()

    cy.get('@writeText').should('have.been.calledOnceWith',
`/* ==== Generated with Cypress Studio ==== */
cy.get('#increment').click();
/* ==== End Cypress Studio ==== */`)
  })

  it('copies the studio commands to the clipboard using studio controls', () => {
    launchStudio()

    cy.getAutIframe().within(() => {
      cy.get('p').contains('Count is 0')

      // (1) First Studio action - get
      cy.get('#increment')

      // (2) Second Studio action - click
      .realClick().then(() => {
        cy.get('p').contains('Count is 1')
      })
    })

    // spy on the clipboard to check if the commands are copied
    cy.window().its('navigator.clipboard').then((clipboard) => {
      cy.spy(clipboard, 'writeText').as('writeText')
    })

    cy.get('[data-cy=studio-toolbar-controls]').get('[data-cy=copy-commands]').click()

    cy.get('@writeText').should('have.been.calledOnceWith',
`/* ==== Generated with Cypress Studio ==== */
cy.get('#increment').click();
/* ==== End Cypress Studio ==== */`)
  })

  // TODO: when reloading, we incorrectly go to the spec page of the /app project instead of the /experimental-studio project
  it.skip('removes pending commands if the page is reloaded', () => {
    launchStudio()

    cy.getAutIframe().within(() => {
      cy.get('p').contains('Count is 0')

      // (1) First Studio action - get
      cy.get('#increment')

      // (2) Second Studio action - click
      .realClick().then(() => {
        cy.get('p').contains('Count is 1')
      })
    })

    cy.get('[data-cy="hook-name-studio commands"]').closest('.hook-studio').within(() => {
      cy.get('.command').should('have.length', 2)
      // (1) Get Command
      cy.get('.command-name-get').should('contain.text', '#increment')

      // (2) Click Command
      cy.get('.command-name-click').should('contain.text', 'click')
    })

    cy.reload()

    cy.waitForSpecToFinish()

    // after reloading we should still be in studio mode but the commands should be removed
    cy.get('[data-cy="hook-name-studio commands"]').closest('.hook-studio').within(() => {
      cy.get('.command').should('have.length', 1)
      cy.get('.studio-prompt').should('contain.text', 'Interact with your site to add test commands. Right click to add assertions.')
    })

    cy.get('[data-cy=studio-toolbar-controls]').get('[data-cy=save]').should('be.disabled')
  })

  it('removes pending commands when rerunning the test', () => {
    launchStudio()

    cy.getAutIframe().within(() => {
      cy.get('p').contains('Count is 0')

      // (1) First Studio action - get
      cy.get('#increment')

      // (2) Second Studio action - click
      .realClick().then(() => {
        cy.get('p').contains('Count is 1')
      })
    })

    cy.get('[data-cy="hook-name-studio commands"]').closest('.hook-studio').within(() => {
      cy.get('.command').should('have.length', 2)
      // (1) Get Command
      cy.get('.command-name-get').should('contain.text', '#increment')

      // (2) Click Command
      cy.get('.command-name-click').should('contain.text', 'click')
    })

    cy.get('button[aria-label="Rerun all tests"]').click()

    cy.waitForSpecToFinish()

    // after reloading we should still be in studio mode but the commands should be removed
    cy.get('[data-cy="hook-name-studio commands"]').closest('.hook-studio').within(() => {
      cy.get('.command').should('have.length', 1)
      cy.get('.studio-prompt').should('contain.text', 'Interact with your site to add test commands. Right click to add assertions.')
    })

    // TODO: the Save button should be disabled but it is incorrectly enabled
    cy.get('[data-cy=studio-toolbar-controls]').get('[data-cy=save]').should('be.enabled')
  })

  it('does not re-enter studio mode when changing pages and then coming back', () => {
    launchStudio()

    cy.get('[data-cy="hook-name-studio commands"]')

    // go to the runs page
    cy.get('[data-cy=sidebar-link-runs-page]').click()

    // go back to the specs page
    cy.get('[data-cy=sidebar-link-specs-page]').click()
    cy.contains('spec.cy.js').click()

    cy.waitForSpecToFinish({ passCount: 1 })

    cy.get('[data-cy="hook-name-studio commands"]').should('not.exist')
    cy.location().its('hash').should('not.contain', 'testId=').and('not.contain', 'studio=')
  })

  it('exits studio mode if the spec is changed on the file system', () => {
    launchStudio()

    cy.getAutIframe().within(() => {
      // (1) First Studio action - get
      cy.get('#increment')

      // (2) Second Studio action - click
      .realClick().then(() => {
        cy.get('p').contains('Count is 1')
      })
    })

    cy.get('[data-cy="hook-name-studio commands"]').closest('.hook-studio').within(() => {
      cy.get('.command').should('have.length', 2)
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

    cy.get('[data-cy="hook-name-studio commands"]').should('not.exist')

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

    cy.getAutIframe().within(() => {
      // (1) First Studio action - get
      cy.get('#increment')

      // (2) Second Studio action - click
      .realClick().then(() => {
        cy.get('p').contains('Count is 1')
      })
    })

    cy.get('[data-cy="hook-name-studio commands"]').closest('.hook-studio').within(() => {
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
    cy.get('[data-cy=alert]').should('contain.text', 'Spec not found')
    cy.get('[data-cy=alert-body]').should('contain.text', 'There is no spec matching the following location: cypress/e2e/spec.cy.js')
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
    cy.get('[data-cy=sidebar-link-runs-page]').click()

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

  it('removes the studio parameters when saving the test', () => {
    launchStudio()

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=')

    cy.getAutIframe().within(() => {
      cy.get('#increment').realClick()
    })

    cy.get('button').contains('Save Commands').click()

    cy.location().its('hash').and('not.contain', 'testId=').and('not.contain', 'studio=')
  })

  it('removes the studio parameters when cancelling', () => {
    launchStudio()

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=')

    cy.get('a').contains('Cancel').click()

    cy.location().its('hash').and('not.contain', 'testId=').and('not.contain', 'studio=')
  })
})
