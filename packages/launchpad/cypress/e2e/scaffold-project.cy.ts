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
  cy.contains('We added the following files to your project:')
  cy.contains('Continue').click()
  // Going through the loading of config
  cy.get('[data-cy="loading-spinner"]')
  cy.get('[data-cy="loading-spinner"]').should('not.exist')
  // No errors were encountered
  cy.get('[data-testid="error-header"]').should('not.exist')
  // Asserts that we've made it through the flow
  cy.contains('Choose a browser')
}

function scaffoldAndOpenCTProject (opts: {
  name: Parameters<typeof cy.scaffoldProject>[0]
  framework: Cypress.ResolvedComponentFrameworkDefinition['name']
  bundler?: Cypress.ResolvedComponentFrameworkDefinition['supportedBundlers'][number]
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

  cy.contains('Pick a framework').click()
  cy.contains(opts.framework).click()
  if (opts.bundler) {
    cy.contains('Webpack(detected)').click()
    cy.contains(opts.bundler).click()
  }

  cy.contains('Next step').click()

  cy.contains(cy.i18n.setupWizard.installDependencies.title).should('be.visible')
  cy.contains('button', cy.i18n.setupWizard.installDependencies.waitForInstall).should('be.disabled')
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

    scaffoldAndOpenE2EProject({ name: 'pristine', removeFixturesFolder: true })
    assertScaffoldedFilesAreCorrect({ language, testingType: 'e2e' })
  })

  it('scaffolds E2E for a TS project', () => {
    const language = 'ts'

    scaffoldAndOpenE2EProject({ name: 'pristine-yarn', removeFixturesFolder: true })
    assertScaffoldedFilesAreCorrect({ language, testingType: 'e2e' })
  })

  it('scaffolds E2E for a project of type module', () => {
    const language = 'js'

    scaffoldAndOpenE2EProject({ name: 'pristine-module', removeFixturesFolder: true })
    assertScaffoldedFilesAreCorrect({ language, testingType: 'e2e' })
  })

  it('scaffolds E2E and skip fixtures for a JS project', () => {
    const language = 'js'

    scaffoldAndOpenE2EProject({ name: 'pristine', removeFixturesFolder: false })
    assertScaffoldedFilesAreCorrect({ language, testingType: 'e2e', customDirectory: 'without-fixtures' })
  })

  it('scaffolds CT for a JS project', () => {
    const language = 'js'

    scaffoldAndOpenCTProject({ name: 'pristine', framework: 'Create React App', removeFixturesFolder: true })
    assertScaffoldedFilesAreCorrect({ language, testingType: 'component', ctFramework: 'Create React App (v5)' })
  })

  it('scaffolds CT for a TS project', () => {
    const language = 'ts'

    scaffoldAndOpenCTProject({ name: 'pristine-yarn', framework: 'Create React App', removeFixturesFolder: true })
    assertScaffoldedFilesAreCorrect({ language, testingType: 'component', ctFramework: 'Create React App (v5)' })
  })

  it('scaffolds CT and skip fixtures for a JS project', () => {
    const language = 'js'

    scaffoldAndOpenCTProject({ name: 'pristine', framework: 'Create React App', removeFixturesFolder: false })
    assertScaffoldedFilesAreCorrect({ language, testingType: 'component', ctFramework: 'Create React App (v5)', customDirectory: 'without-fixtures' })
  })

  // TODO: Fix flaky test
  it.skip('generates valid config file for pristine project without cypress installed', () => {
    cy.intercept('mutation-ScaffoldedFiles_completeSetup').as('mutationScaffoldedFiles')
    cy.intercept('query-MainLaunchpadQuery').as('mainLaunchpadQuery')
    cy.intercept('query-HeaderBar_HeaderBarQuery').as('headerBarQuery')
    cy.intercept('query-CloudViewerAndProject_RequiredData').as('cloudViewerAndProjectRequiredData')
    cy.scaffoldProject('pristine')
    cy.openProject('pristine')
    cy.withCtx((ctx) => ctx.currentProject).then((currentProject) => {
      cy.task('uninstallDependenciesInScaffoldedProject', { currentProject })
    })

    cy.visitLaunchpad()
    cy.contains('button', cy.i18n.testingType.e2e.name).click()
    cy.contains('button', cy.i18n.setupPage.step.continue).click()
    cy.wait('@mutationScaffoldedFiles')
    cy.wait('@mainLaunchpadQuery')
    cy.wait('@headerBarQuery')
    cy.wait('@cloudViewerAndProjectRequiredData')
    cy.get('h1').contains(cy.i18n.setupPage.testingCard.chooseABrowser).should('be.visible')

    cy.withCtx(async (ctx) => {
      let config = await ctx.actions.file.readFileInProject('cypress.config.js')

      expect(config).not.to.contain('defineConfig')
    })
  })
})
