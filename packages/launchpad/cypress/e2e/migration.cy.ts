import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

describe('Migration', () => {
  beforeEach(() => {
    cy.scaffoldProject('migration')
    cy.openProject('migration')
  })

  describe('Configuration', () => {
    beforeEach(() => {
      cy.visitLaunchpad()
      cy.findByText(defaultMessages.migration.wizard.step1.button).click()
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
      cy.visitLaunchpad()
    })

    it('should move files to correct location', () => {
      cy.findByText(defaultMessages.migration.wizard.step1.button).click()

      cy.withCtx(async (ctx) => {
        const e2eDirPath = ctx.path.join('cypress', 'e2e')
        const files = ['app.cy.js', 'blog-post.cy.ts', 'company.cy.js', 'home.cy.js', 'sign-up.cy.js', 'spectacleBrowser.cy.ts'].map((file) => ctx.path.join(e2eDirPath, file))

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

      cy.findByText(defaultMessages.migration.wizard.step1.button).click()
      cy.findByText(defaultMessages.migration.wizard.step2.button).click()
      cy.findByText(defaultMessages.migration.wizard.step3.button).click()
      cy.findByText(defaultMessages.migration.wizard.step4.button).click()
      cy.findByText(defaultMessages.migration.wizard.step5.button).click()

      cy.findByText(defaultMessages.setupWizard.selectFramework.description).should('be.visible')
    })
  })
})
