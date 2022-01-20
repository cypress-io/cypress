describe('Migration', () => {
  beforeEach(() => {
    cy.scaffoldProject('migration')
    cy.openProject('migration')
    cy.visitLaunchpad()
  })

  describe('Configuration', () => {
    it('should create the cypress.config.js file and delete old config', () => {
      cy.get('[data-cy="convertConfigButton"]').click()

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
      cy.get('[data-cy="convertConfigButton"]').click()

      cy.withCtx(async (ctx) => {
        const configPath = ctx.path.join(ctx.lifecycleManager.projectRoot, 'cypress.config.js')

        const isValidJsFile = ctx.file.isValidJsFile(configPath)

        expect(isValidJsFile).to.be.true
      })
    })

    it('should have the correct file contents', () => {
      cy.get('[data-cy="convertConfigButton"]').click()

      cy.withCtx(async (ctx) => {
        const configPath = ctx.path.join(ctx.lifecycleManager.projectRoot, 'cypress.config.js')
        const fixturePath = ctx.path.join(ctx.lifecycleManager.projectRoot, 'cypress/fixtures/cypress.config.js')
        const config = await (await ctx.fs.readFile(configPath)).toString().replace(/\s/g, '')
        const fixture = await (await ctx.fs.readFile(fixturePath)).toString().replace(/\s/g, '')

        expect(config).to.eq(fixture)
      })
    })
  })
})
