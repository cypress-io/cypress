import type { WIZARD_FRAMEWORKS } from '@packages/scaffold-config'
import type { SnapshotScaffoldTestResult } from '@packages/launchpad/cypress/tasks/snapshotsScaffold'

// The tests in this file take an existing project without Cypress Configured
// and add Cypress using the launchpad setup wizard.
//
// See `system-tests/projects/pristine` for an example.
//
// After adding a test for a project for the first time and running
// this spec, it will see what files are scaffolded and save them
// in a directory named `expected-cypress-{lang}-{testingType}`.
// For example, when configuring the `pristine` project using
// plain JS for E2E testing, it will make
// a new directory in `pristine` named `expected-cypress-js-e2e`
// containing the scaffolded files.
//
// Each subsequent run will compare the scaffolded files in the
// `expected-cypress-js-e2e` directory to the newly created ones.
//
// If there is a discrepancy, the test will fail and show the diff in the command log.
//
// To update your expected files, just delete the `expected-cypress` and re-run the test,
// or modify them by hand.
function scaffoldAndOpenE2EProject (
  name: Parameters<typeof cy.scaffoldProject>[0],
  language: 'js' | 'ts',
  args?: Parameters<typeof cy.openProject>[1],
) {
  cy.scaffoldProject(name)
  cy.openProject(name, args)

  cy.visitLaunchpad()

  cy.contains('Welcome to Cypress!').should('be.visible')
  cy.contains('[data-cy-testingtype="e2e"]', 'Not Configured')
  cy.contains('[data-cy-testingtype="component"]', 'Not Configured')
  cy.contains('E2E Testing').click()
  cy.contains(language === 'js' ? 'JavaScript' : 'TypeScript').click()
  cy.contains('Next').click()
  cy.contains('We added the following files to your project.')
  cy.contains('Continue').click()
}

function scaffoldAndOpenCTProject (
  name: Parameters<typeof cy.scaffoldProject>[0],
  language: 'js' | 'ts',
  framework: typeof WIZARD_FRAMEWORKS[number]['name'],
  bundler?: typeof WIZARD_FRAMEWORKS[number]['supportedBundlers'][number]['name'],
  args?: Parameters<typeof cy.openProject>[1],
) {
  cy.scaffoldProject(name)
  cy.openProject(name, args)

  cy.visitLaunchpad()

  cy.contains('Welcome to Cypress!').should('be.visible')
  cy.contains('[data-cy-testingtype="e2e"]', 'Not Configured')
  cy.contains('[data-cy-testingtype="component"]', 'Not Configured')
  cy.contains('Component Testing').click()
  cy.contains(language === 'js' ? 'JavaScript' : 'TypeScript').click()

  cy.contains('React.js(detected)').click()
  cy.contains(framework).click()
  if (bundler) {
    cy.contains('Webpack(detected)').click()
    cy.contains(bundler).click()
  }

  cy.contains('Next Step').click()
  cy.contains('Skip').click()
  cy.contains('We added the following files to your project.')
  cy.contains('Continue').click()
}

function assertScaffoldedFilesAreCorrect (language: 'js' | 'ts', testingType: Cypress.TestingType, ctFramework?: string) {
  cy.withCtx((ctx) => ctx.currentProject).then((currentProject) => {
    cy.task<SnapshotScaffoldTestResult>('snapshotCypressDirectory', {
      currentProject,
      testingType,
      language,
      ctFramework,
    })
    .then((result) => {
      if (result.status === 'ok') {
        return result
      }

      throw new Error(result.message)
    })
    .then((res) => {
      cy.log(`✅ ${res.message}`)
    })
  })
}

describe('scaffolding new projects', { defaultCommandTimeout: 7000 }, () => {
  it('scaffolds E2E for a JS project', () => {
    scaffoldAndOpenE2EProject('pristine', 'js')
    assertScaffoldedFilesAreCorrect('js', 'e2e')
  })

  it('scaffolds E2E for a TS project', () => {
    scaffoldAndOpenE2EProject('pristine', 'ts')
    assertScaffoldedFilesAreCorrect('ts', 'e2e')
  })

  it('scaffolds CT for a JS project', () => {
    scaffoldAndOpenCTProject('pristine', 'js', 'Create React App')
    assertScaffoldedFilesAreCorrect('js', 'component', 'Create React App (v5)')
  })

  it('scaffolds CT for a TS project', () => {
    scaffoldAndOpenCTProject('pristine', 'ts', 'Create React App')
    assertScaffoldedFilesAreCorrect('ts', 'component', 'Create React App (v5)')
  })
})
