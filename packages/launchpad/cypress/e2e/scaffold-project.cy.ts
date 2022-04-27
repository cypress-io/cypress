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
function scaffoldAndOpenE2EProject (opts: {
  name: Parameters<typeof cy.scaffoldProject>[0]
  language: 'js' | 'ts'
  args?: Parameters<typeof cy.openProject>[1]
  removeFixturesFolder?: boolean
}) {
  cy.scaffoldProject(opts.name)
  cy.openProject(opts.name, opts.args)

  if (opts.removeFixturesFolder) {
    // Delete the fixtures folder so it scaffold correctly the example
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.removeFileInProject('cypress/fixtures')
    })
  }

  cy.visitLaunchpad()

  cy.contains('Welcome to Cypress!').should('be.visible')
  cy.contains('[data-cy-testingtype="e2e"]', 'Not Configured')
  cy.contains('[data-cy-testingtype="component"]', 'Not Configured')
  cy.contains('E2E Testing').click()
  cy.contains(opts.language === 'js' ? 'JavaScript' : 'TypeScript').click()
  cy.contains('Next').click()
  cy.contains('We added the following files to your project:')
  cy.contains('Continue').click()
}

function scaffoldAndOpenCTProject (opts: {
  name: Parameters<typeof cy.scaffoldProject>[0]
  language: 'js' | 'ts'
  framework: typeof WIZARD_FRAMEWORKS[number]['name']
  bundler?: typeof WIZARD_FRAMEWORKS[number]['supportedBundlers'][number]['name']
  args?: Parameters<typeof cy.openProject>[1]
  removeFixturesFolder?: boolean
}) {
  cy.scaffoldProject(opts.name)
  cy.openProject(opts.name, opts.args)

  if (opts.removeFixturesFolder) {
    // Delete the fixtures folder so it scaffold correctly the example
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.removeFileInProject('cypress/fixtures')
    })
  }

  cy.visitLaunchpad()

  cy.contains('Welcome to Cypress!').should('be.visible')
  cy.contains('[data-cy-testingtype="e2e"]', 'Not Configured')
  cy.contains('[data-cy-testingtype="component"]', 'Not Configured')
  cy.contains('Component Testing').click()
  cy.contains(opts.language === 'js' ? 'JavaScript' : 'TypeScript').click()

  cy.contains('React.js(detected)').click()
  cy.contains(opts.framework).click()
  if (opts.bundler) {
    cy.contains('Webpack(detected)').click()
    cy.contains(opts.bundler).click()
  }

  cy.contains('Next Step').click()

  cy.contains('Install Dev Dependencies').should('be.visible')
  cy.contains('button', 'Waiting for you to install the dependencies...').should('be.disabled')
  cy.contains('Skip').click()

  cy.contains('We added the following files to your project:')
  cy.contains('Continue').click()
}

function assertScaffoldedFilesAreCorrect (opts: { language: 'js' | 'ts', testingType: Cypress.TestingType, ctFramework?: string, customDirectory?: string}) {
  cy.withCtx((ctx) => ctx.currentProject).then((currentProject) => {
    cy.task<SnapshotScaffoldTestResult>('snapshotCypressDirectory', {
      currentProject,
      testingType: opts.testingType,
      language: opts.language,
      ctFramework: opts.ctFramework,
      customDirectory: opts.customDirectory,
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
    const language = 'js'

    scaffoldAndOpenE2EProject({ name: 'pristine', language, removeFixturesFolder: true })
    assertScaffoldedFilesAreCorrect({ language, testingType: 'e2e' })
  })

  it('scaffolds E2E for a TS project', () => {
    const language = 'ts'

    scaffoldAndOpenE2EProject({ name: 'pristine', language, removeFixturesFolder: true })
    assertScaffoldedFilesAreCorrect({ language, testingType: 'e2e' })
  })

  it('scaffolds E2E and skip fixtures for a JS project', () => {
    const language = 'js'

    scaffoldAndOpenE2EProject({ name: 'pristine', language, removeFixturesFolder: false })
    assertScaffoldedFilesAreCorrect({ language, testingType: 'e2e', customDirectory: 'without-fixtures' })
  })

  it('scaffolds CT for a JS project', () => {
    const language = 'js'

    scaffoldAndOpenCTProject({ name: 'pristine', language, framework: 'Create React App', removeFixturesFolder: true })
    assertScaffoldedFilesAreCorrect({ language, testingType: 'component', ctFramework: 'Create React App (v5)' })
  })

  it('scaffolds CT for a TS project', () => {
    const language = 'ts'

    scaffoldAndOpenCTProject({ name: 'pristine', language, framework: 'Create React App', removeFixturesFolder: true })
    assertScaffoldedFilesAreCorrect({ language, testingType: 'component', ctFramework: 'Create React App (v5)' })
  })

  it('scaffolds CT and skip fixtures for a JS project', () => {
    const language = 'js'

    scaffoldAndOpenCTProject({ name: 'pristine', language, framework: 'Create React App', removeFixturesFolder: false })
    assertScaffoldedFilesAreCorrect({ language, testingType: 'component', ctFramework: 'Create React App (v5)', customDirectory: 'without-fixtures' })
  })
})
