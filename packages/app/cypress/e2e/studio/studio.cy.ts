import { launchStudio } from './helper'

describe('Cypress Studio', () => {
  it('updates an existing test with a click action', () => {
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
it('visits a basic html page', () => {
  cy.visit('cypress/e2e/index.html')
  /* ==== Generated with Cypress Studio ==== */
  cy.get('#increment').click();
  /* ==== End Cypress Studio ==== */
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

  it('writes a test with all kinds of assertions', () => {
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
it('visits a basic html page', () => {
  cy.visit('cypress/e2e/index.html')
  /* ==== Generated with Cypress Studio ==== */
  cy.get('#increment').should('be.enabled');
  cy.get('#increment').should('be.visible');
  cy.get('#increment').should('have.text', 'Increment');
  cy.get('#increment').should('have.id', 'increment');
  cy.get('#increment').should('have.attr', 'onclick', 'increment()');
  /* ==== End Cypress Studio ==== */
})`
      .trim())
    })
  })

  it('creates a test using Studio, but cancels and does not write to file', () => {
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

    cy.get('[data-cy="hook-name-studio commands"]').should('exist')

    cy.get('a').contains('Cancel').click()

    // Cyprss re-runs after you cancel Studio.
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
it('visits a basic html page', () => {
  cy.visit('cypress/e2e/index.html')
})`.trim())
    })
  })

  // TODO: Can we somehow do the "Create Test" workflow within Cypress in Cypress?
  it('creates a brand new test', () => {
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

    cy.get('@urlPrompt').type('http://localhost:4455/cypress/e2e/index.html')

    cy.get('@urlPrompt').within(() => {
      cy.contains('Continue ➜').should('not.be.disabled')
      cy.contains('Cancel').click()
    })

    // TODO: Can we somehow do the "Create Test" workflow within Cypress in Cypress?
    // If we hit "Continue" here, it updates the domain (as expected) but since we are
    // Cypress in Cypress, it redirects us the the spec page, which is not what normally
    // would happen in production.
  })

  it('shows menu and submenu correctly', () => {
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
})
