export type LoadSpecOptions = {
  fileName: string
  setup?: () => void
  passCount?: number | string
  failCount?: number | string
  hasPreferredIde?: boolean
}

export function loadSpec (options: LoadSpecOptions): void {
  const {
    fileName,
    setup,
    passCount = '--',
    failCount = '--',
    hasPreferredIde = false,
  } = options

  cy.scaffoldProject('runner-e2e-specs')
  cy.openProject('runner-e2e-specs')
  cy.startAppServer()

  cy.withCtx((ctx, options) => {
    if (options.hasPreferredIde) {
      // set preferred editor to bypass IDE selection dialog
      ctx.coreData.localSettings.availableEditors = [
        ...ctx.coreData.localSettings.availableEditors,
        {
          id: 'test-editor',
          binary: '/usr/bin/test-editor',
          name: 'Test editor',
        },
      ]

      ctx.coreData.localSettings.preferences.preferredEditorBinary = 'test-editor'
    }

    ctx.coreData.localSettings.preferences.isSpecsListOpen = false
  }, { hasPreferredIde })

  // directly visiting the spec will sometimes hang, going through
  // specs page first to mitigate
  // cy.visitApp(`specs/runner?file=cypress/e2e/errors/${fileName}`)

  cy.visitApp()

  if (setup) {
    setup()
  }

  cy.findByLabelText('Search Specs').type(fileName)
  cy.contains('[data-cy=spec-item]', fileName).click()

  cy.location().should((location) => {
    expect(location.hash).to.contain(fileName)
  })

  // Wait for specs to complete
  cy.findByLabelText('Stats', { timeout: 10000 }).within(() => {
    cy.get('.passed', { timeout: 10000 }).should('have.text', `Passed:${passCount}`)
    cy.get('.failed', { timeout: 10000 }).should('have.text', `Failed:${failCount}`)
  })
}
