const helpers = require('../support/helpers')

const { createCypress } = helpers
const { runIsolatedCypress } = createCypress()

describe('hooks', function () {
  describe('displays hooks', function () {
    beforeEach(function () {
      return runIsolatedCypress(`cypress/fixtures/hooks/basic_spec.js`)
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
  })

  describe('open in IDE', function () {
    beforeEach(function () {
      this.editor = {}

      return runIsolatedCypress(`cypress/fixtures/hooks/basic_spec.js`, {
        onBeforeRun: ({ win }) => {
          this.win = win

          win.runnerWs.emit.withArgs('get:user:editor')
          .yields({
            preferredOpener: this.editor,
          })
        },
      })
    })

    it('creates open in IDE button', function () {
      cy.contains('tests 1').click()

      cy.get('.hook-open-in-ide').should('have.length', 4)
    })

    it('properly opens file in IDE at hook', function () {
      cy.contains('tests 1').click()

      cy.contains('Open in IDE').invoke('show').click().then(function () {
        expect(this.win.runnerWs.emit.withArgs('open:file').lastCall.args[1].file).to.include('basic_spec.js')
        // chrome sets the column to right before "before("
        // while firefox sets it right after "before("
        expect(this.win.runnerWs.emit.withArgs('open:file').lastCall.args[1].column).to.be.eq(Cypress.browser.family === 'firefox' ? 10 : 3)
        expect(this.win.runnerWs.emit.withArgs('open:file').lastCall.args[1].line).to.be.eq(2)
      })
    })

    it('properly opens file in IDE at test', function () {
      cy.contains('tests 1').click()

      cy.get('a:contains(Open in IDE)').eq(2).invoke('show').click().then(function () {
        expect(this.win.runnerWs.emit.withArgs('open:file').lastCall.args[1].file).to.include('basic_spec.js')
        // chrome sets the column to right before "it("
        // while firefox sets it right after "it("
        expect(this.win.runnerWs.emit.withArgs('open:file').lastCall.args[1].column).to.be.eq(Cypress.browser.family === 'firefox' ? 6 : 3)
        expect(this.win.runnerWs.emit.withArgs('open:file').lastCall.args[1].line).to.be.eq(10)
      })
    })
  })

  describe('skipped tests', function () {
    beforeEach(function () {
      return runIsolatedCypress(`cypress/fixtures/hooks/skip_spec.js`)
    })

    it('does not display commands from skipped tests', function () {
      cy.contains('test 1').click()

      cy.contains('test 1').parents('.collapsible').first().should('not.contain', 'testBody 1')
    })

    // https://github.com/cypress-io/cypress/issues/8086
    it('displays before hook when following it.skip', function () {
      cy.contains('test 2').click()

      cy.contains('test 2').parents('.collapsible').first().should('contain', 'before all')
    })
  })

  describe('only tests', function () {
    beforeEach(function () {
      return runIsolatedCypress(`cypress/fixtures/hooks/only_spec.js`)
    })

    it('only displays tests with .only', function () {
      cy.contains('test wrapper').parents('.collapsible').first().should(($suite) => {
        expect($suite).not.to.contain('test 1')
        expect($suite).to.contain('nested suite 1')
        expect($suite).to.contain('test 2')
        expect($suite).not.to.contain('nested suite 2')
        expect($suite).not.to.contain('test 3')
        expect($suite).to.contain('nested suite 3')
        expect($suite).to.contain('test 4')
      })

      cy.contains('test 2').click()

      cy.contains('test 2').parents('.collapsible').first().should(($test) => {
        expect($test).to.contain('before each')
        expect($test).to.contain('test body')
      })
    })
  })

  // https://github.com/cypress-io/cypress/issues/8189
  it('can rerun without timeout error leaking into next run (due to run restart)', () => {
    runIsolatedCypress(() => {
      const top = window.parent

      top.count = top.count || 0

      Cypress.config('defaultCommandTimeout', 50)
      afterEach(function () {
        assert(true, `run ${top.count}`)
      })

      describe('s1', () => {
        it('foo', () => {
          cy.once('test:after:run', () => {
            if (!top.count) {
              requestAnimationFrame(() => {
                window.parent.eventManager.reporterBus.emit('runner:restart')
              })
            }

            top.count++
          })
        })
      })
    })

    // wait until spec has run twice (due to one reload)
    cy.window().its('count').should('eq', 2)
  })
})
