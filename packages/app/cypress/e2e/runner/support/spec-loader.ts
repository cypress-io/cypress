export const shouldHaveTestResults = ({ passCount, failCount, pendingCount }) => {
  passCount = passCount || '--'
  failCount = failCount || '--'

  cy.findByLabelText('Stats', { timeout: 10000 }).within(() => {
    cy.get('.passed .num', { timeout: 10000 }).should('have.text', `${passCount}`)
    cy.get('.failed .num', { timeout: 10000 }).should('have.text', `${failCount}`)

    if (pendingCount) {
      cy.get('.pending .num', { timeout: 10000 }).should('have.text', `${pendingCount}`)
    }
  })
}

export type LoadSpecOptions = {
  fileName: string
  setup?: () => void
  passCount?: number | string
  failCount?: number | string
  pendingCount?: number | string
  hasPreferredIde?: boolean
}

export function loadSpec (options: LoadSpecOptions) {
  const {
    fileName,
    setup,
    passCount = '--',
    failCount = '--',
    hasPreferredIde = false,
    pendingCount,
  } = options

  cy.scaffoldProject('runner-e2e-specs')
  cy.openProject('runner-e2e-specs')
  cy.startAppServer()

  cy.withCtx((ctx, options) => {
    ctx.update((coreData) => {
      if (options.hasPreferredIde) {
        // set preferred editor to bypass IDE selection dialog
        coreData.localSettings.availableEditors = [
          ...ctx.coreData.localSettings.availableEditors,
          {
            id: 'test-editor',
            binary: '/usr/bin/test-editor',
            name: 'Test editor',
          },
        ]

        coreData.localSettings.preferences.preferredEditorBinary = 'test-editor'
      }

      coreData.localSettings.preferences.isSpecsListOpen = false
    })
  }, { hasPreferredIde })

  // TODO: investigate why directly visiting the spec will sometimes hang
  // https://cypress-io.atlassian.net/browse/UNIFY-1154
  // cy.__incorrectlyVisitAppWithIntercept(`specs/runner?file=cypress/e2e/errors/${fileName}`)

  cy.__incorrectlyVisitAppWithIntercept()

  if (setup) {
    setup()
  }

  cy.findByLabelText('Search Specs').type(fileName)
  // wait for virtualized spec list to update, there is a chance
  // of disconnection otherwise
  cy.wait(500)
  cy.contains('[data-cy=spec-item]', fileName).click()

  cy.location().should((location) => {
    expect(location.hash).to.contain(fileName)
  })

  // Wait for specs to complete
  shouldHaveTestResults({ passCount, failCount, pendingCount })
}

export function runSpec ({ fileName }: { fileName: string }) {
  cy.scaffoldProject('runner-e2e-specs')
  cy.openProject('runner-e2e-specs')
  cy.startAppServer()

  cy.__incorrectlyVisitAppWithIntercept()

  cy.findByLabelText('Search Specs').type(fileName)
  // wait for virtualized spec list to update, there is a chance
  // of disconnection otherwise
  cy.wait(500)
  cy.contains('[data-cy=spec-item]', fileName).click()

  cy.location().should((location) => {
    expect(location.hash).to.contain(fileName)
  })

  return cy.window()
}
