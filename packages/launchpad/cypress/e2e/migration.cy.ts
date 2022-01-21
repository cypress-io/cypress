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
        const stats = await ctx.actions.file.checkIfFileExists('cypress.config.js')

        expect(stats).to.not.be.null.and.not.be.undefined

        let doesFileExist = true

        try {
          await ctx.actions.file.checkIfFileExists('cypress.json')
        } catch (error) {
          doesFileExist = false
        }

        expect(doesFileExist).to.be.false
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

  describe('Full flow', () => {
    it('goes to each step', () => {
      cy.visitLaunchpad()

      cy.findByText(defaultMessages.migration.wizard.step1.button).click()
      cy.findByText(defaultMessages.migration.wizard.step2.button).click()
      cy.findByText(defaultMessages.migration.wizard.step3.button).click()
      cy.findByText(defaultMessages.migration.wizard.step4.button).click()
      cy.findByText(defaultMessages.migration.wizard.step5.button).click()
    })
  })
})
