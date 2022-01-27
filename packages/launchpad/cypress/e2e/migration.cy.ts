import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

const renameAutoStep = `[data-cy="migration-step renameAuto"]`
const renameManualStep = `[data-cy="migration-step renameManual"]`
const renameSupportStep = `[data-cy="migration-step renameSupport"]`
const configFileStep = `[data-cy="migration-step configFile"]`
const setupComponentStep = `[data-cy="migration-step setupComponent"]`

declare global {
  namespace Cypress {
    interface Chainable {
      waitForWizard(): Cypress.Chainable<JQuery<HTMLDivElement>>
    }
  }
}

Cypress.Commands.add('waitForWizard', () => {
  return cy.get('[data-cy="migration-wizard"]')
})

describe('Steps', () => {
  // note: see the README.md inside each of these projects
  // to understand why certain steps are shown.
  // eg system-tests/migration-e2e-fully-custom/README.md
  it('only shows update config file for highly customized project', () => {
    cy.scaffoldProject('migration-e2e-fully-custom')
    cy.openProject('migration-e2e-fully-custom')
    cy.visitLaunchpad()
    cy.waitForWizard()
    cy.get(renameAutoStep).should('not.exist')
    cy.get(renameManualStep).should('not.exist')
    cy.get(renameSupportStep).should('not.exist')
    cy.get(setupComponentStep).should('not.exist')
    cy.get(configFileStep).should('exist')
  })

  it('shows all e2e steps for an e2e project with all defaults', () => {
    cy.scaffoldProject('migration-e2e-defaults')
    cy.openProject('migration-e2e-defaults')
    cy.visitLaunchpad()
    cy.waitForWizard()
    cy.get(renameAutoStep).should('exist')
    cy.get(renameManualStep).should('not.exist')
    cy.get(renameSupportStep).should('exist')
    cy.get(configFileStep).should('exist')
    cy.get(setupComponentStep).should('not.exist')
  })

  it('shows all e2e steps for an e2e project with custom testFiles', () => {
    cy.scaffoldProject('migration-e2e-custom-test-files')
    cy.openProject('migration-e2e-custom-test-files')
    cy.visitLaunchpad()
    cy.waitForWizard()
    cy.get(renameAutoStep).should('exist')
    cy.get(renameManualStep).should('not.exist')
    cy.get(renameSupportStep).should('exist')
    cy.get(configFileStep).should('exist')
    cy.get(setupComponentStep).should('not.exist')
  })

  it('shows all e2e steps for an e2e project with custom testFiles', () => {
    cy.scaffoldProject('migration-e2e-custom-test-files')
    cy.openProject('migration-e2e-custom-test-files')
    cy.visitLaunchpad()
    cy.waitForWizard()
    cy.get(renameAutoStep).should('exist')
    cy.get(renameManualStep).should('not.exist')
    cy.get(renameSupportStep).should('exist')
    cy.get(configFileStep).should('exist')
    cy.get(setupComponentStep).should('not.exist')
  })

  it('shows all component steps for a component testing project w/o e2e set up', () => {
    cy.scaffoldProject('migration-component-testing')
    cy.openProject('migration-component-testing')
    cy.visitLaunchpad()
    cy.waitForWizard()
    cy.get(renameAutoStep).should('not.exist')
    cy.contains('Automatically rename existing specs').should('not.exist')
    cy.get(renameManualStep).should('exist')
    // supportFile: false in this project
    cy.get(renameSupportStep).should('not.exist')
    cy.get(configFileStep).should('exist')

    // we require re-configuring component testing,
    // even if you already had it set up.
    cy.get(setupComponentStep).should('exist')
  })
})

describe('Migration', { viewportWidth: 1200 }, () => {
  beforeEach(() => {
    cy.scaffoldProject('migration')
    cy.openProject('migration')
  })

  it('renames support file', () => {
    cy.visitLaunchpad()
    cy.findByText(`I'll do this later`).click()
    cy.findByText(`Rename the support file for me`).click()

    cy.withCtx(async (ctx) => {
      expect(
        await ctx.actions.file.checkIfFileExists(ctx.path.join('cypress', 'support', 'e2e.js')),
      ).not.to.be.null
    })
  })

  describe('Configuration', () => {
    beforeEach(() => {
      cy.visitLaunchpad()

      cy.findByText(`I'll do this later`).click()
      cy.findByText(defaultMessages.migration.wizard.step3.button).click()
      cy.findByText(defaultMessages.migration.wizard.step4.button).click()
    })

    it('should create the cypress.config.js file and delete old config', () => {
      cy.withCtx(async (ctx) => {
        const configStats = await ctx.actions.file.checkIfFileExists('cypress.config.js')

        expect(configStats).to.not.be.null.and.not.be.undefined

        const oldConfigStats = await ctx.actions.file.checkIfFileExists('cypress.json')

        expect(oldConfigStats).to.be.null
      })
    })

    it('should create a valid js file', () => {
      cy.withCtx(async (ctx) => {
        const configPath = ctx.path.join(ctx.lifecycleManager.projectRoot, 'cypress.config.js')

        const isValidJsFile = ctx.file.isValidJsFile(configPath)

        expect(isValidJsFile).to.be.true
      })
    })
  })

  describe('File Renames', () => {
    it('should move files to correct location', () => {
      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject('cypress.json', '{}')
      })

      cy.visitLaunchpad()
      cy.findByText(defaultMessages.migration.wizard.step1.button).click()

      cy.withCtx(async (ctx) => {
        const e2eDirPath = ctx.path.join('cypress', 'e2e')
        const files = [
          'app.cy.js',
          'blog-post.cy.ts',
          'company.cy.js',
          'home.cy.js',
          'sign-up.cy.js',
          'spectacleBrowser.cy.ts',
          ctx.path.join('someDir', 'someFile.js'),
        ].map((file) => ctx.path.join(e2eDirPath, file))

        for (let i = 0; i < files.length; i++) {
          const stats = await ctx.actions.file.checkIfFileExists(files[i])

          expect(stats).to.not.be.null
        }
      })
    })
  })

  describe('Full flow', () => {
    it('goes to each step', () => {
      cy.visitLaunchpad()

      cy.findByText(defaultMessages.migration.wizard.step2.button).click()
      cy.findByText(defaultMessages.migration.wizard.step3.button).click()
      cy.findByText(defaultMessages.migration.wizard.step4.button).click()
      cy.findByText(defaultMessages.migration.wizard.step5.button).click()
      cy.findByText('Welcome to Cypress!').should('be.visible')
    })
  })
})
