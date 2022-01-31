import { verify } from './support/verify-helpers'

describe('errors ui', {
  viewportHeight: 768,
  viewportWidth: 1024,
}, () => {
  describe('assertion failures', () => {
    beforeEach(() => {
      cy.scaffoldProject('runner-e2e-specs')
      cy.openProject('runner-e2e-specs')

      // set preferred editor to bypass IDE selection dialog
      cy.withCtx((ctx) => {
        ctx.coreData.localSettings.availableEditors = [
          ...ctx.coreData.localSettings.availableEditors,
          {
            id: 'test-editor',
            binary: '/usr/bin/test-editor',
            name: 'Test editor',
          },
        ]

        ctx.coreData.localSettings.preferences.preferredEditorBinary = 'test-editor'
      })

      cy.startAppServer()
      cy.visitApp()

      cy.contains('[data-cy=spec-item]', 'assertions.cy.js').click()

      cy.location().should((location) => {
        expect(location.hash).to.contain('assertions.cy.js')
      })

      // Wait for specs to complete
      cy.findByLabelText('Stats').get('.failed', { timeout: 10000 }).should('have.text', 'Failed:3')
    })

    verify.it('with expect().<foo>', {
      file: 'assertions.cy.js',
      hasPreferredIde: true,
      column: 25,
      message: `expected 'actual' to equal 'expected'`,
      codeFrameText: 'with expect().<foo>',
    })

    verify.it('with assert()', {
      file: 'assertions.cy.js',
      hasPreferredIde: true,
      column: '(5|12)', // (chrome|firefox)
      message: `should be true`,
      codeFrameText: 'with assert()',
    })

    verify.it('with assert.<foo>()', {
      file: 'assertions.cy.js',
      hasPreferredIde: true,
      column: 12,
      message: `expected 'actual' to equal 'expected'`,
      codeFrameText: 'with assert.<foo>()',
    })
  })

  describe('assertion failures - no preferred IDE', () => {
    beforeEach(() => {
      cy.scaffoldProject('runner-e2e-specs')
      cy.openProject('runner-e2e-specs')

      cy.startAppServer()
      cy.visitApp()

      cy.contains('[data-cy=spec-item]', 'assertions.cy.js').click()

      cy.location().should((location) => {
        expect(location.hash).to.contain('assertions.cy.js')
      })

      // Wait for specs to complete
      cy.findByLabelText('Stats').get('.failed', { timeout: 10000 }).should('have.text', 'Failed:3')
    })

    verify.it('with expect().<foo>', {
      file: 'assertions.cy.js',
      hasPreferredIde: false,
      column: 25,
      message: `expected 'actual' to equal 'expected'`,
      codeFrameText: 'with expect().<foo>',
    })
  })
})
