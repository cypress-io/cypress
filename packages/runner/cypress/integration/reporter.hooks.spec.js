const helpers = require('../support/helpers')

const { createCypress } = helpers
const { runIsolatedCypress } = createCypress()

describe('hooks', function () {
  beforeEach(function () {
    this.editor = {}

    return runIsolatedCypress(`cypress/fixtures/hook_spec.js`, {
      onBeforeRun: ({ win }) => {
        this.win = win

        win.runnerWs.emit.withArgs('get:user:editor')
        .yields({
          preferredOpener: this.editor,
        })
      },
    })
  })

  it('displays commands under correct hook', function () {
    cy.contains('tests 1').click()

    cy.contains('before all').closest('.collapsible').should('contain', 'beforeHook 1')
    cy.contains('before each').closest('.collapsible').should('contain', 'beforeEachHook 1')
    cy.contains('test body').closest('.collapsible').should('contain', 'testBody 1')
    cy.contains('after each').closest('.collapsible').should('contain', 'afterEachHook 1')
  })

  it('displays hooks without number when only one of type', function () {
    cy.contains('tests 1').click()

    cy.contains('before all').should('not.contain', '(1)')
    cy.contains('before each').should('not.contain', '(1)')
    cy.contains('after each').should('not.contain', '(1)')
  })

  it('displays hooks separately with number when more than one of type', function () {
    cy.contains('tests 2').click()

    cy.contains('before all (1)').closest('.collapsible').should('contain', 'beforeHook 2')
    cy.contains('before all (2)').closest('.collapsible').should('contain', 'beforeHook 3')
    cy.contains('before each (1)').closest('.collapsible').should('contain', 'beforeEachHook 1')
    cy.contains('before each (2)').closest('.collapsible').should('contain', 'beforeEachHook 2')
    cy.contains('test body').closest('.collapsible').should('contain', 'testBody 2')
    cy.contains('after each (1)').closest('.collapsible').should('contain', 'afterEachHook 2')
    cy.contains('after each (2)').closest('.collapsible').should('contain', 'afterEachHook 1')
    cy.contains('after all (1)').closest('.collapsible').should('contain', 'afterHook 2')
    cy.contains('after all (2)').closest('.collapsible').should('contain', 'afterHook 1')
  })

  it('creates open in IDE button', function () {
    cy.contains('tests 1').click()

    cy.get('.hook-open-in-ide').should('have.length', 4)
  })

  it('properly opens file in IDE at hook', function () {
    cy.contains('tests 1').click()

    cy.contains('Open in IDE').invoke('show').click().then(function () {
      expect(this.win.runnerWs.emit.withArgs('open:file').lastCall.args[1].file).to.include('hook_spec.js')
      // chrome sets the column to right before "before("
      // while firefox sets it right after "before("
      expect(this.win.runnerWs.emit.withArgs('open:file').lastCall.args[1].column).to.be.eq(Cypress.browser.family === 'firefox' ? 10 : 3)
      expect(this.win.runnerWs.emit.withArgs('open:file').lastCall.args[1].line).to.be.eq(2)
    })
  })
})
