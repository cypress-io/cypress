import { loadSpec } from './support/spec-loader'

describe('hooks', {
  // Limiting tests kept in memory due to large memory cost
  // of nested spec snapshots
  numTestsKeptInMemory: 1,
}, () => {
  it('displays commands under correct hook', () => {
    loadSpec({
      filePath: 'hooks/basic.cy.js',
      passCount: 2,
    })

    cy.contains('tests 1').click()

    cy.contains('before all').closest('.collapsible').should('contain', 'beforeHook 1')
    cy.contains('before each').closest('.collapsible').should('contain', 'beforeEachHook 1')
    cy.contains('test body').closest('.collapsible').should('contain', 'testBody 1')
    cy.contains('after each').closest('.collapsible').should('contain', 'afterEachHook 1')

    // displays hooks without number when only one of type
    cy.contains('before all').should('not.contain', '(1)')
    cy.contains('before each').should('not.contain', '(1)')
    cy.contains('after each').should('not.contain', '(1)')

    // displays hooks separately with number when more than one of type
    cy.contains('tests 1').click()
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

  it('creates open in IDE button', () => {
    loadSpec({
      filePath: 'hooks/basic.cy.js',
      passCount: 2,
      hasPreferredIde: true,
    })

    cy.contains('tests 1').click()

    cy.get('.hook-open-in-ide').should('have.length', 4)

    cy.withCtx((ctx, o) => {
      o.sinon.stub(ctx.actions.file, 'openFile')
    })

    cy.contains('Open in IDE').invoke('show').click({ force: true })

    cy.withCtx((ctx, o) => {
      expect(ctx.actions.file.openFile).to.have.been.calledWith(o.sinon.match(new RegExp(`hooks/basic\.cy\.js$`)), o.ideLine, o.ideColumn)
    }, { ideLine: 2, ideColumn: Cypress.browser.family === 'firefox' ? 5 : 2 })
  })

  it('does not display commands from skipped tests', () => {
    loadSpec({
      filePath: 'hooks/skip.cy.js',
      passCount: 1,
    })

    // does not display commands from skipped tests
    cy.contains('test 1').click()
    cy.contains('test 1').parents('.collapsible').first().should('not.contain', 'testBody 1')
    cy.contains('test 1').click()

    // displays before hook when following it.skip
    // https://github.com/cypress-io/cypress/issues/8086
    cy.contains('test 2').click()

    cy.contains('test 2').parents('.collapsible').first().should('contain', 'before all')
  })

  it('only displays tests with .only', () => {
    loadSpec({
      filePath: 'hooks/only.cy.js',
      passCount: 1,
    })

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

  // https://github.com/cypress-io/cypress/issues/8189
  it('can rerun without timeout error leaking into next run (due to run restart)', () => {
    loadSpec({
      filePath: 'hooks/rerun.cy.js',
      passCount: 1,
    })

    // wait until spec has run twice (due to one reload)
    cy.window().its('count').should('eq', 2)
  })
})
