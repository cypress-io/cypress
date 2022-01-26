import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

describe('Steps', () => {
  it('only shows update config file for highly customized project', () => {
    cy.scaffoldProject('migration-e2e-fully-custom')
    cy.openProject('migration-e2e-fully-custom')
    cy.visitLaunchpad()
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

      cy.findByText(defaultMessages.migration.wizard.step2.button).click()
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
    beforeEach(() => {
      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject('cypress.json', '{}')
      })

      cy.visitLaunchpad()
    })

    it('should move files to correct location', () => {
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
      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject('cypress.json', '{}')
      })

      cy.visitLaunchpad()

      cy.findByText(defaultMessages.migration.wizard.step1.button).click()
      cy.findByText(defaultMessages.migration.wizard.step2.button).click()
      cy.findByText(defaultMessages.migration.wizard.step3.button).click()
      cy.findByText(defaultMessages.migration.wizard.step4.button).click()
      cy.findByText(defaultMessages.migration.wizard.step5.button).click()

      // cy.findByText(defaultMessages.setupWizard.selectFramework.description).should('be.visible')
    })
  })
})
