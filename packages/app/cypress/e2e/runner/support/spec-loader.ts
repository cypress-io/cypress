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
  filePath: string
  setup?: () => void
  passCount?: number | string
  failCount?: number | string
  pendingCount?: number | string
  hasPreferredIde?: boolean
  projectName?: 'runner-e2e-specs' | 'session-and-origin-e2e-specs'
}

export function loadSpec (options: LoadSpecOptions) {
  const {
    filePath,
    setup,
    passCount = '--',
    failCount = '--',
    hasPreferredIde = false,
    pendingCount,
    projectName = 'runner-e2e-specs',
  } = options

  cy.scaffoldProject(projectName)
  cy.openProject(projectName)
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

  cy.visitApp(`specs/runner?file=cypress/e2e/${filePath}`)

  if (setup) {
    setup()
  }

  // Wait for specs to complete
  shouldHaveTestResults({ passCount, failCount, pendingCount })
}

export function runSpec ({ fileName }: { fileName: string }) {
  cy.scaffoldProject('runner-e2e-specs')
  cy.openProject('runner-e2e-specs')
  cy.startAppServer()

  cy.visitApp(`specs/runner?file=cypress/e2e/runner/${fileName}`)

  // First ensure the test is loaded
  cy.get('.passed > .num').should('contain', '--')
  cy.get('.failed > .num').should('contain', '--')

  return cy.window()
}
